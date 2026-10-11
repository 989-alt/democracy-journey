import { CONTENT } from '../content';
import type { JudgeKind } from '../content/types';
import type { RetryAnswer } from './state';

// 테스트용: 다시 보기 한 문항의 맞는/틀린 답을 만든다. 틀린 답은 내용 데이터의 대표 오답(오개념이 붙는 쪽)을 쓴다.
export function retryAnswer(kind: JudgeKind, item: string, correct: boolean): RetryAnswer {
  const J = CONTENT.judges;
  if (kind === 'poll') {
    const s = J.poll.spots.find((x) => x.id === item)!;
    return { kind: 'poll', violation: (s.violation !== null) === correct };
  }
  if (kind === 'appeal') {
    const w = correct ? J.appeal.why.find((x) => x.correct)! : J.appeal.why.find((x) => !x.correct)!;
    return { kind: 'appeal', why: w.id };
  }
  const c = J.source.cards.find((x) => x.id === item)!;
  const other = c.answerTrust === 'high' ? 'low' : 'high';
  return { kind: 'source', checks: [...c.answerChecks], trust: correct ? c.answerTrust : other };
}
