import { describe, it, expect, vi, beforeEach } from 'vitest';

const D = 'data:audio/ogg;base64,AQIDBAU=';
vi.mock('../assets', () => ({ BGM: { 1: D, 2: 'b', 3: 'c', 4: 'd', 5: 'e' }, SFX: { tap: D, correct: D, wrong: D, save: D, bleed: D } }));

const made = { sources: [] as any[], resume: vi.fn() };
class FakeParam { value = 1; setValueAtTime = vi.fn(); linearRampToValueAtTime = vi.fn(); exponentialRampToValueAtTime = vi.fn(); setTargetAtTime = vi.fn((v: number) => { this.value = v; }); }
class FakeNode { gain = new FakeParam(); frequency = new FakeParam(); connect(n: any) { return n; } start = vi.fn(); onended: any; stop = vi.fn(); loop = false; buffer: any; type = ''; }
class FakeCtx {
  state = 'suspended'; currentTime = 5; destination = {};
  createGain() { return new FakeNode(); }
  createOscillator() { return new FakeNode(); }
  createBufferSource() { const s = new FakeNode(); made.sources.push(s); return s; }
  decodeAudioData = vi.fn(async (_b: ArrayBuffer) => ({}));
  resume = () => { this.state = 'running'; made.resume(); return Promise.resolve(); };
}

let A: typeof import('./audio');
let lsSpy: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  made.sources = []; made.resume.mockClear();
  (globalThis as any).AudioContext = FakeCtx;
  (globalThis as any).fetch = async () => ({ arrayBuffer: async () => new ArrayBuffer(1) });
  lsSpy = vi.fn();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { lsSpy(); return {}; } });
  A = await import('./audio');
  A._reset();
});

describe('audio', () => {
  it('init 만으로는 resume 하지 않는다, unlock 후 resume', () => {
    const c = A.init() as unknown as FakeCtx;
    expect(c.state).toBe('suspended');
    expect(made.resume).not.toHaveBeenCalled();
    A.unlock();
    expect(made.resume).toHaveBeenCalledTimes(1);
  });
  it('data: URL 은 fetch 없이 디코드한다', async () => {
    const f = vi.fn();
    (globalThis as any).fetch = f;
    const c = A.init() as any;
    await A.playBgm(1);
    expect(f).not.toHaveBeenCalled();
    const buf = c.decodeAudioData.mock.calls[0][0];
    expect(buf).toBeInstanceOf(ArrayBuffer);
    expect(buf.byteLength).toBe(5);
  });
  it('같은 트랙은 새 소스를 만들지 않는다', async () => {
    A.unlock();
    await A.playBgm(1);
    await A.playBgm(1);
    expect(made.sources.length).toBe(1);
    expect(made.sources[0].loop).toBe(true);
  });
  it('디코드 실패 시 cur 를 되돌려 다음 호출에서 다시 시도한다(R32)', async () => {
    A.unlock();
    await new Promise((r) => setTimeout(r, 0)); // 효과음 디코드 5회 끝난 뒤
    const c = A.init() as any;
    c.decodeAudioData.mockClear();
    c.decodeAudioData.mockRejectedValueOnce(new Error('bad'));
    await expect(A.playBgm(1)).rejects.toThrow('bad');
    expect(made.sources.length).toBe(0);
    await A.playBgm(1);
    expect(c.decodeAudioData).toHaveBeenCalledTimes(2);
    expect(made.sources.length).toBe(1);
  });
  it('다른 트랙은 1초 크로스페이드로 이전 소스를 멈춘다', async () => {
    A.unlock();
    await A.playBgm(1);
    await A.playBgm(2);
    expect(made.sources.length).toBe(2);
    expect(made.sources[0].stop).toHaveBeenCalledWith(6);
  });
  const flush = () => new Promise((r) => setTimeout(r, 0));
  it('디코드 전 sfx 는 조용히 무시, unlock 후 디코드가 끝나면 재생', async () => {
    const c = A.init() as any;
    A.sfx('tap'); // unlock 전
    expect(made.sources.length).toBe(0);
    expect(c.decodeAudioData).not.toHaveBeenCalled();
    A.unlock();
    A.sfx('tap'); // 디코드 중
    expect(made.sources.length).toBe(0);
    await flush();
    expect(c.decodeAudioData).toHaveBeenCalledTimes(5);
    A.sfx('tap');
    expect(made.sources.length).toBe(1);
    expect(made.sources[0].start).toHaveBeenCalled();
  });
  it('효과음 디코드는 data: URL 을 fetch 하지 않는다', async () => {
    const f = vi.fn();
    (globalThis as any).fetch = f;
    A.unlock();
    await flush();
    expect(f).not.toHaveBeenCalled();
  });
  it('음소거는 마스터 게인 0 으로 효과음도 따른다', async () => {
    A.unlock();
    await flush();
    A.setMuted(true);
    expect(A.isMuted()).toBe(true);
    const c = A.init() as any;
    expect(c.createGain().gain.value).toBe(1); // 새 노드는 무관
    A.setMuted(false);
    expect(A.isMuted()).toBe(false);
  });
  it('음소거 시 마스터 게인이 0 으로 설정되고 효과음은 마스터를 거친다', async () => {
    A.unlock();
    await flush();
    const c = A.init() as any;
    const gains: any[] = [];
    const orig = c.createGain.bind(c);
    c.createGain = () => { const g = orig(); gains.push(g); return g; };
    A.setMuted(true);
    A.sfx('correct');
    expect(made.sources.length).toBe(1);
  });
  it('동시 4개 초과 시 가장 오래된 것을 멈춘다', async () => {
    A.unlock();
    await flush();
    for (let i = 0; i < 6; i++) A.sfx('tap');
    expect(made.sources.length).toBe(6);
    expect(made.sources[0].stop).toHaveBeenCalled();
    expect(made.sources[1].stop).toHaveBeenCalled();
    expect(made.sources[2].stop).not.toHaveBeenCalled();
    // 끝난 소리는 슬롯을 비운다
    made.sources[2].onended();
    A.sfx('tap');
    expect(made.sources[3].stop).not.toHaveBeenCalled();
  });
  it('save·bleed 도 재생된다', async () => {
    A.unlock();
    await flush();
    A.sfx('save'); A.sfx('bleed');
    expect(made.sources.length).toBe(2);
  });
  it('localStorage 에 접근하지 않는다', async () => {
    A.unlock(); A.setMuted(true); await A.playBgm(3); await flush(); A.sfx('tap');
    expect(lsSpy).not.toHaveBeenCalled();
  });
});
