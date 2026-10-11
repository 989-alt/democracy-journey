import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clear, load, save, SAVE_KEY } from './save';
import { initialState, currentScene, retryTargets } from './state';
import type { Action, JudgeAnswer, State } from './state';
import { reduce } from './reducer';
import { CONTENT, sceneOrder } from '../content';
import type { JudgeKind } from '../content/types';

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

// QA r2 #0: 실제 리듀서로 완주하며 액션마다 저장 → load 왕복. 오답(①~⑤ 전부 재출제 큐 진입)·오개념 선택·다시 보기 오답→정답·복원 포함.
const J = CONTENT.judges;
function wrongAnswer(kind: JudgeKind): JudgeAnswer {
  switch (kind) {
    case 'poll': return { kind, tapped: [] };
    case 'appeal': return { kind, why: J.appeal.why.find((w) => !w.correct)!.id };
    case 'source': return { kind, cards: {} };
    case 'pledge': {
      const [a, b] = J.pledge.candidates;
      return { kind, scores: Object.fromEntries(J.pledge.candidates.map((c) => [c.id, (c.id === a.id ? [5, 5, 5] : [1, 1, 1]) as [number, number, number]])), vote: b.id };
    }
    case 'organ': return { kind, placed: {}, checks: {} };
  }
}
function playAll(onStep: (s: State, a: Action) => void): State {
  let s = reduce(initialState(3), { type: 'start', seed: 3, t: 0 });
  let t = 0;
  const step = (a: Action) => { s = reduce(s, a); onStep(s, a); };
  for (let i = 0; i < 500 && s.stage === 'play'; i++) {
    const sc = currentScene(s);
    if ((sc.kind === 'story' || sc.kind === 'culture') && s.chosen[sc.id] === undefined) {
      const open = sc.options.filter((o) => !(o.lock && s.stats[o.lock.stat] < o.lock.min));
      const opt = open.find((o) => o.misconception) ?? open[open.length - 1]; // 오개념 선택지 우선(머묾 경로)
      step({ type: 'choose', sceneId: sc.id, optionId: opt.id, t: ++t });
    } else if (sc.kind === 'judge' && !s.judges[sc.judge!]) {
      step({ type: 'judge', kind: sc.judge!, answer: wrongAnswer(sc.judge!), t: ++t });
    } else {
      if (sc.kind === 'retry') {
        // 첫 다시 보기는 오답(attempts 0→1), 다음은 정답
        for (const q of retryTargets(s.retryQueue, s.log, sc.chapter)) step({ type: 'retry', kind: q.kind, item: q.item, correct: q.attempts > 0, t: ++t });
      }
      if (i === 20) step({ type: 'restore', state: s, t: ++t });
      step({ type: 'next', t: ++t });
    }
  }
  return s;
}

describe('load 검증 — 실제 리듀서 저장본은 보존(QA r2 #0 과잉 폐기 방지)', () => {
  it('완주 중 액션마다 저장본이 load 왕복, 모든 이벤트 type 과 ①~⑤ 재출제 큐를 거친다', () => {
    const seen = new Set<string>();
    const kinds = new Set<string>();
    let maxAttempts = 0;
    const end = playAll((s) => {
      save(s);
      expect(load()).toEqual(s);
      s.log.forEach((e) => seen.add(e.type));
      s.retryQueue.forEach((q) => { kinds.add(q.kind); maxAttempts = Math.max(maxAttempts, q.attempts); });
    });
    expect(end.stage).toBe('done');
    for (const ty of ['choice', 'culture', 'judge', 'compare_view', 'chapter_end', 'retry', 'restore']) expect(seen).toContain(ty);
    for (const k of ['poll', 'appeal', 'source', 'pledge', 'organ']) expect(kinds).toContain(k);
    expect(maxAttempts).toBe(1);
  });
});

