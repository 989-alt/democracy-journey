// 판별 공용 순수 함수. DOM 을 모른다 — Pointer Events 핸들러가 이 상태 기계에 좌표만 넘긴다.
import type { Scene } from '../../content/types';
import type { JudgeAnswer, JudgeResult } from '../../engine/state';

export interface Zone { id: string; x: number; y: number; w: number; h: number }

// 점 (x,y) 가 들어 있는 첫 칸. 가장자리는 안쪽으로 친다(left/top 포함, right/bottom 미포함).
export function hitZone(x: number, y: number, zones: Zone[]): string | null {
  for (const z of zones) {
    if (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) return z.id;
  }
  return null;
}

export interface DragState {
  selected: string | null;          // 탭-탭의 첫 탭으로 집은 카드
  dragging: string | null;          // 포인터를 누르고 있는 카드
  start: { x: number; y: number } | null;
  pos: { x: number; y: number } | null;
  moved: boolean;                   // MOVE_PX 넘게 움직였으면 드래그, 아니면 탭
  drop: { card: string; zone: string } | null;  // 이 이벤트가 만든 놓기 결과(다음 이벤트에서 지워진다)
}
export type DragEv =
  | { type: 'down'; card: string; x: number; y: number }
  | { type: 'move'; x: number; y: number }
  | { type: 'up'; x: number; y: number; zones: Zone[] }
  | { type: 'cancel' }
  | { type: 'tapCard'; card: string }   // 키보드(Enter/Space)로 카드 집기
  | { type: 'tapZone'; zone: string };  // 탭-탭의 두 번째 탭

export const MOVE_PX = 6;
export const initDrag: DragState = { selected: null, dragging: null, start: null, pos: null, moved: false, drop: null };

export function dragReducer(s: DragState, ev: DragEv): DragState {
  const base: DragState = { ...s, drop: null };
  switch (ev.type) {
    case 'down':
      return { ...base, dragging: ev.card, start: { x: ev.x, y: ev.y }, pos: { x: ev.x, y: ev.y }, moved: false };
    case 'move': {
      if (!s.dragging || !s.start) return base;
      const moved = s.moved || Math.hypot(ev.x - s.start.x, ev.y - s.start.y) > MOVE_PX;
      return { ...base, pos: { x: ev.x, y: ev.y }, moved };
    }
    case 'up': {
      if (!s.dragging) return base;
      const card = s.dragging;
      const clear = { ...base, dragging: null, start: null, pos: null, moved: false };
      if (!s.moved) return { ...clear, selected: s.selected === card ? null : card }; // 탭
      const zone = hitZone(ev.x, ev.y, ev.zones);
      return { ...clear, selected: null, drop: zone ? { card, zone } : null };        // 칸 밖이면 원위치
    }
    case 'cancel':
      return { ...base, dragging: null, start: null, pos: null, moved: false };       // 원위치, 탭 선택은 유지
    case 'tapCard':
      return { ...base, selected: s.selected === ev.card ? null : ev.card };
    case 'tapZone':
      if (!s.selected) return base;
      return { ...base, selected: null, drop: { card: s.selected, zone: ev.zone } };
  }
}

// 목록에서 id 를 켜고 끈다(핫스팟 토글).
export const toggle = (list: string[], id: string): string[] => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

// 다시 보기 문항 목록은 리듀서와 같은 규칙을 쓰도록 엔진에 둔다.
export { retryTargets } from '../../engine/state';

// 투표소 그림 좌표계(1536×1024). Poll·Retry 가 같이 쓴다.
export const POLL_W = 1536;
export const POLL_H = 1024;

// 핫스팟은 왼쪽→오른쪽 순으로 그려(DOM·탭 순서) 그림 속 위치로 함정을 짐작할 수 없게 한다.
export const sortSpots = <T extends { x: number; y: number }>(spots: T[]): T[] => [...spots].sort((a, b) => a.x - b.x || a.y - b.y);

// 채점표 9칸(후보 × 기준)이 전부 채워졌는가.
export const completeGrid = (grid: Record<string, (number | null)[]>, ids: string[], cols: number): boolean =>
  ids.every((id) => grid[id]?.length === cols && grid[id].every((v) => v !== null));

// 판별 화면 공통 props(R30). onJudge = dispatch({type:'judge'}) — 리듀서가 채점·기록만 하고 전진하지 않는다.
// 화면은 result(state.judges[kind])가 있으면 입력을 잠그고 그 결과로 피드백을 그린다. '다음' = onNext.
export interface JudgeProps { scene: Scene; result?: JudgeResult; onJudge: (answer: JudgeAnswer) => void; onNext: () => void }
