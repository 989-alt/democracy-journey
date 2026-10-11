import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../content';
import { pledgeComplete } from '../../engine/judge';
import { completeGrid, dragReducer, hitZone, initDrag, MOVE_PX, retryTarget, sortSpots, toggle } from './drag';
import type { DragEv, DragState, Zone } from './drag';

const zones: Zone[] = [
  { id: 'assembly', x: 0, y: 0, w: 100, h: 100 },
  { id: 'executive', x: 110, y: 0, w: 100, h: 100 },
  { id: 'court', x: 220, y: 0, w: 100, h: 100 },
];
const run = (evs: DragEv[], s: DragState = initDrag) => evs.reduce((acc, e) => dragReducer(acc, e), s);

describe('hitZone', () => {
  it('칸 안쪽 점은 그 칸, 가장자리는 left/top 포함·right/bottom 미포함', () => {
    expect(hitZone(50, 50, zones)).toBe('assembly');
    expect(hitZone(110, 0, zones)).toBe('executive');
    expect(hitZone(100, 50, zones)).toBeNull();
    expect(hitZone(330, 50, zones)).toBeNull();
    expect(hitZone(50, 100, zones)).toBeNull();
  });
  it('겹치면 앞의 칸', () => {
    expect(hitZone(5, 5, [{ id: 'a', x: 0, y: 0, w: 10, h: 10 }, { id: 'b', x: 0, y: 0, w: 10, h: 10 }])).toBe('a');
  });
});

describe('dragReducer', () => {
  it('pointerdown → move(임계 초과) → up(칸 안) = 놓기', () => {
    const s = run([{ type: 'down', card: 'c:law', x: 400, y: 400 }, { type: 'move', x: 200, y: 60 }, { type: 'up', x: 50, y: 50, zones }]);
    expect(s.drop).toEqual({ card: 'c:law', zone: 'assembly' });
    expect(s.dragging).toBeNull();
    expect(s.selected).toBeNull();
  });
  it('칸 밖에서 up = 원위치(놓기 없음)', () => {
    const s = run([{ type: 'down', card: 'c:law', x: 400, y: 400 }, { type: 'move', x: 380, y: 380 }, { type: 'up', x: 380, y: 380, zones }]);
    expect(s.drop).toBeNull();
    expect(s.dragging).toBeNull();
    expect(s.pos).toBeNull();
  });
  it('pointercancel = 원위치, 놓기 없음', () => {
    const s = run([{ type: 'down', card: 'c:law', x: 400, y: 400 }, { type: 'move', x: 50, y: 50 }, { type: 'cancel' }, { type: 'up', x: 50, y: 50, zones }]);
    expect(s.drop).toBeNull();
    expect(s.dragging).toBeNull();
  });
  it('cancel 은 탭으로 집어 둔 카드를 풀지 않는다', () => {
    const picked = run([{ type: 'tapCard', card: 'c:law' }]);
    const s = run([{ type: 'down', card: 'c:cabinet', x: 1, y: 1 }, { type: 'cancel' }], picked);
    expect(s.selected).toBe('c:law');
  });
  it('임계 이하 움직임은 탭 — 선택/해제 토글', () => {
    const tap = (s: DragState) => run([{ type: 'down', card: 'c:law', x: 10, y: 10 }, { type: 'move', x: 10 + MOVE_PX, y: 10 }, { type: 'up', x: 10, y: 10, zones }], s);
    const a = tap(initDrag);
    expect(a.selected).toBe('c:law');
    expect(a.drop).toBeNull();
    expect(tap(a).selected).toBeNull();
  });
  it('탭-탭 = 드래그와 같은 결과', () => {
    const viaDrag = run([{ type: 'down', card: 'c:law', x: 400, y: 400 }, { type: 'move', x: 100, y: 100 }, { type: 'up', x: 150, y: 50, zones }]);
    const viaTap = run([
      { type: 'down', card: 'c:law', x: 400, y: 400 }, { type: 'up', x: 400, y: 400, zones },
      { type: 'tapZone', zone: 'executive' },
    ]);
    expect(viaTap.drop).toEqual(viaDrag.drop);
    expect(viaTap.selected).toBe(viaDrag.selected);
  });
  it('집은 카드가 없으면 칸을 탭해도 아무 일 없다', () => {
    expect(run([{ type: 'tapZone', zone: 'court' }]).drop).toBeNull();
  });
  it('drop 은 한 이벤트만 살아 있다', () => {
    const s = run([{ type: 'tapCard', card: 'k:veto' }, { type: 'tapZone', zone: 'assembly' }]);
    expect(s.drop).toEqual({ card: 'k:veto', zone: 'assembly' });
    expect(dragReducer(s, { type: 'move', x: 0, y: 0 }).drop).toBeNull();
  });
});

