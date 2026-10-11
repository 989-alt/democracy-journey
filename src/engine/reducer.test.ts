import { describe, expect, it } from 'vitest';
import { CONTENT, sceneOrder } from '../content';
import { rng } from './rng';
import { reduce } from './reducer';
import { scoreJudge, scoreRetry } from './judge';
import { verdict } from './verdict';
import { currentScene, initialState } from './state';
import { retryAnswer } from './retryAnswers';
import type { Action, State } from './state';

const J = CONTENT.judges;
const at = (id: string, patch: Partial<State> = {}): State => ({
  ...initialState(1), stage: 'play', sceneIndex: sceneOrder.indexOf(id), ...patch,
});
const choose = (s: State, optionId: string, t = 1): State => reduce(s, { type: 'choose', sceneId: currentScene(s).id, optionId, t });
const polls = (tapped: string[]): Action => ({ type: 'judge', kind: 'poll', answer: { kind: 'poll', tapped }, t: 5 });

describe('진행·시작', () => {
  it('start: title → play, 시드 저장', () => {
    const s = reduce(initialState(0), { type: 'start', seed: 42, t: 0 });
    expect(s).toMatchObject({ stage: 'play', seed: 42, sceneIndex: 0, satStep: 0 });
  });
  it('title 장면은 next 로 진행', () => {
    expect(reduce(at('c1-s01'), { type: 'next', t: 1 }).sceneIndex).toBe(1);
  });
  it('story 장면은 next 로 못 넘어가고, judge 장면도 next 로 못 건너뛴다', () => {
    const s = at('c1-s02');
    expect(reduce(s, { type: 'next', t: 1 })).toBe(s);
    const j = at('c1-s08');
    expect(reduce(j, { type: 'next', t: 1 })).toBe(j);
  });
  it('reset: 저장 시드 유지한 채 title 초기 상태', () => {
    const s = reduce(at('c1-s02', { seed: 9 }), { type: 'reset', t: 1 });
    expect(s).toEqual(initialState(9));
  });
});