describe('load 검증 — log·retryQueue 손상 폐기(QA r2 #0)', () => {
  const bad = (s: object) => { ls.setItem(SAVE_KEY, JSON.stringify(s)); return load(); };
  it('Sol 재현 ①: organ judge 이벤트 item 이 숫자', () => {
    expect(bad({ ...initialState(7), stage: 'done', log: [{ t: 1, type: 'judge', kind: 'organ', chapter: 5, item: 1, correct: false, attempt: 1 }] })).toBeNull();
  });
  it('Sol 재현 ②: retryQueue poll item missing', () => {
    expect(bad({ ...initialState(7), stage: 'play', sceneIndex: sceneOrder.indexOf('c2-s10'), retryQueue: [{ kind: 'poll', item: 'missing', attempts: 0 }] })).toBeNull();
  });
  it('retryQueue: 모르는 kind·문항 id 체계 어긋남·attempts 범위·비정수', () => {
    const s = { ...initialState(7), stage: 'play' };
    const spot = J.poll.spots[0].id;
    expect(bad({ ...s, retryQueue: [{ kind: 'poll', item: spot, attempts: 1 }] })).not.toBeNull();
    expect(bad({ ...s, retryQueue: [{ kind: 'organ', item: `card:${J.organ.cards[0].id}`, attempts: 0 }] })).not.toBeNull();
    expect(bad({ ...s, retryQueue: [{ kind: 'bogus', item: spot, attempts: 0 }] })).toBeNull();
    expect(bad({ ...s, retryQueue: [{ kind: 'appeal', item: spot, attempts: 0 }] })).toBeNull();
    expect(bad({ ...s, retryQueue: [{ kind: 'organ', item: J.organ.cards[0].id, attempts: 0 }] })).toBeNull();
    expect(bad({ ...s, retryQueue: [{ kind: 'poll', item: spot, attempts: 2 }] })).toBeNull();
    expect(bad({ ...s, retryQueue: [{ kind: 'poll', item: spot, attempts: 0.5 }] })).toBeNull();
    expect(bad({ ...s, retryQueue: [{ kind: 'poll', item: spot, attempts: -1 }] })).toBeNull();
    expect(bad({ ...s, retryQueue: [{ kind: 'pledge', item: 'vote', attempts: 1 }] })).toBeNull();
    expect(bad({ ...s, retryQueue: [null] })).toBeNull();
  });
  it('log: type 별 필수 필드·원시 타입', () => {
    const s = { ...initialState(7), stage: 'play' };
    const ev = (e: object) => bad({ ...s, log: [e] });
    expect(ev({ t: 1, type: 'chapter_end', chapter: 1 })).not.toBeNull();
    expect(ev({ t: 1, type: 'chapter_end', chapter: 9 })).toBeNull();
    expect(ev({ t: 1, type: 'bogus', chapter: 1 })).toBeNull();
    expect(ev({ t: 'x', type: 'restore', chapter: 1 })).toBeNull();
    expect(ev({ t: 1, type: 'choice', chapter: 1, scene: 'c1-s03', option: 'b', delta: { info: -1 } })).not.toBeNull();
    expect(ev({ t: 1, type: 'choice', chapter: 1, scene: 'c1-s03' })).toBeNull();
    expect(ev({ t: 1, type: 'choice', chapter: 1, scene: 'nope', option: 'b' })).toBeNull();
    expect(ev({ t: 1, type: 'choice', chapter: 1, scene: 'c1-s03', option: 'b', delta: { info: 'x' } })).toBeNull();
    expect(ev({ t: 1, type: 'choice', chapter: 1, scene: 'c1-s03', option: 'b', misconception: 3 })).toBeNull();
    expect(ev({ t: 1, type: 'culture', chapter: 1, scene: 'c1-s03', option: 'b' })).toBeNull();
    expect(ev({ t: 1, type: 'compare_view', chapter: 1, scene: 'c1-s03', item: 1 })).toBeNull();
    expect(ev({ t: 1, type: 'judge', kind: 'appeal', chapter: 2, item: 'why', correct: true, attempt: 2 })).not.toBeNull();
    expect(ev({ t: 1, type: 'judge', kind: 'appeal', chapter: 2, item: 'why', correct: true, attempt: 4 })).toBeNull();
    expect(ev({ t: 1, type: 'judge', kind: 'appeal', chapter: 2, item: 'why', correct: 'y', attempt: 1 })).toBeNull();
    expect(ev({ t: 1, type: 'judge', kind: 'appeal', chapter: 2, item: 'nope', correct: true, attempt: 1 })).toBeNull();
    expect(ev({ t: 1, type: 'retry', kind: 'poll', chapter: 2, item: J.poll.spots[0].id, correct: false })).toBeNull();
    expect(ev(null as unknown as object)).toBeNull();
  });
});