describe('판별 상수·조건', () => {
  const k = 1024 / 1536; // 그림 1536 → 스테이지 1024
  const spots = CONTENT.judges.poll.spots;
  it('핫스팟은 6개, 스테이지에서 44×44 이상', () => {
    expect(spots).toHaveLength(6);
    for (const s of spots) {
      expect(s.w * k).toBeGreaterThanOrEqual(44);
      expect(s.h * k).toBeGreaterThanOrEqual(44);
    }
  });
  it('핫스팟 사각형끼리 겹치지 않고 그림 안에 있다', () => {
    for (const a of spots) {
      expect(a.x + a.w).toBeLessThanOrEqual(1536);
      expect(a.y + a.h).toBeLessThanOrEqual(1024);
      for (const b of spots) {
        if (a === b) continue;
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap, `${a.id}×${b.id}`).toBe(false);
      }
    }
  });
  it('핫스팟 토글 — 다시 누르면 해제', () => {
    expect(toggle(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggle(['a', 'b'], 'a')).toEqual(['b']);
  });
  it('9칸이 덜 찼으면 투표 불가', () => {
    const c = CONTENT.judges.pledge.candidates;
    const scores = Object.fromEntries(c.map((x) => [x.id, [3, 3, 3] as [number, number, number]]));
    expect(pledgeComplete({ kind: 'pledge', scores, vote: c[0].id }, CONTENT.judges)).toBe(true);
    const part = { ...scores, [c[2].id]: [3, 3, 0] as [number, number, number] };
    expect(pledgeComplete({ kind: 'pledge', scores: part, vote: c[0].id }, CONTENT.judges)).toBe(false);
  });
  it('다시 보기: 큐가 비면 null(장면 생략), 장마다 지난 판별 종류만', () => {
    expect(retryTarget([], 2)).toBeNull();
    const q = [
      { kind: 'appeal' as const, item: 'why', attempts: 0 },
      { kind: 'poll' as const, item: 'group', attempts: 1 },
    ];
    expect(retryTarget(q, 2)?.item).toBe('group');
    expect(retryTarget(q, 3)?.kind).toBe('appeal');
    expect(retryTarget(q, 4)).toBeNull();
    expect(retryTarget(q, 5)).toBeNull();
  });
  it('핫스팟은 x 순으로 그려 DOM 순서가 함정 위치를 드러내지 않는다', () => {
    const before = spots.map((s) => s.id);
    const sorted = sortSpots(spots);
    expect(sorted.map((s) => s.x)).toEqual([...spots.map((s) => s.x)].sort((a, b) => a - b));
    expect(sorted).toHaveLength(spots.length);
    expect(spots.map((s) => s.id)).toEqual(before); // 원본 배열은 건드리지 않는다
    expect(sortSpots([{ x: 5, y: 9 }, { x: 5, y: 1 }])).toEqual([{ x: 5, y: 1 }, { x: 5, y: 9 }]);
  });
  it('completeGrid: 9칸 중 하나라도 비면 false', () => {
    const ids = ['a', 'b', 'c'];
    const full = { a: [1, 2, 3], b: [4, 5, 1], c: [2, 2, 2] };
    expect(completeGrid(full, ids, 3)).toBe(true);
    expect(completeGrid({ ...full, c: [2, null, 2] }, ids, 3)).toBe(false);
    expect(completeGrid({ a: [1, 2, 3], b: [4, 5, 1] }, ids, 3)).toBe(false);
  });
});
