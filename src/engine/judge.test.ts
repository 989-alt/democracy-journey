import { describe, expect, it } from 'vitest';
import { CONTENT } from '../content';
import { judgePassed, pledgeComplete, scoreJudge } from './judge';
import type { JudgeAnswer } from './state';

const J = CONTENT.judges;
const okSource = () => Object.fromEntries(J.source.cards.map((c) => [c.id, { checks: [...c.answerChecks], trust: c.answerTrust }]));
const get = (r: ReturnType<typeof scoreJudge>, id: string) => r.items.find((i) => i.item === id)!;

describe('판별① poll', () => {
  const viol = J.poll.spots.filter((s) => s.violation).map((s) => s.id);
  it('위반 4 탭 + 함정 0 → 6개 전부 정답', () => {
    const r = scoreJudge('poll', { kind: 'poll', tapped: viol }, J);
    expect(r.items).toHaveLength(6);
    expect(judgePassed(r)).toBe(true);
  });
  it('함정(거소 투표) 탭 → 오답 + M6, 위반 미탭 → 오답', () => {
    const r = scoreJudge('poll', { kind: 'poll', tapped: ['bribe', 'trap_home'] }, J);
    expect(get(r, 'trap_home')).toMatchObject({ correct: false, misconception: 'M6' });
    expect(get(r, 'group').correct).toBe(false);
    expect(get(r, 'trap_curtain').correct).toBe(true);
    expect(judgePassed(r)).toBe(false);
  });
});

describe('판별② appeal', () => {
  it('정답/오답(M11)', () => {
    expect(judgePassed(scoreJudge('appeal', { kind: 'appeal', why: 'concentrated' }, J))).toBe(true);
    const r = scoreJudge('appeal', { kind: 'appeal', why: 'strong' }, J);
    expect(r.items).toEqual([{ item: 'why', correct: false, attempt: 1, misconception: 'M11' }]);
  });
});

describe('판별③ source — 신뢰도 일치 AND 체크 4개 모두 일치 (QA r1 #3)', () => {
  it('모범 답안은 전부 정답', () => {
    expect(judgePassed(scoreJudge('source', { kind: 'source', cards: okSource() }, J))).toBe(true);
  });
  it('체크 3/4 일치 + 신뢰도 일치 → 오답, 어긋난 기준 번호 miss', () => {
    const cards = okSource();
    const want = J.source.cards.find((c) => c.id === 'photo')!.answerChecks;
    cards.photo.checks = want.map((v, i) => (i === 0 ? !v : v));
    expect(get(scoreJudge('source', { kind: 'source', cards }, J), 'photo')).toEqual({ item: 'photo', correct: false, attempt: 1, miss: [0] });
  });
  it('체크 2/4 일치 → 신뢰도가 맞아도 오답(오개념 없음), miss 2개', () => {
    const cards = okSource();
    const want = J.source.cards.find((c) => c.id === 'photo')!.answerChecks;
    cards.photo.checks = want.map((v, i) => (i === 0 || i === 2 ? !v : v));
    expect(get(scoreJudge('source', { kind: 'source', cards }, J), 'photo')).toEqual({ item: 'photo', correct: false, attempt: 1, miss: [0, 2] });
  });
  it('모든 카드·체크 조합: 정답 ⇔ 신뢰도 일치 AND 4개 일치', () => {
    for (const c of J.source.cards) for (let mask = 0; mask < 16; mask++) {
      const checks = c.answerChecks.map((v, i) => (mask & (1 << i) ? !v : v));
      const r = get(scoreJudge('source', { kind: 'source', cards: { [c.id]: { checks, trust: c.answerTrust } } }, J), c.id);
      expect(r.correct).toBe(mask === 0);
    }
  });
  it('체크는 맞고 신뢰도가 틀리면 오답, 방송 M14·소문 M18', () => {
    const cards = okSource();
    cards.radio.trust = 'high';
    cards.rumor.trust = 'mid';
    const r = scoreJudge('source', { kind: 'source', cards }, J);
    expect(get(r, 'radio')).toMatchObject({ correct: false, misconception: 'M14' });
    expect(get(r, 'rumor')).toMatchObject({ correct: false, misconception: 'M18' });
    expect(get(r, 'letter').correct).toBe(true);
  });
  it('답이 없는 카드는 오답', () => {
    const r = scoreJudge('source', { kind: 'source', cards: {} }, J);
    expect(r.items.every((i) => !i.correct)).toBe(true);
  });
});

