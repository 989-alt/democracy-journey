import { describe, expect, it } from 'vitest';
import { CONTENT } from '../content';
import type { JudgeKind } from '../content/types';
import { reduce } from './reducer';
import { currentScene, initialState } from './state';
import type { Action, JudgeAnswer, LogEvent, State } from './state';
import { verdict } from './verdict';

const J = CONTENT.judges;

// CONTENT 정답표에서 만든 만점 답안
function correctAnswer(kind: JudgeKind): JudgeAnswer {
  switch (kind) {
    case 'poll': return { kind, tapped: J.poll.spots.filter((s) => s.violation !== null).map((s) => s.id) };
    case 'appeal': return { kind, why: J.appeal.why.find((w) => w.correct)!.id };
    case 'source': return { kind, cards: Object.fromEntries(J.source.cards.map((c) => [c.id, { checks: [...c.answerChecks], trust: c.answerTrust }])) };
    case 'pledge': {
      const sum = (t: number[]) => t[0] + t[1] + t[2];
      const best = [...J.pledge.candidates].sort((a, b) => sum(b.truth) - sum(a.truth))[0];
      return { kind, scores: Object.fromEntries(J.pledge.candidates.map((c) => [c.id, [...c.truth] as [number, number, number]])), vote: best.id };
    }
    case 'organ': return {
      kind,
      placed: Object.fromEntries(J.organ.cards.map((c) => [c.id, c.organ])),
      checks: Object.fromEntries(J.organ.checks.map((c) => [c.id, c.to])),
    };
  }
}

// 실제 리듀서로 CONTENT 를 끝까지 돈다. 장면 선택은 pick 이 정한다(기본: 잠기지 않고 오개념 없는 첫 선택지).
function play(opts: { pick?: (s: State) => string; answer?: (k: JudgeKind) => JudgeAnswer } = {}): State {
  let s = reduce(initialState(1), { type: 'start', seed: 1, t: 0 });
  let t = 0;
  for (let i = 0; i < 400 && s.stage === 'play'; i++) {
    const sc = currentScene(s);
    let a: Action;
    if (sc.kind === 'story' || sc.kind === 'culture') {
      const free = sc.options.find((o) => !o.misconception && !(o.lock && s.stats[o.lock.stat] < o.lock.min))!;
      const id = sc.kind === 'culture' ? sc.culture!.answer : (opts.pick?.(s) ?? free.id);
      a = { type: 'choose', sceneId: sc.id, optionId: id, t: ++t };
    } else if (sc.kind === 'judge') {
      a = { type: 'judge', kind: sc.judge!, answer: (opts.answer ?? correctAnswer)(sc.judge!), t: ++t };
    } else a = { type: 'next', t: ++t };
    s = reduce(s, a);
  }
  return s;
}

const base = play();
const clone = (log: LogEvent[]) => log.map((e) => ({ ...e }));
const without = (pred: (e: LogEvent) => boolean) => base.log.filter((e) => !pred(e));
const patch = (pred: (e: LogEvent) => boolean, p: Partial<LogEvent>) =>
  clone(base.log).map((e) => (pred(e) ? { ...e, ...p } : e));
const isJ = (kind: JudgeKind, item?: string) => (e: LogEvent) => e.type === 'judge' && e.kind === kind && (item === undefined || e.item === item);

describe('통과 로그 — 실제 리듀서로 CONTENT 완주', () => {
  it('끝까지 돌면 done, 판정 통과', () => {
    expect(base.stage).toBe('done');
    expect(base.satStep).toBe(4);
    expect(base.log.filter((e) => e.type === 'chapter_end')).toHaveLength(5);
    expect(verdict(base.log)).toEqual({ pass: true, fails: [] });
  });
  it('knows_* 플래그 5개가 모두 켜지고 stats 는 0~3', () => {
    for (const k of ['poll', 'appeal', 'source', 'pledge', 'organ']) expect(base.flags).toContain(`knows_${k}`);
    expect(Object.values(base.stats).every((v) => v >= 0 && v <= 3)).toBe(true);
    expect(base.retryQueue).toEqual([]);
  });
  it('빈 로그는 전부 실패', () => {
    // S10 은 "오개념 0회" 라 빈 로그에서 참
    expect(verdict([]).fails).toEqual(['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9']);
  });
});

