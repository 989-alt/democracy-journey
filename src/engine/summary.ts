import { CONTENT } from '../content';
import { COPY } from '../content/copy';
import type { Chapter, JudgeKind, TimelineEvent } from '../content/types';
import { clear } from './save';
import type { Action, LogEvent, State } from './state';
import { verdict } from './verdict';

// 결과 화면 요약 — 순수 함수. localStorage 를 읽지 않는다(R10: 선택은 평가하지 않고, 판별 정답률과 연표만 낸다).
export const GAP_LIMIT_MS = 10 * 60 * 1000;
export const MEMO_MAX = 2;
export const MEMO_CHARS = 14;
export const shorten = (t: string): string => (t.length > MEMO_CHARS ? `${t.slice(0, MEMO_CHARS)}…` : t);

export interface WrongItem { kind: JudgeKind; item: string; question: string; answer: string }
export interface Summary {
  playMs: number;
  reachedChapter: Chapter | '완주';
  judged: { total: number; correct: number };
  wrongItems: WrongItem[];
  timeline: TimelineEvent[];
  memos: Record<Chapter, string[]>;
  verdict: { pass: boolean; fails: string[] };
}

const CHAPTERS: Chapter[] = [1, 2, 3, 4, 5];
const ORGAN = COPY.ui.organs as Record<string, string>;
const TRUST = COPY.ui.trust as Record<string, string>;

export function playTime(log: LogEvent[]): number {
  let sum = 0;
  for (let i = 1; i < log.length; i++) {
    const d = log[i].t - log[i - 1].t;
    if (d > 0 && d <= GAP_LIMIT_MS) sum += d;
  }
  return sum;
}

function describe(kind: JudgeKind, item: string): { question: string; answer: string } {
  const J = CONTENT.judges;
  switch (kind) {
    case 'poll': {
      const s = J.poll.spots.find((x) => x.id === item);
      const n = J.poll.spots.findIndex((x) => x.id === item) + 1;
      return { question: `${n}번 장면은 선거 원칙을 어긴 곳일까요?`, answer: s?.explain ?? '' };
    }
    case 'appeal':
      return { question: `${J.appeal.situation} ${COPY.ui.why}`, answer: J.appeal.why.find((w) => w.correct)?.label ?? '' };
    case 'source': {
      const c = J.source.cards.find((x) => x.id === item);
      if (!c) return { question: item, answer: '' };
      return {
        question: `${c.source}(${c.date}) ${c.text}`,
        answer: `${COPY.ui.trustLabel}: ${TRUST[c.answerTrust]}. ${c.feedback}`,
      };
    }
    case 'pledge':
      return { question: '세 후보의 공약을 채점표로 따져 보고 투표하기', answer: '내 채점표에서 총점이 가장 높은 후보에게 투표해요.' };
    case 'organ': {
      if (item.startsWith('card:')) {
        const c = J.organ.cards.find((x) => x.id === item.slice(5));
        return { question: `'${c?.label ?? item}' — 어느 기관이 하는 일일까요?`, answer: c ? ORGAN[c.organ] : '' };
      }
      const c = J.organ.checks.find((x) => x.id === item.slice(6));
      return {
        question: '이 견제는 어느 기관이 어느 기관에 하는 것일까요?',
        answer: c ? `'${c.label}' — ${ORGAN[c.from]} → ${ORGAN[c.to]}` : '',
      };
    }
  }
}

export function summarize(state: State): Summary {
  const log = state.log;

  // (kind,item) 별 최종 attempt: attempt 가 가장 큰 judge/retry 이벤트(같으면 나중 것).
  const finals = new Map<string, LogEvent>();
  const order: string[] = [];
  for (const e of log) {
    if ((e.type !== 'judge' && e.type !== 'retry') || !e.kind || e.item === undefined) continue;
    const key = `${e.kind}|${e.item}`;
    const p = finals.get(key);
    if (!p) order.push(key);
    if (!p || (e.attempt ?? 1) >= (p.attempt ?? 1)) finals.set(key, e);
  }
  const wrongItems: WrongItem[] = [];
  let correct = 0;
  for (const key of order) {
    const e = finals.get(key)!;
    if (e.correct) correct++;
    else wrongItems.push({ kind: e.kind!, item: e.item!, ...describe(e.kind!, e.item!) });
  }

  let maxChapter = 1;
  for (const e of log) maxChapter = Math.max(maxChapter, e.chapter);

  // 선택 메모: 장마다 story/culture 장면의 고른 선택지 라벨(14자+…), 최대 2개, 장면 순서.
  const memos: Record<Chapter, string[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const sc of CONTENT.scenes) {
    if (sc.kind !== 'story' && sc.kind !== 'culture') continue;
    const oid = state.chosen[sc.id];
    const label = oid === undefined ? undefined : sc.options.find((o) => o.id === oid)?.label;
    if (label && memos[sc.chapter].length < MEMO_MAX) memos[sc.chapter].push(shorten(label));
  }

  return {
    playMs: playTime(log),
    reachedChapter: state.stage === 'done' ? '완주' : (maxChapter as Chapter),
    judged: { total: order.length, correct },
    wrongItems,
    timeline: [...CONTENT.timeline], // M23: 고정 순서
    memos,
    verdict: verdict(log),
  };
}

export const chapterTitle = (c: Chapter): string => COPY.ui.chapterTitles[c - 1];
export { CHAPTERS };

// 다시하기: 저장 키 삭제 후 reset → 타이틀.
export function clearAndReset(dispatch: (a: Action) => void, t: number = Date.now()): void {
  clear();
  dispatch({ type: 'reset', t });
}