describe('판별④ pledge — 정답 = 내 채점표 총점 최고 후보 (R15)', () => {
  const scores = (rows: Record<string, [number, number, number]>) => ({ kind: 'pledge' as const, scores: rows, vote: '' });
  const vote = (rows: Record<string, [number, number, number]>, v: string) =>
    scoreJudge('pledge', { kind: 'pledge', scores: rows, vote: v }, J).items[0];
  const mine = { p1: [1, 1, 1], p2: [2, 2, 2], p3: [5, 4, 4] } as Record<string, [number, number, number]>; // 내 총점 3 / 6 / 13

  it('내 점수 최고(p3)에게 투표 → 정답, truth 최고(p2)에게 투표해도 내 점수와 다르면 오답', () => {
    expect(vote(mine, 'p3')).toEqual({ item: 'vote', correct: true, attempt: 1 });
    expect(vote(mine, 'p2').correct).toBe(false);
    expect(vote(mine, 'p1').correct).toBe(false);
  });
  it('모범 점수(truth)로 채점한 경우 p2 가 정답', () => {
    const truth = Object.fromEntries(J.pledge.candidates.map((c) => [c.id, [...c.truth] as [number, number, number]]));
    expect(vote(truth, 'p2').correct).toBe(true);
    expect(judgePassed(scoreJudge('pledge', { kind: 'pledge', scores: truth, vote: 'p2' }, J))).toBe(true);
  });
  it('동점이면 최고점 후보 어느 쪽이든 정답', () => {
    const tie = { p1: [3, 3, 3], p2: [3, 3, 3], p3: [1, 1, 1] } as Record<string, [number, number, number]>;
    expect(vote(tie, 'p1').correct).toBe(true);
    expect(vote(tie, 'p2').correct).toBe(true);
    expect(vote(tie, 'p3').correct).toBe(false);
  });
  it('없는 후보에게 투표하면 오답', () => expect(vote(mine, 'zz').correct).toBe(false));
  it('9칸이 덜 차면 완료 아님', () => {
    const rows = { ...mine };
    const answer: JudgeAnswer = { kind: 'pledge', scores: rows, vote: 'p3' };
    expect(pledgeComplete(answer, J)).toBe(true);
    expect(pledgeComplete(scores(mine), J)).toBe(false); // vote 가 비어 있음
    delete rows.p3;
    expect(pledgeComplete(answer, J)).toBe(false);
    expect(pledgeComplete({ kind: 'pledge', scores: { ...mine, p1: [3, 3, 0] }, vote: 'p3' }, J)).toBe(false);
  });
});

describe('판별⑤ organ — 분류 8 + 방향 3', () => {
  const ok = () => ({
    placed: Object.fromEntries(J.organ.cards.map((c) => [c.id, c.organ])),
    checks: Object.fromEntries(J.organ.checks.map((c) => [c.id, c.to])),
  });
  it('전부 정답 11개', () => {
    const r = scoreJudge('organ', { kind: 'organ', ...ok() }, J);
    expect(r.items).toHaveLength(11);
    expect(judgePassed(r)).toBe(true);
  });
  it('국무 회의를 국회에 놓으면 M8, 견제 방향 틀리면 오답', () => {
    const a = ok();
    a.placed.cabinet = 'assembly';
    a.checks.veto = 'court';
    const r = scoreJudge('organ', { kind: 'organ', ...a }, J);
    expect(get(r, 'card:cabinet')).toMatchObject({ correct: false, misconception: 'M8' });
    expect(get(r, 'check:veto').correct).toBe(false);
    expect(get(r, 'card:law').correct).toBe(true);
  });
});

it('answer.kind 가 다르면 빈 결과', () => {
  expect(scoreJudge('poll', { kind: 'appeal', why: 'x' }, J).items).toEqual([]);
});