describe('수치·선택', () => {
  it('클램프: 3+1=3, 0-1=0', () => {
    const up = choose(at('c1-s02', { stats: { join: 3, info: 0, home: 0 } }), 'b'); // join +1
    expect(up.stats.join).toBe(3);
    const down = choose(at('c1-s02'), 'a'); // info -1
    expect(down.stats.info).toBe(0);
    const normal = choose(at('c1-s02', { stats: { join: 1, info: 0, home: 0 } }), 'b');
    expect(normal.stats.join).toBe(2);
  });
  it('선택 → choice 로그(delta·misconception), 다음 장면으로 이동, 플래그', () => {
    const s = choose(at('c1-s03'), 'b', 7); // flag asked_why
    expect(s.flags).toContain('asked_why');
    expect(s.chosen['c1-s03']).toBe('b');
    expect(s.sceneIndex).toBe(sceneOrder.indexOf('c1-s04'));
    expect(s.log).toEqual([{ t: 7, type: 'choice', chapter: 1, scene: 'c1-s03', option: 'b', delta: { info: -1 } }]);
    expect(choose(at('c1-s02'), 'a').log[0].misconception).toBe('M1');
  });
  it('잠긴 선택지는 무시, 로그·상태 변화 없음', () => {
    const s = at('c2-s03', { stats: { join: 0, info: 1, home: 0 } });
    expect(choose(s, 'c')).toBe(s);
    const open = choose(at('c2-s03', { stats: { join: 0, info: 2, home: 0 } }), 'c');
    expect(open.chosen['c2-s03']).toBe('c');
  });
  it('연타: 같은 장면 choice 두 번째는 무시', () => {
    const s = at('c1-s02');
    const a = choose(s, 'b');
    // 같은 장면으로 되돌려 두 번째 디스패치를 시도해도 chosen 이 막는다
    const again = reduce({ ...a, sceneIndex: s.sceneIndex }, { type: 'choose', sceneId: 'c1-s02', optionId: 'c', t: 2 });
    expect(again).toEqual({ ...a, sceneIndex: s.sceneIndex });
    expect(a.log).toHaveLength(1);
    // 이미 지나간 장면 id 로 보내도 무시
    expect(reduce(a, { type: 'choose', sceneId: 'c1-s02', optionId: 'c', t: 2 })).toBe(a);
  });
  it('없는 선택지·kind 가 맞지 않는 장면은 무시', () => {
    const s = at('c1-s02');
    expect(choose(s, 'zzz')).toBe(s);
    const j = at('c1-s08');
    expect(reduce(j, { type: 'choose', sceneId: 'c1-s08', optionId: 'a', t: 1 })).toBe(j);
  });
  it('culture 장면: choice + culture 로그, correct 는 정답 id 비교', () => {
    const ok = choose(at('c1-s07'), 'b');
    expect(ok.log.map((e) => e.type)).toEqual(['choice', 'culture']);
    expect(ok.log[1]).toMatchObject({ correct: true, scene: 'c1-s07' });
    expect(choose(at('c1-s07'), 'a').log[1].correct).toBe(false);
  });
  it('R28·R31(QA r1 #2): culture·오개념 선택은 기록하고 머문다, next 는 기록 뒤에만 넘긴다', () => {
    const c = at('c1-s07');
    expect(reduce(c, { type: 'next', t: 1 })).toBe(c); // 선택 전 next 무시
    const picked = choose(c, 'a');
    expect(picked.sceneIndex).toBe(c.sceneIndex);
    expect(picked.chosen['c1-s07']).toBe('a');
    expect(choose(picked, 'b')).toBe(picked); // 첫 선택 확정
    expect(reduce(picked, { type: 'next', t: 2 }).sceneIndex).toBe(c.sceneIndex + 1);
    const m = choose(at('c1-s02'), 'a'); // M1 오개념 선택지
    expect(m.sceneIndex).toBe(sceneOrder.indexOf('c1-s02'));
    expect(m.log[0].misconception).toBe('M1');
    expect(reduce(m, { type: 'next', t: 2 }).sceneIndex).toBe(sceneOrder.indexOf('c1-s03'));
    const plain = choose(at('c1-s02'), 'b'); // 일반 선택지는 즉시 넘어간다
    expect(plain.sceneIndex).toBe(sceneOrder.indexOf('c1-s03'));
    // 일반 선택지로 기록된 장면에 되돌려 둬도 next 는 넘기지 않는다
    const back = { ...plain, sceneIndex: sceneOrder.indexOf('c1-s02') };
    expect(reduce(back, { type: 'next', t: 3 })).toBe(back);
  });
  it('option.next 는 앞쪽 점프만 허용(사건 순서 고정)', () => {
    const sc = CONTENT.scenes.find((x) => x.id === 'c1-s02')!;
    const opt = sc.options[2];
    try {
      opt.next = 'c1-s04';
      expect(choose(at('c1-s02'), 'c').sceneIndex).toBe(sceneOrder.indexOf('c1-s04'));
      opt.next = 'c1-s01'; // 뒤로 → 무시하고 순서대로
      expect(choose(at('c1-s02'), 'c').sceneIndex).toBe(sceneOrder.indexOf('c1-s03'));
    } finally {
      delete opt.next;
    }
  });
});

