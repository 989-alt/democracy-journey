import { BGM, SFX } from '../assets';

type Ctx = AudioContext;
let ctx: Ctx | null = null;
let master: GainNode | null = null;
let muted = false;
let cur = 0;
let curGain: GainNode | null = null;
let curSrc: AudioBufferSourceNode | null = null;
const cache = new Map<number, AudioBuffer>();

export function init(): Ctx {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function setMuted(m: boolean): void {
  muted = m;
  if (ctx && master) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.05);
}
export const isMuted = () => muted;

type Track = 1 | 2 | 3 | 4 | 5;

/** CSP connect-src 'none' 때문에 data: URL 은 fetch 없이 직접 디코드한다. */
async function bytes(url: string): Promise<ArrayBuffer> {
  if (!url.startsWith('data:')) return (await fetch(url)).arrayBuffer(); // dev 서버 URL
  const bin = atob(url.slice(url.indexOf(',') + 1));
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u.buffer;
}

async function load(n: Track): Promise<AudioBuffer> {
  let b = cache.get(n);
  if (!b) {
    b = await init().decodeAudioData(await bytes(BGM[n]));
    cache.set(n, b);
  }
  return b;
}

export async function playBgm(n: Track): Promise<void> {
  if (n === cur) return;
  cur = n;
  const c = init();
  const out = master;
  let buf: AudioBuffer;
  try {
    buf = await load(n);
  } catch (e) {
    if (cur === n) cur = 0; // 디코드 실패 → 다음 호출에서 다시 시도
    throw e;
  }
  if (cur !== n || !out) return; // 로딩 중 다른 트랙으로 바뀜
  const t = c.currentTime;
  if (curGain && curSrc) {
    curGain.gain.setValueAtTime(curGain.gain.value, t);
    curGain.gain.linearRampToValueAtTime(0, t + 1);
    curSrc.stop(t + 1);
  }
  const src = c.createBufferSource();
  const g = c.createGain();
  src.buffer = buf;
  src.loop = true;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.6, t + 1);
  src.connect(g).connect(out);
  src.start(t);
  curSrc = src;
  curGain = g;
}

export type SfxName = 'tap' | 'correct' | 'wrong' | 'save' | 'bleed';
const SFX_NAMES: SfxName[] = ['tap', 'correct', 'wrong', 'save', 'bleed'];
const MAX_VOICES = 4;
const sfxBufs = new Map<SfxName, AudioBuffer>();
let sfxLoading = false;
let voices: AudioBufferSourceNode[] = [];

async function loadSfx(): Promise<void> {
  if (sfxLoading) return;
  sfxLoading = true;
  const c = init();
  await Promise.all(SFX_NAMES.map(async (n) => {
    try {
      sfxBufs.set(n, await c.decodeAudioData(await bytes(SFX[n])));
    } catch { /* 한 개 실패해도 나머지는 쓴다 */ }
  }));
}

/** unlock 이후에만 디코드를 시작한다. 디코드 전 sfx() 는 조용히 무시. */
export function unlock(): void {
  const c = init();
  if (c.state === 'suspended') void c.resume();
  void loadSfx();
}

export function sfx(name: SfxName): void {
  const buf = sfxBufs.get(name);
  if (!ctx || ctx.state !== 'running' || !master || !buf) return;
  while (voices.length >= MAX_VOICES) voices.shift()!.stop();
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(master);
  src.onended = () => { voices = voices.filter((v) => v !== src); };
  src.start();
  voices.push(src);
}

/** 테스트용 초기화 */
export function _reset(): void {
  ctx = master = curGain = null; curSrc = null; cur = 0; muted = false; cache.clear(); sfxBufs.clear(); sfxLoading = false; voices = [];
}
