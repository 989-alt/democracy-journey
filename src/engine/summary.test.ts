import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONTENT } from '../content';
import { clearAndReset, summarize, playTime, shorten } from './summary';
import { initialState } from './state';
import type { LogEvent, State } from './state';
import { SAVE_KEY } from './save';

const MIN = 60_000;
const base = (log: LogEvent[], patch: Partial<State> = {}): State => ({ ...initialState(1), stage: 'done', log, ...patch });
const J = (kind: LogEvent['kind'], item: string, correct: boolean, attempt = 1, t = 0): LogEvent =>
  ({ t, type: 'judge', chapter: 1, kind, item, correct, attempt });

describe('summarize', () => {
  it('정답률: (kind,item) 최종 attempt 기준', () => {
    const log = [
      J('poll', 'bribe', false, 1), J('poll', 'group', true, 1), J('appeal', 'why', false, 1),
      { t: 0, type: 'retry', chapter: 1, kind: 'poll', item: 'bribe', correct: false, attempt: 2 },
      J('poll', 'bribe', true, 3),
    ] as LogEvent[];
    const s = summarize(base(log));
    expect(s.judged).toEqual({ total: 3, correct: 2 });
    expect(s.wrongItems.map((w) => w.item)).toEqual(['why']);
  });

  it('틀린 문제: 최종 오답만, 정답 문구 포함', () => {
    const log = [
      J('poll', 'bribe', false), J('poll', 'group', false), J('appeal', 'why', false), J('source', 'rumor', false),
      J('pledge', 'vote', false), J('organ', 'card:law', false), J('organ', 'check:veto', false),
      J('poll', 'group', true, 2),
    ];
    const s = summarize(base(log));
    expect(s.wrongItems.map((w) => w.item)).toEqual(['bribe', 'why', 'rumor', 'vote', 'card:law', 'check:veto']);
    const by = Object.fromEntries(s.wrongItems.map((w) => [w.item, w.answer]));
    expect(by.bribe).toBe(CONTENT.judges.poll.spots[0].explain);
    expect(by.why).toBe('권력이 한곳에 모여 서로 견제하지 못해서');
    expect(by.rumor).toContain('낮음');
    expect(by['card:law']).toBe('국회');
    expect(by['check:veto']).toBe("'법률안 거부권' — 행정부 → 국회");
    for (const w of s.wrongItems) { expect(w.question.length).toBeGreaterThan(0); expect(w.answer.length).toBeGreaterThan(0); }
  });

  it('연표: 고정 순서, 선택과 무관 (M23)', () => {
    const labels = CONTENT.timeline.map((e) => e.label);
    const a = summarize(base([], { chosen: {} }));
    const first = CONTENT.scenes.filter((x) => x.kind === 'story');
    const chosen = Object.fromEntries(first.map((sc) => [sc.id, sc.options[sc.options.length - 1].id]));
    const b = summarize(base([], { chosen }));
    expect(a.timeline.map((e) => e.label)).toEqual(labels);
    expect(b.timeline.map((e) => e.label)).toEqual(labels);
    expect(labels.slice(0, 4)).toEqual(['3·15 부정 선거', '김주열 학생 발견', '4·19 혁명', '이승만 대통령 하야']);
    expect(b.timeline.slice(0, 4).map((e) => e.label)).toEqual(labels.slice(0, 4));
    const ch = b.timeline.map((e) => e.chapter);
    expect([...ch].sort()).toEqual(ch);
  });

  it('선택 메모: 장마다 최대 2개, 장면 순서, 14자+… 로 줄임', () => {
    const chosen = Object.fromEntries(CONTENT.scenes.filter((x) => x.options.length).map((sc) => [sc.id, sc.options[0].id]));
    const s = summarize(base([], { chosen }));
    for (const c of [1, 2, 3, 4, 5] as const) expect(s.memos[c].length).toBeLessThanOrEqual(2);
    const first = CONTENT.scenes.find((x) => x.chapter === 1 && x.options.length)!;
    expect(s.memos[1][0]).toBe(shorten(first.options[0].label));
    for (const c of [1, 2, 3, 4, 5] as const) for (const m of s.memos[c]) expect(m.length).toBeLessThanOrEqual(15);
    expect(shorten('가'.repeat(20))).toBe('가'.repeat(14) + '…');
    expect(shorten('짧은 글')).toBe('짧은 글');
  });

  it('도달 지점: 완주 / 진행 중 최대 장', () => {
    expect(summarize(base([])).reachedChapter).toBe('완주');
    const log = [{ t: 0, type: 'scene', chapter: 2 }, { t: 1, type: 'scene', chapter: 3 }] as LogEvent[];
    expect(summarize(base(log, { stage: 'play' })).reachedChapter).toBe(3);
  });
});

describe('플레이 시간', () => {
  it('t 차이 합, 10분 초과 공백은 제외', () => {
    const log = [0, 30_000, 30_000 + 15 * MIN, 30_000 + 15 * MIN + 45_000].map((t) => ({ t, type: 'scene', chapter: 1 })) as LogEvent[];
    expect(playTime(log)).toBe(75_000);
    expect(summarize(base(log)).playMs).toBe(75_000);
  });
  it('빈 로그 0', () => expect(playTime([])).toBe(0));
});

describe('저장소', () => {
  let removed: string[]; let reads: number;
  beforeEach(() => {
    removed = []; reads = 0;
    vi.stubGlobal('localStorage', { getItem: () => { reads++; return null; }, setItem: () => {}, removeItem: (k: string) => removed.push(k) });
  });
  afterEach(() => vi.unstubAllGlobals());
  it('summarize 는 localStorage 를 읽지 않는다', () => {
    summarize(base([J('poll', 'bribe', true)]));
    expect(reads).toBe(0);
  });
  it('clearAndReset: clear() 후 reset 디스패치', () => {
    const calls: unknown[] = [];
    clearAndReset((a) => { calls.push({ a, removedAtDispatch: [...removed] }); }, 5);
    expect(calls).toEqual([{ a: { type: 'reset', t: 5 }, removedAtDispatch: [SAVE_KEY] }]);
  });
});
