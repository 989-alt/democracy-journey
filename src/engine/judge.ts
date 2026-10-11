import type { Judges, JudgeKind } from '../content/types';
import type { JudgeAnswer, JudgeResult } from './state';

type Item = JudgeResult['items'][number];
const it = (item: string, correct: boolean, misconception?: string): Item =>
  misconception && !correct ? { item, correct, attempt: 1, misconception } : { item, correct, attempt: 1 };

// 채점표 9칸(후보 × 기준 3)이 전부 1~5 정수로 채워졌고 투표 대상이 실재하는가.
export function pledgeComplete(answer: JudgeAnswer, judges: Judges): boolean {
  if (answer.kind !== 'pledge') return false;
  if (!judges.pledge.candidates.some((c) => c.id === answer.vote)) return false;
  return judges.pledge.candidates.every((c) => {
    const s = answer.scores[c.id];
    return Array.isArray(s) && s.length === 3 && s.every((n) => Number.isInteger(n) && n >= 1 && n <= 5);
  });
}

// 교과서 p.88~89 "하는 일" 카드 오분류 → 오개념 (PRD §6 M8·M9·M10·M13).
// M9(국민이 총리 선출)는 직접 대응 카드가 없어 인사 청문회 오분류에 가장 가깝게 매겼다.
const ORGAN_MISCONCEPTION: Record<string, string> = { cabinet: 'M8', hearing: 'M9', three_trials: 'M10', audit: 'M13' };

export function scoreJudge(kind: JudgeKind, answer: JudgeAnswer, judges: Judges): JudgeResult {
  const items: Item[] = [];
  if (answer.kind !== kind) return { kind, items };
  if (answer.kind === 'poll') {
    const tapped = new Set(answer.tapped);
    for (const s of judges.poll.spots) {
      const on = tapped.has(s.id);
      const ok = s.violation !== null ? on : !on;
      items.push(it(s.id, ok, s.violation === null && s.id === 'trap_home' ? 'M6' : undefined));
    }
  } else if (answer.kind === 'appeal') {
    const w = judges.appeal.why.find((x) => x.id === answer.why);
    items.push(it('why', !!w?.correct, w?.misconception));
  } else if (answer.kind === 'source') {
    for (const c of judges.source.cards) {
      const a = answer.cards[c.id];
      const matches = a ? c.answerChecks.filter((v, i) => a.checks[i] === v).length : 0;
      const trustOk = !!a && a.trust === c.answerTrust;
      // 출처 종류만 보고 신뢰한 경우: 방송 M14, 소문 M18
      const mis = c.id === 'radio' ? 'M14' : c.id === 'rumor' ? 'M18' : undefined;
      items.push(it(c.id, trustOk && matches >= 3, trustOk ? undefined : mis));
    }
  } else if (answer.kind === 'pledge') {
    // R15: 정답 = 플레이어 자신의 채점표 총점이 최고인 후보에게 투표(동점 허용). truth 는 쓰지 않는다.
    const sum = (id: string) => (answer.scores[id] ?? []).reduce((a, n) => a + (Number.isFinite(n) ? n : 0), 0);
    const max = Math.max(...judges.pledge.candidates.map((c) => sum(c.id)));
    const voted = judges.pledge.candidates.some((c) => c.id === answer.vote);
    items.push(it('vote', voted && sum(answer.vote) === max));
  } else {
    for (const c of judges.organ.cards) {
      items.push(it(`card:${c.id}`, answer.placed[c.id] === c.organ, ORGAN_MISCONCEPTION[c.id]));
    }
    for (const c of judges.organ.checks) {
      items.push(it(`check:${c.id}`, answer.checks[c.id] === c.to, c.id === 'audit' ? 'M13' : undefined));
    }
  }
  return { kind, items };
}

// knows_<kind> 플래그 조건: 판별 항목 전부 정답 (PRD §4.4 "정답 판정").
export function judgePassed(r: JudgeResult): boolean {
  return r.items.length > 0 && r.items.every((i) => i.correct);
}