describe('장 끝·완주', () => {
  it('장 마지막 장면을 넘기면 chapter_end + satStep+1', () => {
    const s = reduce(at('c1-s09'), { type: 'next', t: 3 });
    expect(s.sceneIndex).toBe(sceneOrder.indexOf('c2-s01'));
    expect(s.satStep).toBe(1);
    expect(s.log.map((e) => e.type)).toEqual(['compare_view', 'chapter_end']);
    expect(s.log[1]).toMatchObject({ chapter: 1, t: 3 });
  });
  it('마지막 장면 뒤 stage done, satStep 상한 4', () => {
    const s = reduce(at('c5-s05', { satStep: 4 }), { type: 'next', t: 3 });
    expect(s.stage).toBe('done');
    expect(s.satStep).toBe(4);
    expect(s.log.slice(-1)[0]).toMatchObject({ type: 'chapter_end', chapter: 5 });
    expect(reduce(s, { type: 'next', t: 4 })).toBe(s);
  });
  it('compare_view 는 번호당 1회만 로그', () => {
    const once = reduce(at('c1-s09'), { type: 'next', t: 1 });
    const back = { ...once, stage: 'play' as const, sceneIndex: sceneOrder.indexOf('c1-s09') };
    const twice = reduce(back, { type: 'next', t: 2 });
    expect(twice.log.filter((e) => e.type === 'compare_view')).toHaveLength(1);
  });
});

describe('판별 액션', () => {
  const wrong = ['bribe', 'trap_home'];
  it('정답이어도 오답이어도 stats 불변, 판별 로그는 항목별', () => {
    const stats = { join: 2, info: 1, home: 3 };
    const ok = reduce(at('c1-s08', { stats }), polls(['bribe', 'group', 'stack', 'proxy']));
    expect(ok.stats).toEqual(stats);
    expect(ok.flags).toContain('knows_poll');
    expect(ok.retryQueue).toEqual([]);
    expect(ok.log.filter((e) => e.type === 'judge')).toHaveLength(6);
    expect(ok.log[0]).toMatchObject({ type: 'judge', kind: 'poll', item: 'bribe', correct: true, attempt: 1, scene: 'c1-s08' });
    const bad = reduce(at('c1-s08', { stats }), polls(wrong));
    expect(bad.stats).toEqual(stats);
    expect(bad.flags).not.toContain('knows_poll');
    expect(bad.judges.poll?.items).toHaveLength(6);
  });
  it('R30: judge 는 채점·기록만 하고 전진하지 않는다, 그 뒤 next 로 넘어간다', () => {
    const j = at('c1-s08');
    expect(reduce(j, { type: 'next', t: 1 })).toBe(j); // 채점 전 next 무시
    const s = reduce(j, polls(wrong));
    expect(s.sceneIndex).toBe(sceneOrder.indexOf('c1-s08'));
    expect(s.judges.poll).toBeDefined();
    // 같은 판별을 다시 보내도(새로고침 뒤 재풀이 시도) 무시
    expect(reduce(s, polls(['bribe', 'group', 'stack', 'proxy']))).toBe(s);
    const n = reduce(s, { type: 'next', t: 6 });
    expect(n.sceneIndex).toBe(sceneOrder.indexOf('c1-s09'));
    expect(n.judges).toBe(s.judges);
  });
  it('오답 항목만 retryQueue 에 attempts 0 으로 들어간다', () => {
    const s = reduce(at('c1-s08'), polls(wrong));
    expect(s.retryQueue.map((q) => q.item).sort()).toEqual(['group', 'proxy', 'stack', 'trap_home']);
    expect(s.retryQueue.every((q) => q.kind === 'poll' && q.attempts === 0)).toBe(true);
    expect(s.log.find((e) => e.item === 'trap_home')?.misconception).toBe('M6');
  });
  it('같은 kind 두 번째 judge·다른 kind 장면의 judge 는 무시', () => {
    const s = reduce(at('c1-s08'), polls(wrong));
    const again = reduce({ ...s, sceneIndex: sceneOrder.indexOf('c1-s08') }, polls(['bribe', 'group', 'stack', 'proxy']));
    expect(again.log).toEqual(s.log);
    expect(again.flags).not.toContain('knows_poll');
    const wrongScene = at('c1-s08');
    expect(reduce(wrongScene, { type: 'judge', kind: 'appeal', answer: { kind: 'appeal', why: 'concentrated' }, t: 1 })).toBe(wrongScene);
    const mismatch = at('c1-s08');
    expect(reduce(mismatch, { type: 'judge', kind: 'poll', answer: { kind: 'appeal', why: 'x' }, t: 1 })).toBe(mismatch);
  });
  it('공약 9칸 미완성이면 judge 무시', () => {
    const s = at('c4-s08');
    const partial: Action = { type: 'judge', kind: 'pledge', answer: { kind: 'pledge', scores: { p1: [1, 1, 1] }, vote: 'p2' }, t: 1 };
    expect(reduce(s, partial)).toBe(s);
    const full = Object.fromEntries(J.pledge.candidates.map((c) => [c.id, [...c.truth] as [number, number, number]]));
    const r = reduce(s, { type: 'judge', kind: 'pledge', answer: { kind: 'pledge', scores: full, vote: 'p2' }, t: 1 });
    expect(r.flags).toContain('knows_pledge');
  });
});

