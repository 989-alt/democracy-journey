import { CONTENT, sceneOrder } from '../content';
import { RETRY_KINDS, SCENE_BY_ID } from './state';
import type { State } from './state';

export const SAVE_KEY = 'dj.save.v1';

// localStorage 접근은 막힌 환경에서 던진다 → 전부 가드. 테스트는 globalThis.localStorage 를 주입한다.
function store(): Storage | null {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export function save(state: State): void {
  try { store()?.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* 용량·차단 무시 */ }
}

export function clear(): void {
  try { store()?.removeItem(SAVE_KEY); } catch { /* 무시 */ }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const JUDGE_KINDS = ['poll', 'appeal', 'source', 'pledge', 'organ'];

// QA r1 #1: judges[kind] 내부까지 본다 — kind 일치, items 배열, 각 항목 item·correct·attempt (선택: misconception·miss).
function validJudges(j: unknown): boolean {
  if (!isObj(j)) return false;
  return Object.entries(j).every(([k, r]) =>
    JUDGE_KINDS.includes(k) && isObj(r) && r.kind === k && Array.isArray(r.items) &&
    r.items.every((i) =>
      isObj(i) && typeof i.item === 'string' && typeof i.correct === 'boolean' && Number.isInteger(i.attempt) &&
      (i.misconception === undefined || typeof i.misconception === 'string') &&
      (i.miss === undefined || (Array.isArray(i.miss) && i.miss.every((n) => Number.isInteger(n))))));
}

// QA r2 #0: 엔진(judge.ts scoreJudge)이 쓰는 문항 id 체계 그대로 — 실재하는 문항만 받는다.
const J = CONTENT.judges;
const ITEMS: Record<string, Set<string>> = {
  poll: new Set(J.poll.spots.map((x) => x.id)),
  appeal: new Set(['why']),
  source: new Set(J.source.cards.map((x) => x.id)),
  pledge: new Set(['vote']),
  organ: new Set([...J.organ.cards.map((x) => `card:${x.id}`), ...J.organ.checks.map((x) => `check:${x.id}`)]),
};
const isItem = (kind: unknown, item: unknown): boolean =>
  typeof kind === 'string' && typeof item === 'string' && JUDGE_KINDS.includes(kind) && ITEMS[kind].has(item);
const isChapter = (n: unknown): boolean => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 5;
const isScene = (v: unknown): boolean => typeof v === 'string' && v in SCENE_BY_ID;
const optStr = (v: unknown): boolean => v === undefined || typeof v === 'string';
const isAttempt = (n: unknown): boolean => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 3;

// 재출제 큐: reducer 의 judge 는 틀린 문항을 kind 무관하게 attempts 0 으로 넣고, retry 는 ①~③만 attempts 0→1 로 올린 뒤
// 맞거나 3회차면 뺀다. 따라서 poll·appeal·source 는 attempts 0~1, pledge·organ 은 0 (다시 보기에서 내지 않음, R29).
function validRetry(q: unknown): boolean {
  if (!isObj(q) || !isItem(q.kind, q.item) || !Number.isInteger(q.attempts)) return false;
  const max = RETRY_KINDS.includes(q.kind as never) ? 1 : 0;
  return (q.attempts as number) >= 0 && (q.attempts as number) <= max;
}

// log: reducer 가 type 별로 실제 쓰는 필드만 필수로 본다(과잉 검증 금지).
function validEvent(e: unknown): boolean {
  if (!isObj(e) || !Number.isFinite(e.t) || !isChapter(e.chapter)) return false;
  if (!optStr(e.misconception)) return false;
  switch (e.type) {
    case 'chapter_end':
    case 'restore':
      return true;
    case 'scene':
      return e.scene === undefined || isScene(e.scene);
    case 'choice':
      return isScene(e.scene) && typeof e.option === 'string' &&
        (e.delta === undefined || (isObj(e.delta) && Object.entries(e.delta).every(([k, v]) => ['join', 'info', 'home'].includes(k) && Number.isFinite(v))));
    case 'culture':
      return isScene(e.scene) && typeof e.option === 'string' && typeof e.correct === 'boolean';
    case 'compare_view':
      return isScene(e.scene) && typeof e.item === 'string';
    case 'judge':
    case 'retry':
      // judge 의 scene 은 원래 판별에만 있고, 다시 보기가 남기는 judge·retry 에는 없다.
      return isItem(e.kind, e.item) && typeof e.correct === 'boolean' && isAttempt(e.attempt) &&
        (e.scene === undefined || isScene(e.scene));
    default:
      return false;
  }
}

function valid(s: unknown): s is State {
  if (!isObj(s) || s.version !== 1) return false;
  if (!Number.isFinite(s.seed)) return false;
  if (s.stage !== 'title' && s.stage !== 'play' && s.stage !== 'done') return false;
  if (!Number.isInteger(s.sceneIndex) || (s.sceneIndex as number) < 0 || (s.sceneIndex as number) >= sceneOrder.length) return false;
  if (!isObj(s.stats) || !(['join', 'info', 'home'] as const).every((k) => Number.isInteger((s.stats as Record<string, unknown>)[k]) && (s.stats as Record<string, number>)[k] >= 0 && (s.stats as Record<string, number>)[k] <= 3)) return false;
  if (!Array.isArray(s.flags) || !s.flags.every((f) => typeof f === 'string')) return false;
  if (!isObj(s.chosen) || !Object.values(s.chosen).every((v) => typeof v === 'string')) return false;
  if (!validJudges(s.judges)) return false;
  if (!Array.isArray(s.retryQueue) || !s.retryQueue.every(validRetry)) return false;
  if (!Array.isArray(s.log) || !s.log.every(validEvent)) return false;
  return [0, 1, 2, 3, 4].includes(s.satStep as number);
}

// 손상 JSON·버전 불일치·스키마 불일치는 null (호출자는 title 로 시작).
export function load(): State | null {
  try {
    const raw = store()?.getItem(SAVE_KEY);
    if (!raw) return null;
    const s: unknown = JSON.parse(raw);
    return valid(s) ? s : null;
  } catch {
    return null;
  }
}
