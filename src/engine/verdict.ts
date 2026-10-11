import { CONTENT } from '../content';
import type { JudgeKind } from '../content/types';
import type { LogEvent } from './state';

// 완주 판정식 S1~S10 (PRD §7). 키마다 독립 검사 — fails 에 실패한 키만 담는다.
// "최종 attempt" = (kind, item) 별로 attempt 가 가장 큰 judge 이벤트(같으면 나중 것).
function finals(log: LogEvent[], kind: JudgeKind): Map<string, LogEvent> {
  const m = new Map<string, LogEvent>();
  for (const e of log) {
    if (e.type !== 'judge' || e.kind !== kind || e.item === undefined) continue;
    const p = m.get(e.item);
    if (!p || (e.attempt ?? 1) >= (p.attempt ?? 1)) m.set(e.item, e);
  }
  return m;
}

export function verdict(log: LogEvent[]): { pass: boolean; fails: string[] } {
  const fails: string[] = [];
  const check = (key: string, ok: boolean) => { if (!ok) fails.push(key); };
  const count = (m: Map<string, LogEvent>, ids: string[]) => ids.filter((id) => m.get(id)?.correct === true).length;
  const J = CONTENT.judges;

  check('S1', [1, 2, 3, 4, 5].every((c) => log.some((e) => e.type === 'chapter_end' && e.chapter === c)));

  const kinds: JudgeKind[] = ['poll', 'appeal', 'source', 'pledge', 'organ'];
  check('S2', kinds.every((k) => log.some((e) => e.type === 'judge' && e.kind === k)));

  const poll = finals(log, 'poll');
  const violations = J.poll.spots.filter((s) => s.violation !== null).map((s) => s.id);
  const traps = J.poll.spots.filter((s) => s.violation === null).map((s) => s.id);
  check('S3', count(poll, violations) >= 3 && !traps.some((id) => poll.get(id)?.correct === false));

  check('S4', finals(log, 'appeal').get('why')?.correct === true);
  check('S5', count(finals(log, 'source'), J.source.cards.map((c) => c.id)) >= 3);
  // 9칸 채움은 리듀서가 judge 액션 자체를 막아 두므로(pledgeComplete) 이벤트가 있으면 선행이 보장된다.
  check('S6', finals(log, 'pledge').get('vote')?.correct === true);

  const organ = finals(log, 'organ');
  check('S7',
    count(organ, J.organ.checks.map((c) => `check:${c.id}`)) >= 2 &&
    count(organ, J.organ.cards.map((c) => `card:${c.id}`)) >= 6);

  check('S8', [1, 2, 3, 4, 5].every((n) => log.some((e) => e.type === 'compare_view' && e.item === String(n))));

  const culture = new Map<string, boolean>();
  for (const e of log) if (e.type === 'culture' && e.scene) culture.set(e.scene, e.correct === true);
  check('S9', [...culture.values()].filter(Boolean).length >= 4);

  // S10: 최종 attempt 판별 + 장면당 마지막 선택에서 M14·M11·M25 없음
  const bad = new Set(['M14', 'M11', 'M25']);
  const latestChoice = new Map<string, LogEvent>();
  for (const e of log) if (e.type === 'choice' && e.scene) latestChoice.set(e.scene, e);
  const pool = [...kinds.flatMap((k) => [...finals(log, k).values()]), ...latestChoice.values()];
  check('S10', !pool.some((e) => e.misconception && bad.has(e.misconception)));

  return { pass: fails.length === 0, fails };
}
