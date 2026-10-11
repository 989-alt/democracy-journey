import { CONTENT, sceneOrder } from '../content';
import type { Option, StatKey, Stats } from '../content/types';
import { judgePassed, pledgeComplete, scoreJudge } from './judge';
import { SCENE_BY_ID, currentScene, initialState, isLocked } from './state';
import type { Action, LogEvent, State } from './state';

const clamp = (n: number) => Math.max(0, Math.min(3, n));

function applyDelta(stats: Stats, delta: Option['delta']): Stats {
  const out = { ...stats };
  for (const k of Object.keys(delta) as StatKey[]) out[k] = clamp(out[k] + (delta[k] ?? 0));
  return out;
}

// 장면을 넘긴다. 장이 바뀌거나 끝나면 chapter_end + satStep+1, 마지막 장면 뒤는 done.
// 사건 순서는 고정이라 option.next 는 앞쪽으로만 점프한다.
function advance(state: State, t: number, nextId?: string, log: LogEvent[] = state.log): State {
  const cur = currentScene(state);
  let idx = state.sceneIndex + 1;
  const jump = nextId ? sceneOrder.indexOf(nextId) : -1;
  if (jump > state.sceneIndex) idx = jump;
  const target = idx < sceneOrder.length ? SCENE_BY_ID[sceneOrder[idx]] : undefined;
  if (target && target.chapter === cur.chapter) return { ...state, sceneIndex: idx, log };
  const satStep = Math.min(4, state.satStep + 1) as State['satStep'];
  const ended = [...log, { t, type: 'chapter_end' as const, chapter: cur.chapter }];
  return target
    ? { ...state, sceneIndex: idx, log: ended, satStep }
    : { ...state, stage: 'done', log: ended, satStep };
}

export function reduce(state: State, action: Action): State {
  switch (action.type) {
    case 'start':
      return { ...initialState(action.seed), stage: 'play' };

    case 'restore': {
      if (action.state.version !== 1) return state;
      const s = action.state;
      return { ...s, log: [...s.log, { t: action.t, type: 'restore', chapter: currentScene(s).chapter }] };
    }

    case 'reset':
      return initialState(state.seed);

    case 'choose': {
      if (state.stage !== 'play') return state;
      const sc = currentScene(state);
      if (sc.id !== action.sceneId || (sc.kind !== 'story' && sc.kind !== 'culture')) return state;
      if (state.chosen[sc.id] !== undefined) return state; // 연타
      const opt = sc.options.find((o) => o.id === action.optionId);
      if (!opt || isLocked(opt, state.stats)) return state; // 잠김: 로그 없음
      const choice: LogEvent = { t: action.t, type: 'choice', chapter: sc.chapter, scene: sc.id, option: opt.id, delta: opt.delta };
      if (opt.misconception) choice.misconception = opt.misconception;
      const log = [...state.log, choice];
      if (sc.kind === 'culture') {
        log.push({ t: action.t, type: 'culture', chapter: sc.chapter, scene: sc.id, option: opt.id, correct: opt.id === sc.culture?.answer });
      }
      const next: State = {
        ...state,
        stats: applyDelta(state.stats, opt.delta),
        flags: opt.flag && !state.flags.includes(opt.flag) ? [...state.flags, opt.flag] : state.flags,
        chosen: { ...state.chosen, [sc.id]: opt.id },
      };
      return advance(next, action.t, opt.next, log);
    }

    case 'next': {
      if (state.stage !== 'play') return state;
      const sc = currentScene(state);
      if (sc.kind === 'judge') return state; // 판별은 judge 액션으로만 넘어간다
      if ((sc.kind === 'story' || sc.kind === 'culture') && sc.options.length > 0) return state;
      let log = state.log;
      if (sc.kind === 'compare') {
        const item = String(sc.compare);
        if (!log.some((e) => e.type === 'compare_view' && e.item === item)) {
          log = [...log, { t: action.t, type: 'compare_view', chapter: sc.chapter, scene: sc.id, item }];
        }
      }
      return advance(state, action.t, undefined, log);
    }

    case 'judge': {
      if (state.stage !== 'play') return state;
      const sc = currentScene(state);
      if (sc.kind !== 'judge' || sc.judge !== action.kind || action.answer.kind !== action.kind) return state;
      if (state.judges[action.kind]) return state;
      if (action.kind === 'pledge' && !pledgeComplete(action.answer, CONTENT.judges)) return state;
      const result = scoreJudge(action.kind, action.answer, CONTENT.judges);
      const events: LogEvent[] = result.items.map((i) => {
        const e: LogEvent = { t: action.t, type: 'judge', chapter: sc.chapter, scene: sc.id, kind: action.kind, item: i.item, correct: i.correct, attempt: 1 };
        if (i.misconception) e.misconception = i.misconception;
        return e;
      });
      const add = result.items
        .filter((i) => !i.correct)
        .map((i) => ({ kind: action.kind, item: i.item, attempts: 0 }));
      const flag = `knows_${action.kind}`;
      const next: State = {
        ...state,
        judges: { ...state.judges, [action.kind]: result },
        retryQueue: [...state.retryQueue, ...add],
        flags: judgePassed(result) && !state.flags.includes(flag) ? [...state.flags, flag] : state.flags,
      };
      return advance(next, action.t, undefined, [...state.log, ...events]);
    }

    case 'retry': {
      if (state.stage === 'title') return state;
      const q = state.retryQueue.find((x) => x.kind === action.kind && x.item === action.item);
      if (!q) return state;
      const attempt = q.attempts + 2; // 원래 판별 = 1회차
      const sc = currentScene(state);
      // 다시 틀리면 직전 판단의 오개념을 이어받는다(최종 attempt 에서 S10 이 읽는다).
      const prev = [...state.log].reverse().find((e) => e.type === 'judge' && e.kind === q.kind && e.item === q.item);
      const mis = !action.correct && prev?.misconception ? { misconception: prev.misconception } : {};
      const base = { t: action.t, chapter: sc.chapter, kind: q.kind, item: q.item, correct: action.correct, attempt, ...mis };
      const done = action.correct || attempt >= 3;
      // 결과 화면이 최종 attempt 를 보여 주도록 judges 항목도 갱신
      const prevRes = state.judges[q.kind];
      const judges = prevRes
        ? {
            ...state.judges,
            [q.kind]: {
              ...prevRes,
              items: prevRes.items.map((i) => {
                if (i.item !== q.item) return i;
                const { misconception: _m, ...rest } = i;
                return { ...rest, correct: action.correct, attempt, ...mis };
              }),
            },
          }
        : state.judges;
      return {
        ...state,
        judges,
        retryQueue: done
          ? state.retryQueue.filter((x) => x !== q)
          : state.retryQueue.map((x) => (x === q ? { ...x, attempts: x.attempts + 1 } : x)),
        log: [...state.log, { ...base, type: 'retry' }, { ...base, type: 'judge' }],
      };
    }
  }
}
