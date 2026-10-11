import { sceneOrder } from '../content';
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

function valid(s: unknown): s is State {
  if (!isObj(s) || s.version !== 1) return false;
  if (!Number.isFinite(s.seed)) return false;
  if (s.stage !== 'title' && s.stage !== 'play' && s.stage !== 'done') return false;
  if (!Number.isInteger(s.sceneIndex) || (s.sceneIndex as number) < 0 || (s.sceneIndex as number) >= sceneOrder.length) return false;
  if (!isObj(s.stats) || !(['join', 'info', 'home'] as const).every((k) => Number.isInteger((s.stats as Record<string, unknown>)[k]) && (s.stats as Record<string, number>)[k] >= 0 && (s.stats as Record<string, number>)[k] <= 3)) return false;
  if (!Array.isArray(s.flags) || !s.flags.every((f) => typeof f === 'string')) return false;
  if (!isObj(s.chosen) || !isObj(s.judges)) return false;
  if (!Array.isArray(s.retryQueue) || !s.retryQueue.every((q) => isObj(q) && typeof q.kind === 'string' && typeof q.item === 'string' && typeof q.attempts === 'number')) return false;
  if (!Array.isArray(s.log) || !s.log.every((e) => isObj(e) && typeof e.t === 'number' && typeof e.type === 'string' && typeof e.chapter === 'number')) return false;
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