describe('S1~S10 하나씩 실패', () => {
  const only = (log: LogEvent[], key: string) => {
    const v = verdict(log);
    expect(v.pass).toBe(false);
    expect(v.fails).toEqual([key]);
  };
  it('S1 장 끝 하나 없음', () => only(without((e) => e.type === 'chapter_end' && e.chapter === 3), 'S1'));
  it('S2 judge 한 종류 없음 — 그 종류의 S 키(S6)도 함께 실패하는 것이 최소 조합', () => {
    expect(verdict(without(isJ('pledge'))).fails).toEqual(['S2', 'S6']);
  });
  it('S3 위반 4개 중 2개만 정답(≥3 미달)', () => {
    const log = patch((e) => isJ('poll', 'bribe')(e) || isJ('poll', 'group')(e), { correct: false });
    only(log, 'S3');
  });
  it('S3 함정을 눌렀다(최종 attempt 에서 오답)', () => only(patch(isJ('poll', 'trap_curtain'), { correct: false }), 'S3'));
  it('S4 호소 이유 오답', () => only(patch(isJ('appeal', 'why'), { correct: false }), 'S4'));
  it('S5 정보 카드 2장만 정답', () => {
    only(patch((e) => isJ('source', 'radio')(e) || isJ('source', 'letter')(e), { correct: false }), 'S5');
  });
  it('S6 최종 투표가 오답', () => only(patch(isJ('pledge', 'vote'), { correct: false }), 'S6'));
  it('S7 견제 방향 1개만 정답', () => {
    only(patch((e) => isJ('organ', 'check:audit')(e) || isJ('organ', 'check:veto')(e), { correct: false }), 'S7');
  });
  it('S7 분류 5개만 정답', () => {
    const items = ['card:law', 'card:audit', 'card:trial'];
    only(patch((e) => e.type === 'judge' && e.kind === 'organ' && items.includes(e.item!), { correct: false }), 'S7');
  });
  it('S8 비교 카드 하나 안 봄', () => only(without((e) => e.type === 'compare_view' && e.item === '4'), 'S8'));
  it('S9 문화 사례 3개만 정답', () => {
    const cult = base.log.filter((e) => e.type === 'culture');
    const ids = cult.slice(0, 2).map((e) => e.scene);
    only(patch((e) => e.type === 'culture' && ids.includes(e.scene), { correct: false }), 'S9');
  });
  it('S10 최종 attempt 에 M11(호소 이유 오답)이 남음', () => {
    only(patch(isJ('appeal', 'why'), { misconception: 'M11' }), 'S10');
  });
  it('S10 M14 — 3장 방송 믿기 선택', () => {
    const s = play({ pick: (st) => (currentScene(st).id === 'c3-s04' ? 'a' : currentScene(st).options.find((o) => !o.misconception && !(o.lock && st.stats[o.lock.stat] < o.lock.min))?.id ?? 'a') });
    expect(s.log.find((e) => e.type === 'choice' && e.scene === 'c3-s04')?.misconception).toBe('M14');
    expect(verdict(s.log)).toEqual({ pass: false, fails: ['S10'] });
  });
  it('S10 M25 — 4장 회상 장면 "5·18 결과" 선택', () => {
    const s = play({ pick: (st) => (currentScene(st).id === 'c4-s06' ? 'b' : currentScene(st).options.find((o) => !o.misconception && !(o.lock && st.stats[o.lock.stat] < o.lock.min))?.id ?? 'a') });
    expect(verdict(s.log)).toEqual({ pass: false, fails: ['S10'] });
  });
});

describe('S6 — 내 채점표 기준 (R15)', () => {
  const rows = { p1: [1, 1, 1], p2: [2, 2, 2], p3: [5, 5, 5] } as Record<string, [number, number, number]>;
  const withVote = (vote: string) => play({ answer: (k) => (k === 'pledge' ? { kind: 'pledge', scores: rows, vote } : correctAnswer(k)) });
  it('모범 점수와 달라도 내 총점 최고에게 투표하면 통과', () => expect(verdict(withVote('p3').log)).toEqual({ pass: true, fails: [] }));
  it('내 총점 최고가 아닌 후보에게 투표하면 S6 실패', () => expect(verdict(withVote('p2').log).fails).toEqual(['S6']));
});

describe('최종 attempt 규칙', () => {
  it('처음 틀려도 다시 보기에서 맞히면 S3·S10 통과', () => {
    // 처음에 거소 투표 함정(M6)과 비밀 위반 하나를 틀리고, 다시 보기로 바로잡는다
    let s = play({ answer: (k) => (k === 'poll' ? { kind: 'poll', tapped: ['bribe', 'stack', 'proxy', 'trap_home'] } : correctAnswer(k)) });
    expect(verdict(s.log).fails).toEqual(['S3']);
    for (const item of ['group', 'trap_home']) s = reduce(s, { type: 'retry', kind: 'poll', item, correct: true, t: 999 });
    expect(verdict(s.log)).toEqual({ pass: true, fails: [] });
  });
  it('호소 이유 M11 은 다시 보기에서 맞히면 사라진다', () => {
    let s = play({ answer: (k) => (k === 'appeal' ? { kind: 'appeal', why: 'strong' } : correctAnswer(k)) });
    expect(verdict(s.log).fails).toEqual(['S4', 'S10']);
    s = reduce(s, { type: 'retry', kind: 'appeal', item: 'why', correct: true, t: 999 });
    expect(verdict(s.log).pass).toBe(true);
  });
  it('다시 보기에서 또 틀리면 M11 이 이어져 실패 유지', () => {
    let s = play({ answer: (k) => (k === 'appeal' ? { kind: 'appeal', why: 'strong' } : correctAnswer(k)) });
    s = reduce(s, { type: 'retry', kind: 'appeal', item: 'why', correct: false, t: 999 });
    expect(verdict(s.log).fails).toEqual(['S4', 'S10']);
  });
});
