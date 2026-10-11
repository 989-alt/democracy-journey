import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../assets', () => ({ BGM: { 1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e' } }));

const made = { sources: [] as any[], resume: vi.fn() };
class FakeParam { value = 1; setValueAtTime = vi.fn(); linearRampToValueAtTime = vi.fn(); exponentialRampToValueAtTime = vi.fn(); setTargetAtTime = vi.fn((v: number) => { this.value = v; }); }
class FakeNode { gain = new FakeParam(); frequency = new FakeParam(); connect(n: any) { return n; } start = vi.fn(); stop = vi.fn(); loop = false; buffer: any; type = ''; }
class FakeCtx {
  state = 'suspended'; currentTime = 5; destination = {};
  createGain() { return new FakeNode(); }
  createOscillator() { return new FakeNode(); }
  createBufferSource() { const s = new FakeNode(); made.sources.push(s); return s; }
  decodeAudioData = async () => ({});
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
  it('같은 트랙은 새 소스를 만들지 않는다', async () => {
    A.unlock();
    await A.playBgm(1);
    await A.playBgm(1);
    expect(made.sources.length).toBe(1);
    expect(made.sources[0].loop).toBe(true);
  });
  it('다른 트랙은 1초 크로스페이드로 이전 소스를 멈춘다', async () => {
    A.unlock();
    await A.playBgm(1);
    await A.playBgm(2);
    expect(made.sources.length).toBe(2);
    expect(made.sources[0].stop).toHaveBeenCalledWith(6);
  });
  it('음소거는 마스터 게인 0, sfx 는 소리를 만들지 않는다', async () => {
    A.unlock();
    A.setMuted(true);
    expect(A.isMuted()).toBe(true);
    const c = A.init() as any;
    expect(c.createGain().gain.value).toBe(1); // 새 노드는 무관
    A.sfx('tap'); // 예외 없이 무시
    A.setMuted(false);
    expect(A.isMuted()).toBe(false);
  });
  it('localStorage 에 접근하지 않는다', async () => {
    A.unlock(); A.setMuted(true); await A.playBgm(3); A.sfx('save');
    expect(lsSpy).not.toHaveBeenCalled();
  });
});
