import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clear, load, save, SAVE_KEY } from './save';
import { initialState, currentScene } from './state';
import { reduce } from './reducer';

function fakeStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    raw: m,
  };
}
let ls: ReturnType<typeof fakeStorage>;
beforeEach(() => { ls = fakeStorage(); vi.stubGlobal('localStorage', ls); });
afterEach(() => vi.unstubAllGlobals());

const played = () => reduce(reduce(initialState(7), { type: 'start', seed: 7, t: 0 }), { type: 'next', t: 1 });

describe('save/load', () => {
  it('키는 dj.save.v1, 왕복 동일', () => {
    const s = played();
    save(s);
    expect(ls.raw.has('dj.save.v1')).toBe(true);
    expect(SAVE_KEY).toBe('dj.save.v1');
    expect(load()).toEqual(s);
  });
  it('저장본 없음 → null', () => expect(load()).toBeNull());
  it('version≠1 폐기', () => {
    ls.setItem(SAVE_KEY, JSON.stringify({ ...played(), version: 2 }));
    expect(load()).toBeNull();
  });
  it('손상 JSON 폐기', () => {
    ls.setItem(SAVE_KEY, '{"version":1,');
    expect(load()).toBeNull();
  });
  it('스키마 불일치 폐기(필드 누락·범위 밖 stats·sceneIndex)', () => {
    const s = played();
    const bad = (patch: object) => { ls.setItem(SAVE_KEY, JSON.stringify({ ...s, ...patch })); return load(); };
    expect(bad({ stats: { join: 9, info: 0, home: 0 } })).toBeNull();
    expect(bad({ sceneIndex: 9999 })).toBeNull();
    expect(bad({ log: 'x' })).toBeNull();
    expect(bad({ stage: 'bogus' })).toBeNull();
    expect(bad({ flags: undefined })).toBeNull();
    expect(bad({ satStep: 7 })).toBeNull();
  });
  it('judges 내부 손상 폐기(QA r1 #1): items null·kind 불일치·항목 필드 누락·모르는 키, chosen 값 비문자열', () => {
    const s = played();
    const bad = (patch: object) => { ls.setItem(SAVE_KEY, JSON.stringify({ ...s, ...patch })); return load(); };
    const okItem = { item: 'why', correct: true, attempt: 1 };
    expect(bad({ judges: { poll: { kind: 'poll', items: null } } })).toBeNull();
    expect(bad({ judges: { poll: { kind: 'appeal', items: [] } } })).toBeNull();
    expect(bad({ judges: { appeal: { kind: 'appeal', items: [{ item: 'why', correct: 'yes', attempt: 1 }] } } })).toBeNull();
    expect(bad({ judges: { appeal: { kind: 'appeal', items: [{ item: 'why', correct: true }] } } })).toBeNull();
    expect(bad({ judges: { appeal: { kind: 'appeal', items: [null] } } })).toBeNull();
    expect(bad({ judges: { bogus: { kind: 'bogus', items: [] } } })).toBeNull();
    expect(bad({ judges: { source: { kind: 'source', items: [{ item: 'radio', correct: false, attempt: 1, miss: 'x' }] } } })).toBeNull();
    expect(bad({ chosen: { 'c1-s02': 3 } })).toBeNull();
    expect(bad({ judges: { appeal: { kind: 'appeal', items: [okItem] }, source: { kind: 'source', items: [{ item: 'radio', correct: false, attempt: 1, miss: [0, 2], misconception: 'M14' }] } } })).not.toBeNull();
  });
  it('완주 저장본(stage done)은 그대로 복원, clear 하면 키 삭제', () => {
    const done = { ...played(), stage: 'done' as const };
    save(done);
    expect(load()?.stage).toBe('done');
    clear();
    expect(ls.raw.has(SAVE_KEY)).toBe(false);
    expect(load()).toBeNull();
  });
  it('복원 액션: 로그에 restore 한 줄, 장면 유지', () => {
    const s = played();
    const r = reduce(initialState(1), { type: 'restore', state: s, t: 99 });
    expect(r.sceneIndex).toBe(s.sceneIndex);
    expect(r.log.slice(-1)[0]).toMatchObject({ type: 'restore', t: 99, chapter: currentScene(s).chapter });
  });
  it('localStorage 가 없거나 던져도 죽지 않는다', () => {
    vi.stubGlobal('localStorage', { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } });
    expect(() => save(played())).not.toThrow();
    expect(load()).toBeNull();
    expect(() => clear()).not.toThrow();
    vi.unstubAllGlobals();
    expect(load()).toBeNull();
  });
});