describe('retry', () => {
  // 1장에서 판별을 틀린 뒤 2장 다시 보기 장면(c2-s10)으로 옮긴 상태
  const R2 = sceneOrder.indexOf('c2-s10');
  const R3 = sceneOrder.indexOf('c3-s09');
  const failed = () => ({ ...reduce(at('c1-s08'), polls(wrong2())), sceneIndex: R2 });
  function wrong2() { return ['bribe', 'trap_home']; }
  const retry = (s: State, correct: boolean, item = 'group', t = 9): State =>
    reduce(s, { type: 'retry', kind: 'poll', item, answer: retryAnswer('poll', item, correct), t });
  const toCh3 = (s: State): State => ({ ...s, sceneIndex: R3 });

  it('retry 는 stats·flags 불변', () => {
    const f = { ...reduce(at('c1-s08', { stats: { join: 2, info: 1, home: 3 } }), polls(wrong2())), sceneIndex: R2 };
    const r = retry(toCh3(retry(f, false)), true);
    expect(r.stats).toEqual(f.stats);
    expect(r.flags).toEqual(f.flags);
  });
  it('retry 는 judges 항목을 최종 attempt 로 갱신(결과 화면용)', () => {
    const f = failed();
    expect(f.judges.poll?.items.find((i) => i.item === 'group')).toMatchObject({ correct: false, attempt: 1 });
    const r = retry(f, true);
    expect(r.judges.poll?.items.find((i) => i.item === 'group')).toEqual({ item: 'group', correct: true, attempt: 2 });
    expect(r.judges.poll?.items.find((i) => i.item === 'stack')).toMatchObject({ correct: false, attempt: 1 });
    const w = retry(f, false, 'trap_home');
    expect(w.judges.poll?.items.find((i) => i.item === 'trap_home')).toMatchObject({ correct: false, attempt: 2, misconception: 'M6' });
    expect(retry(toCh3(w), true, 'trap_home').judges.poll?.items.find((i) => i.item === 'trap_home')).toEqual({ item: 'trap_home', correct: true, attempt: 3 });
  });
  it('정답이면 큐에서 제거, 로그에 retry+judge(attempt 2)', () => {
    const s = retry(failed(), true);
    expect(s.retryQueue.find((q) => q.item === 'group')).toBeUndefined();
    const tail = s.log.slice(-2);
    expect(tail[0]).toMatchObject({ type: 'retry', kind: 'poll', item: 'group', correct: true, attempt: 2 });
    expect(tail[1]).toMatchObject({ type: 'judge', kind: 'poll', item: 'group', correct: true, attempt: 2 });
  });
  it('계속 틀리면 attempt 3 에서 큐 제거 — 최대 3', () => {
    let s = retry(failed(), false);
    expect(s.retryQueue.find((q) => q.item === 'group')?.attempts).toBe(1);
    s = retry(toCh3(s), false);
    expect(s.retryQueue.find((q) => q.item === 'group')).toBeUndefined();
    const attempts = s.log.filter((e) => e.type === 'judge' && e.item === 'group').map((e) => e.attempt);
    expect(attempts).toEqual([1, 2, 3]);
    expect(retry(s, false)).toBe(s); // 큐에 없으면 무시
  });
  it('오개념은 이번 답에서 — 다시 틀리면 이번 답의 오개념, 맞히면 제거', () => {
    const s = failed();
    expect(retry(s, false, 'trap_home').log.slice(-1)[0].misconception).toBe('M6');
    expect(retry(s, true, 'trap_home').log.slice(-1)[0].misconception).toBeUndefined();
  });
  it('답 모양이 kind 와 어긋나거나 손상되면 무시', () => {
    const s = failed();
    expect(reduce(s, { type: 'retry', kind: 'poll', item: 'group', answer: { kind: 'appeal', why: 'strong' }, t: 9 })).toBe(s);
    expect(reduce(s, { type: 'retry', kind: 'poll', item: 'group', answer: { kind: 'poll', violation: 'y' as unknown as boolean }, t: 9 })).toBe(s);
  });
  // QA r3 #0: 이번 답 채점
  const J = CONTENT.judges;
  const cardsWith = (id: string, trust: 'low' | 'mid' | 'high') =>
    Object.fromEntries(J.source.cards.map((c) => [c.id, { checks: [...c.answerChecks], trust: c.id === id ? trust : c.answerTrust }]));
  const finalOf = (s: State, kind: string, item: string) => s.log.filter((e) => e.type === 'judge' && e.kind === kind && e.item === item).slice(-1)[0];

  it('M14 교정: 판별③ 라디오 높음(M14) → 다시 보기에서 체크 일부만 맞고 낮음 → 최종 M14 없음, miss 만', () => {
    let s = reduce(at(CONTENT.scenes.find((x) => x.judge === 'source')!.id), { type: 'judge', kind: 'source', answer: { kind: 'source', cards: cardsWith('radio', 'high') }, t: 1 });
    expect(finalOf(s, 'source', 'radio')).toMatchObject({ correct: false, misconception: 'M14' });
    const r4 = CONTENT.scenes.find((x) => x.kind === 'retry' && x.chapter === 4)!.id;
    s = { ...s, sceneIndex: sceneOrder.indexOf(r4) };
    const radio = J.source.cards.find((c) => c.id === 'radio')!;
    const checks = [true, false, false, false];
    s = reduce(s, { type: 'retry', kind: 'source', item: 'radio', answer: { kind: 'source', checks, trust: 'low' }, t: 2 });
    const miss = radio.answerChecks.flatMap((v, i) => (checks[i] === v ? [] : [i]));
    expect(miss.length).toBeGreaterThan(0);
    const fin = finalOf(s, 'source', 'radio');
    expect(fin).toMatchObject({ correct: false, attempt: 2, miss });
    expect(fin.misconception).toBeUndefined();
    expect(s.log[s.log.length - 2]).toMatchObject({ type: 'retry', correct: false, miss });
    expect(s.judges.source?.items.find((i) => i.item === 'radio')).toEqual({ item: 'radio', correct: false, attempt: 2, miss });
    expect(verdict(s.log).fails).not.toContain('S10');
  });
  it('M11 신규: 판별② 다른 오답 → 다시 보기에서 M11 선택 → 최종 attempt 에 M11, S10 실패', () => {
    let s = reduce(at(CONTENT.scenes.find((x) => x.judge === 'appeal')!.id), { type: 'judge', kind: 'appeal', answer: { kind: 'appeal', why: 'lazy' }, t: 1 });
    expect(finalOf(s, 'appeal', 'why').misconception).toBeUndefined();
    expect(verdict(s.log).fails).not.toContain('S10');
    const r3 = CONTENT.scenes.find((x) => x.kind === 'retry' && x.chapter === 3)!.id;
    s = reduce({ ...s, sceneIndex: sceneOrder.indexOf(r3) }, { type: 'retry', kind: 'appeal', item: 'why', answer: { kind: 'appeal', why: 'strong' }, t: 2 });
    expect(finalOf(s, 'appeal', 'why')).toMatchObject({ correct: false, attempt: 2, misconception: 'M11' });
    expect(s.judges.appeal?.items[0]).toEqual({ item: 'why', correct: false, attempt: 2, misconception: 'M11' });
    expect(verdict(s.log).fails).toContain('S10');
  });
  it('엔진 채점 = UI 채점: scoreRetry 가 scoreJudge 와 같은 판정', () => {
    for (const c of J.source.cards) {
      for (const trust of ['low', 'mid', 'high'] as const) {
        const a = scoreRetry(c.id, { kind: 'source', checks: [...c.answerChecks], trust }, J)!;
        const b = scoreJudge('source', { kind: 'source', cards: cardsWith(c.id, trust) }, J).items.find((i) => i.item === c.id)!;
        expect(a).toEqual(b);
      }
    }
    for (const w of J.appeal.why) expect(scoreRetry('why', { kind: 'appeal', why: w.id }, J)).toEqual(scoreJudge('appeal', { kind: 'appeal', why: w.id }, J).items[0]);
  });
  it('큐에 없는 항목·title 단계는 무시', () => {
    const s = failed();
    expect(retry(s, true, 'bribe')).toBe(s);
    expect(reduce(initialState(1), { type: 'retry', kind: 'poll', item: 'x', answer: { kind: 'poll', violation: true }, t: 1 }).log).toEqual([]);
  });
  it('R29: retry 는 다시 보기 장면에서만, 한 장에서 문항마다 한 번만, pledge·organ 은 받지 않는다', () => {
    const onJudge = reduce(at('c1-s08'), polls(wrong2())); // 판별 장면 그대로
    expect(retry(onJudge, true)).toBe(onJudge);
    const once = retry(failed(), false);
    expect(retry(once, true)).toBe(once); // 같은 장 같은 문항 두 번째는 무시(새로고침 재답 방지)
    expect(retry(once, true, 'stack').retryQueue.find((q) => q.item === 'stack')).toBeUndefined(); // 다른 문항은 받는다
    const pledgeQ = { ...failed(), retryQueue: [{ kind: 'pledge' as const, item: 'vote', attempts: 0 }] };
    expect(reduce(pledgeQ, { type: 'retry', kind: 'pledge', item: 'vote', answer: { kind: 'poll', violation: true }, t: 1 })).toBe(pledgeQ);
  });
  it('R29: 2장 다시 보기에서 큐의 poll 문항 전부를 차례로 답할 수 있다', () => {
    let s = failed();
    const items = s.retryQueue.map((q) => q.item);
    expect(items.sort()).toEqual(['group', 'proxy', 'stack', 'trap_home']);
    for (const it of items) s = retry(s, true, it);
    expect(s.retryQueue).toEqual([]);
    expect(s.log.filter((e) => e.type === 'retry')).toHaveLength(4);
  });
});

describe('결정성', () => {
  it('같은 시드·같은 입력이면 같은 상태·같은 로그', () => {
    const run = () => {
      let s = reduce(initialState(0), { type: 'start', seed: 123, t: 0 });
      const r = rng(s.seed);
      let t = 0;
      for (let i = 0; i < 12 && s.stage === 'play'; i++) {
        const sc = currentScene(s);
        if ((sc.kind === 'story' || sc.kind === 'culture') && s.chosen[sc.id] === undefined) {
          const open = sc.options.filter((o) => !o.lock);
          s = reduce(s, { type: 'choose', sceneId: sc.id, optionId: open[Math.floor(r() * open.length)].id, t: ++t });
        } else if (sc.kind !== 'judge') s = reduce(s, { type: 'next', t: ++t });
      }
      return s;
    };
    expect(run()).toEqual(run());
    expect(JSON.stringify(run().log)).toBe(JSON.stringify(run().log));
  });
  it('rng(mulberry32): 같은 시드 같은 수열, 0~1 범위', () => {
    const a = rng(5), b = rng(5), c = rng(6);
    const xs = [a(), a(), a()];
    expect(xs).toEqual([b(), b(), b()]);
    expect(xs).not.toEqual([c(), c(), c()]);
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
  });
});
