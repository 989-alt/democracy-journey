import { CONTENT, sceneOrder } from '../content';
import type { Chapter, JudgeKind, Option, Scene, StatKey, Stats } from '../content/types';

export type Stage = 'title' | 'play' | 'done';
export interface LogEvent {
  t: number;
  type: 'scene' | 'choice' | 'judge' | 'compare_view' | 'culture' | 'chapter_end' | 'retry' | 'restore';
  chapter: Chapter;
  scene?: string;
  kind?: JudgeKind;
  item?: string;
  correct?: boolean;
  attempt?: number;
  option?: string;
  misconception?: string;
  delta?: Partial<Stats>;
}
export interface JudgeResult {
  kind: JudgeKind;
  items: { item: string; correct: boolean; attempt: number; misconception?: string }[];
}
// attempts = 이미 치른 "다시 보기" 횟수(0 시작). 원래 판별이 attempt 1, 다시 보기는 2·3 → 최대 2회.
export interface RetryItem { kind: JudgeKind; item: string; attempts: number }
export interface State {
  version: 1;
  seed: number;
  stage: Stage;
  sceneIndex: number; // sceneOrder 인덱스
  stats: Stats;
  flags: string[];
  chosen: Record<string, string>; // sceneId → optionId
  judges: Partial<Record<JudgeKind, JudgeResult>>;
  retryQueue: RetryItem[];
  log: LogEvent[];
  satStep: 0 | 1 | 2 | 3 | 4;
}
export type JudgeAnswer =
  | { kind: 'poll'; tapped: string[] }
  | { kind: 'appeal'; why: string }
  | { kind: 'source'; cards: Record<string, { checks: boolean[]; trust: 'low' | 'mid' | 'high' }> }
  | { kind: 'pledge'; scores: Record<string, [number, number, number]>; vote: string }
  | { kind: 'organ'; placed: Record<string, string>; checks: Record<string, string> };
export type Action =
  | { type: 'start'; seed: number; t: number }
  | { type: 'restore'; state: State; t: number }
  | { type: 'choose'; sceneId: string; optionId: string; t: number }
  | { type: 'next'; t: number }
  | { type: 'judge'; kind: JudgeKind; answer: JudgeAnswer; t: number }
  | { type: 'retry'; kind: JudgeKind; item: string; correct: boolean; t: number }
  | { type: 'reset'; t: number };

export const SCENE_BY_ID: Record<string, Scene> = Object.fromEntries(CONTENT.scenes.map((s) => [s.id, s]));

export function initialState(seed: number): State {
  return {
    version: 1,
    seed,
    stage: 'title',
    sceneIndex: 0,
    stats: { join: 0, info: 0, home: 0 },
    flags: [],
    chosen: {},
    judges: {},
    retryQueue: [],
    log: [],
    satStep: 0,
  };
}

export function currentScene(state: State): Scene {
  return SCENE_BY_ID[sceneOrder[Math.min(Math.max(state.sceneIndex, 0), sceneOrder.length - 1)]];
}

export function isLocked(option: Option, stats: Stats): boolean {
  return !!option.lock && stats[option.lock.stat as StatKey] < option.lock.min;
}
