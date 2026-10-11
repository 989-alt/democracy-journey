import { BGM } from '../assets';

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

/** 첫 pointerdown 에서 호출. 그 전에는 context 만 만들고 resume 하지 않는다. */
export function unlock(): void {
  const c = init();
  if (c.state === 'suspended') void c.resume();
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
  const buf = await load(n);
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
const NOTES: Record<SfxName, [number, number, OscillatorType][]> = {
  tap: [[660, 0.06, 'triangle']],
  correct: [[523, 0.12, 'sine'], [784, 0.2, 'sine']],
  wrong: [[220, 0.18, 'sawtooth'], [165, 0.25, 'sawtooth']],
  save: [[880, 0.08, 'sine'], [1175, 0.1, 'sine']],
  bleed: [[330, 0.5, 'sine']],
};
export function sfx(name: SfxName): void {
  if (!ctx || ctx.state !== 'running' || muted || !master) return;
  let t = ctx.currentTime;
  for (const [f, d, type] of NOTES[name]) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + d + 0.02);
    t += d * 0.8;
  }
}

/** 테스트용 초기화 */
export function _reset(): void {
  ctx = master = curGain = null; curSrc = null; cur = 0; muted = false; cache.clear();
}
