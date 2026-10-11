import { CONTENT } from '../content';
import { COPY } from '../content/copy';
import type { Chapter, JudgeKind, TimelineEvent } from '../content/types';
import { clear } from './save';
import type { Action, LogEvent, State } from './state';
import { sortSpots } from '../ui/judge/drag';
import { finals, JUDGE_KINDS, verdict } from './verdict';

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
      const n = sortSpots(J.poll.spots).findIndex((x) => x.id === item) + 1; // 화면의 '그림 속 장면 n' 과 같은 번호
      return { question: COPY.ui.wrongPollQ(n), answer: s?.explain ?? '' };
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
      return { question: COPY.ui.wrongPledgeQ, answer: COPY.ui.wrongPledgeA };
    case 'organ': {
      if (item.startsWith('card:')) {
        const c = J.organ.cards.find((x) => x.id === item.slice(5));
        return { question: COPY.ui.wrongOrganCardQ(c?.label ?? item), answer: c ? ORGAN[c.organ] : '' };
      }
      const c = J.organ.checks.find((x) => x.id === item.slice(6));
      return {
        question: COPY.ui.wrongOrganCheckQ,
        answer: c ? `'${c.label}' — ${ORGAN[c.from]} → ${ORGAN[c.to]}` : '',
      };
    }
  }
}

export function summarize(state: State): Summary {
  const log = state.log;

  // (kind,item) 별 최종 attempt — 판정식(verdict)과 같은 finals 를 쓴다. 다시 보기도 같은 attempt 의 judge 이벤트를 남긴다.
  const wrongItems: WrongItem[] = [];
  let correct = 0;
  let total = 0;
  for (const kind of JUDGE_KINDS) {
    for (const [item, e] of finals(log, kind)) {
      total++;
      if (e.correct) correct++;
      else wrongItems.push({ kind, item, ...describe(kind, item) });
    }
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
    judged: { total, correct },
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
