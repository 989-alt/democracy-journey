import { describe, expect, it } from 'vitest';
import { CONTENT, sceneOrder } from './index';
import type { Chapter, JudgeKind, Scene } from './types';

const { scenes, judges, compares, cultures, timeline, copy } = CONTENT;
const allText = JSON.stringify(CONTENT);
const sceneText = JSON.stringify(scenes);
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const inChapter = (c: Chapter) => scenes.filter((s) => s.chapter === c);
const firstPlayable = (c: Chapter): Scene => inChapter(c).find((s) => s.kind === 'story' || s.kind === 'culture')!;

describe('장면 구조', () => {
  it('장별 이야기+생활 문화 장면 수: 1~4장 5~6, 에필로그 2~3 (생활 문화 1개 포함)', () => {
    const playable = (c: Chapter) => inChapter(c).filter((s) => s.kind === 'story' || s.kind === 'culture').length;
    ([1, 2, 3, 4] as Chapter[]).forEach((c) => {
      expect(playable(c), `ch${c}`).toBeGreaterThanOrEqual(5);
      expect(playable(c), `ch${c}`).toBeLessThanOrEqual(6);
    });
    expect(playable(5)).toBeGreaterThanOrEqual(2);
    expect(playable(5)).toBeLessThanOrEqual(3);
  });
  it('이야기 장면의 지도 내용 covers 는 1~2개씩', () => {
    scenes.filter((s) => s.kind === 'story' || s.kind === 'culture').forEach((s) => {
      expect(s.covers.length, s.id).toBeGreaterThanOrEqual(1);
      expect(s.covers.length, s.id).toBeLessThanOrEqual(2);
    });
  });
  it('sceneOrder 는 장 → 장면 순이고 id 는 유일하며 c<장>-s<순번> 형식', () => {
    expect(sceneOrder).toEqual(scenes.map((s) => s.id));
    expect(new Set(sceneOrder).size).toBe(sceneOrder.length);
    scenes.forEach((s) => expect(s.id).toMatch(/^c[1-5]-s\d\d$/));
    const chapters = scenes.map((s) => s.chapter);
    expect(chapters).toEqual([...chapters].sort());
    scenes.forEach((s) => expect(s.id.startsWith(`c${s.chapter}-`)).toBe(true));
  });
  it('각 장은 title 로 시작하고 장 제목이 text[0] 과 같다', () => {
    const titles = ['1장 · 1960 봄', '2장 · 1961~1979 긴 집권의 시대', '3장 · 1980 5월', '4장 · 1987 6월, 그리고 12월', '에필로그 · 오늘'];
    ([1, 2, 3, 4, 5] as Chapter[]).forEach((c, i) => {
      const first = inChapter(c)[0];
      expect(first.kind).toBe('title');
      expect(first.text[0]).toBe(titles[i]);
      expect(inChapter(c).filter((s) => s.kind === 'title').length).toBe(1);
    });
    expect(copy.ui.chapterTitles).toEqual(titles);
  });
  it('장 구성: 생활 문화 1·판별 1·비교 1, 다시 보기는 2~4장만, 판별 순서 poll→appeal→source→pledge→organ', () => {
    const judgeOrder: JudgeKind[] = ['poll', 'appeal', 'source', 'pledge', 'organ'];
    ([1, 2, 3, 4, 5] as Chapter[]).forEach((c, i) => {
      const list = inChapter(c);
      expect(list.filter((s) => s.kind === 'culture').length).toBe(1);
      expect(list.filter((s) => s.kind === 'judge').length).toBe(1);
      expect(list.filter((s) => s.kind === 'compare').length).toBe(1);
      expect(list.filter((s) => s.kind === 'retry').length).toBe(c >= 2 && c <= 4 ? 1 : 0);
      expect(list.find((s) => s.kind === 'judge')!.judge).toBe(judgeOrder[i]);
      expect(list.find((s) => s.kind === 'compare')!.compare).toBe(c);
      const kinds = list.map((s) => s.kind);
      expect(kinds.lastIndexOf('story')).toBeLessThan(kinds.indexOf('culture'));
      expect(kinds.indexOf('culture')).toBeLessThan(kinds.indexOf('judge'));
      expect(kinds.indexOf('judge')).toBeLessThan(kinds.indexOf('compare'));
      if (c >= 2 && c <= 4) expect(kinds[kinds.length - 1]).toBe('retry');
    });
  });
  it('초상 연령: 장마다 y10 / y20 / y30 / y37 / old', () => {
    const ages = ['y10', 'y20', 'y30', 'y37', 'old'];
    scenes.forEach((s) => expect(s.portrait).toBe(ages[s.chapter - 1]));
  });
  it('배경: 장별 허용 BgId 만, 타이틀은 그 장 첫 배경, 판별 배경 지정', () => {
    const allowed: Record<number, string[]> = {
      1: ['1960-room', '1960-poll', '1960-street'],
      2: ['1960s-factory', '1970s-hill', '1970-highway', '1970s-apt'],
      3: ['1980-alley', '1980-tv'],
      4: ['1987-myeongdong', '1987-poll'],
      5: ['today-street'],
    };
    scenes.forEach((s) => expect(allowed[s.chapter]).toContain(s.bg));
    ([1, 2, 3, 4, 5] as Chapter[]).forEach((c) => expect(inChapter(c)[0].bg).toBe(allowed[c][0]));
    expect(scenes.find((s) => s.id === 'c1-s08')!.bg).toBe('1960-poll');
    expect(scenes.find((s) => s.kind === 'culture' && s.chapter === 2)!.bg).toBe('1970-highway');
    expect(scenes.find((s) => s.kind === 'culture' && s.chapter === 3)!.bg).toBe('1980-tv');
  });
  it('대사 수·길이: story/culture 2~3줄, 한 줄 120자 이하', () => {
    scenes.filter((s) => s.kind === 'story' || s.kind === 'culture').forEach((s) => {
      expect(s.text.length, s.id).toBeGreaterThanOrEqual(2);
      expect(s.text.length, s.id).toBeLessThanOrEqual(3);
    });
    scenes.forEach((s) => s.text.forEach((t) => expect(t.length, s.id).toBeLessThanOrEqual(120)));
  });
});

describe('선택지', () => {
  it('story/culture 선택지 2~3개, 나머지는 0개, id 는 장면 안 유일', () => {
    scenes.forEach((s) => {
      if (s.kind === 'story' || s.kind === 'culture') {
        expect(s.options.length, s.id).toBeGreaterThanOrEqual(2);
        expect(s.options.length, s.id).toBeLessThanOrEqual(3);
        expect(new Set(s.options.map((o) => o.id)).size).toBe(s.options.length);
      } else expect(s.options, s.id).toEqual([]);
    });
  });
  it('잠김 ≤ 1 / 장면, lock 은 한 수치 min 하나(1~3)', () => {
    scenes.forEach((s) => {
      const locked = s.options.filter((o) => o.lock);
      expect(locked.length, s.id).toBeLessThanOrEqual(1);
      locked.forEach((o) => {
        expect(Object.keys(o.lock!).sort()).toEqual(['min', 'stat']);
        expect(['join', 'info', 'home']).toContain(o.lock!.stat);
        expect(o.lock!.min).toBeGreaterThanOrEqual(1);
        expect(o.lock!.min).toBeLessThanOrEqual(3);
      });
    });
    expect(scenes.some((s) => s.options.some((o) => o.lock))).toBe(true);
  });
  // R10: 선택은 평가하지 않는다. 모든 story/culture 선택지는 한 수치에 정확히 ±1.
  it('모든 선택지 delta 는 join/info/home 중 하나에 정확히 ±1', () => {
    scenes.filter((s) => s.kind === 'story' || s.kind === 'culture').forEach((s) => s.options.forEach((o) => {
      const entries = Object.entries(o.delta);
      expect(entries.length, `${s.id}/${o.id}`).toBe(1);
      expect(['join', 'info', 'home']).toContain(entries[0][0]);
      expect([-1, 1]).toContain(entries[0][1]);
    }));
  });
  it('보상이 한쪽으로 쏠리지 않는다: 오개념 선택지·생활 문화 정답·그 밖의 선택지 모두 +와 −가 섞인다', () => {
    const sign = (o: { delta: Partial<Record<string, number>> }) => Object.values(o.delta)[0]!;
    const playable = scenes.filter((s) => s.kind === 'story' || s.kind === 'culture');
    const misc = playable.flatMap((s) => s.options.filter((o) => o.misconception));
    const plain = playable.flatMap((s) => s.options.filter((o) => !o.misconception));
    const answers = cultures.map((s) => s.options.find((o) => o.id === s.culture!.answer)!);
    for (const group of [misc, plain, answers]) {
      expect(group.some((o) => sign(o) > 0)).toBe(true);
      expect(group.some((o) => sign(o) < 0)).toBe(true);
    }
  });
  it('같은 장면 안 선택지 라벨 길이 비 ≤ 1.15 (길이로 정답을 짐작하지 못하게)', () => {
    scenes.filter((s) => s.options.length > 1).forEach((s) => {
      const lens = s.options.map((o) => o.label.length);
      expect(Math.max(...lens) / Math.min(...lens), s.id).toBeLessThanOrEqual(1.15);
    });
  });
  it('생활 문화 장면: answer 가 선택지 id, why 비어 있지 않음, 장당 1개, cultures 와 일치', () => {
    expect(cultures.length).toBe(5);
    expect(cultures).toEqual(scenes.filter((s) => s.kind === 'culture'));
    cultures.forEach((s) => {
      expect(s.options.map((o) => o.id)).toContain(s.culture!.answer);
      expect(s.culture!.why.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('지도 내용 커버리지', () => {
  it('1~72 중 16·47·60·72 제외 68개가 scenes/compares covers 에 있다 (집합 차 = 빈 집합)', () => {
    const required = new Set(range(1, 72).filter((n) => ![16, 47, 60, 72].includes(n)));
    expect(required.size).toBe(68);
    const covered = new Set<number>();
    scenes.forEach((s) => s.covers.forEach((n) => covered.add(n)));
    compares.forEach((c) => c.covers.forEach((n) => covered.add(n)));
    const missing = [...required].filter((n) => !covered.has(n));
    expect(missing).toEqual([]);
    const outOfRange = [...covered].filter((n) => n < 1 || n > 72);
    expect(outOfRange).toEqual([]);
    expect(covered.has(16)).toBe(false);
    expect(covered.has(47)).toBe(false);
  });
  it('비교 카드 5장 covers 는 PRD 4.1 열', () => {
    expect(compares.map((c) => c.n)).toEqual([1, 2, 3, 4, 5]);
    const want: Record<number, number[]> = {
      1: [9, 12, 13],
      2: [19, 20, 21, 24, 26, 27],
      3: [42, 43, 45, 46],
      4: [5, 6, 7, 9],
      5: [29, 30, 31, 32, 33, 34, 35, 36, 59],
    };
    compares.forEach((c) => {
      want[c.n].forEach((n) => expect(c.covers, `compare ${c.n}`).toContain(n));
      expect(c.today.length).toBeGreaterThanOrEqual(2);
      expect(c.today.length).toBeLessThanOrEqual(3);
    });
    scenes.filter((s) => s.kind === 'compare').forEach((s) => {
      expect(s.covers).toEqual(compares[s.compare! - 1].covers);
    });
  });
});

describe('오개념 커버리지', () => {
  // 규칙: M1~M31 중 M4·M21 제외 29개 각각이
  //  (1) 어떤 scene.misconceptions / option.misconception / appeal.why.misconception 에 1회 이상 있고
  //  (2) copy.feedback 에 같은 키의 문구가 있어야 한다.
  const required = range(1, 31).filter((n) => ![4, 21].includes(n)).map((n) => `M${n}`);
  it('29개 전부 장면 메타에 있다', () => {
    expect(required.length).toBe(29);
    const found = new Set<string>();
    scenes.forEach((s) => {
      s.misconceptions?.forEach((m) => found.add(m));
      s.options.forEach((o) => o.misconception && found.add(o.misconception));
    });
    judges.appeal.why.forEach((w) => w.misconception && found.add(w.misconception));
    expect(required.filter((m) => !found.has(m))).toEqual([]);
  });
  it('29개 전부 copy.feedback 문구가 있다', () => {
    expect(required.filter((m) => !copy.feedback[m] || copy.feedback[m].length < 10)).toEqual([]);
  });
  it('선택지의 misconception 은 그 장면 misconceptions 에도 있고 피드백이 있다', () => {
    scenes.forEach((s) => s.options.forEach((o) => {
      if (!o.misconception) return;
      expect(s.misconceptions ?? [], s.id).toContain(o.misconception);
      expect(copy.feedback[o.misconception]).toBeTruthy();
    }));
  });
  it('S10 대상 M11·M14·M25 는 선택지로 드러난다', () => {
    const optionMs = new Set<string>();
    scenes.forEach((s) => s.options.forEach((o) => o.misconception && optionMs.add(o.misconception)));
    judges.appeal.why.forEach((w) => w.misconception && optionMs.add(w.misconception));
    ['M11', 'M14', 'M25'].forEach((m) => expect(optionMs.has(m), m).toBe(true));
  });
  it('판별 피드백 키', () => {
    ['poll.trap', 'poll.miss', 'pledge.incomplete', 'organ.wrong'].forEach((k) => expect(copy.feedback[k]).toBeTruthy());
  });
});

describe('판별 자료', () => {
  it('① 투표소: 핫스팟 6 = 위반 4 + 함정 2, 좌표는 1536×1024 안', () => {
    const spots = judges.poll.spots;
    expect(spots.length).toBe(6);
    expect(spots.filter((s) => s.violation !== null).length).toBe(4);
    expect(spots.filter((s) => s.violation === null).length).toBe(2);
    expect(spots.filter((s) => s.violation === null).map((s) => s.id).sort()).toEqual(['trap_curtain', 'trap_home']);
    expect(new Set(spots.map((s) => s.id)).size).toBe(6);
    expect(spots.map((s) => s.violation).filter(Boolean).sort()).toEqual(['금품', '비밀', '직접', '평등']);
    spots.forEach((s) => {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.x + s.w).toBeLessThanOrEqual(1536);
      expect(s.y + s.h).toBeLessThanOrEqual(1024);
      expect(s.explain.length).toBeGreaterThan(5);
    });
    for (let i = 0; i < spots.length; i++) {
      for (let j = i + 1; j < spots.length; j++) {
        const a = spots[i], b = spots[j];
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap, `${a.id} × ${b.id}`).toBe(false);
      }
    }
  });
  it('② 호소처: 카드 4장 모두 막힘, 까닭 3지 중 정답 1, M11 오답 포함', () => {
    const a = judges.appeal;
    expect(a.cards.map((c) => c.id)).toEqual(['assembly', 'court', 'press', 'neighbor']);
    a.cards.forEach((c) => expect(c.back).toContain('막힘'));
    expect(a.why.length).toBe(3);
    const correct = a.why.filter((w) => w.correct);
    expect(correct.length).toBe(1);
    expect(correct[0].label).toBe('권력이 한곳에 모여 서로 견제하지 못해서');
    expect(a.why.find((w) => w.misconception === 'M11')!.correct).toBe(false);
  });
  it('③ 정보 카드 정답표: 라디오=낮음, 편지=중간, 사진=높음, 소문=낮음, 기준 4개', () => {
    const s = judges.source;
    expect(s.criteria.length).toBe(4);
    const by = Object.fromEntries(s.cards.map((c) => [c.id, c]));
    expect(s.cards.map((c) => c.id)).toEqual(['radio', 'letter', 'photo', 'rumor']);
    expect(by.radio.answerTrust).toBe('low');
    expect(by.letter.answerTrust).toBe('mid');
    expect(by.photo.answerTrust).toBe('high');
    expect(by.rumor.answerTrust).toBe('low');
    expect(by.radio.answerChecks).toEqual([false, false, false, false]);
    expect(by.letter.answerChecks).toEqual([false, true, true, false]);
    expect(by.photo.answerChecks).toEqual([false, true, true, true]);
    expect(by.rumor.answerChecks).toEqual([false, false, false, false]);
    s.cards.forEach((c) => expect(c.feedback.length).toBeGreaterThan(10));
  });
  it('④ 공약: 후보 3명, 총점 최고가 유일', () => {
    const p = judges.pledge;
    expect(p.candidates.length).toBe(3);
    expect(p.criteria.length).toBe(3);
    p.candidates.forEach((c) => {
      expect(c.pledges.length).toBe(3);
      c.truth.forEach((t) => {
        expect(t).toBeGreaterThanOrEqual(1);
        expect(t).toBeLessThanOrEqual(5);
      });
    });
    const totals = p.candidates.map((c) => c.truth.reduce((a, b) => a + b, 0));
    const max = Math.max(...totals);
    expect(totals.filter((t) => t === max).length).toBe(1);
  });
  it('⑤ 기관: 카드 8 + 견제 3, 아이콘 키', () => {
    const o = judges.organ;
    expect(o.cards.length).toBe(8);
    expect(o.cards.map((c) => c.icon)).toEqual(['organ-law', 'organ-audit', 'organ-budget', 'organ-hearing', 'organ-cabinet', 'organ-ministries', 'organ-trial', 'organ-threetier']);
    const org = (id: string) => o.cards.find((c) => c.id === id)!.organ;
    expect(['law', 'audit', 'budget', 'hearing'].map(org)).toEqual(Array(4).fill('assembly'));
    expect(['cabinet', 'ministry'].map(org)).toEqual(['executive', 'executive']);
    expect(['trial', 'three_trials'].map(org)).toEqual(['court', 'court']);
    expect(o.checks).toEqual([
      { id: 'audit', label: '국정 감사', from: 'assembly', to: 'executive', icon: 'check-audit' },
      { id: 'veto', label: '법률안 거부권', from: 'executive', to: 'assembly', icon: 'check-veto' },
      { id: 'nullify', label: '명령·규칙 취소', from: 'court', to: 'executive', icon: 'check-nullify' },
    ]);
  });
});

describe('다음 장 언급(플래그 변주)', () => {
  const token = /\{\{flag:([a-z_0-9]+)\|([^}|]+)\}\}/g;
  const judgeOf = (c: Chapter) => inChapter(c).find((s) => s.kind === 'judge')!.judge!;
  it('2~5장의 첫 이야기/생활 문화 장면에 직전 장에서 켜질 수 있는 플래그 토큰 ≥1', () => {
    ([2, 3, 4, 5] as Chapter[]).forEach((c) => {
      const scene = firstPlayable(c);
      const flags = [...scene.text.join('\n').matchAll(token)].map((m) => m[1]);
      expect(flags.length, scene.id).toBeGreaterThanOrEqual(1);
      const producible = new Set<string>([`knows_${judgeOf((c - 1) as Chapter)}`]);
      inChapter((c - 1) as Chapter).forEach((s) => s.options.forEach((o) => o.flag && producible.add(o.flag)));
      flags.forEach((f) => expect(producible.has(f), `${scene.id} ${f}`).toBe(true));
    });
  });
  // 문장 수 세기: 마침표·물음표·느낌표가 공백·줄 끝·따옴표 앞에 올 때 1문장. (26.8만 같은 소수점은 세지 않는다)
  const sentences = (lines: string[]) => (lines.join(' ').match(/[.?!](?=\s|$|["”'])/g) ?? []).length;
  it('플래그 토큰이 있는 장면: 토큰을 뺀 본문 ≤ 2문장, 변주를 넣어도 ≤ 3문장, 토큰은 장면당 1개', () => {
    const withToken = scenes.filter((s) => /\{\{flag:/.test(s.text.join('')));
    expect(withToken.map((s) => s.id)).toEqual(['c2-s02', 'c2-s04', 'c3-s02', 'c4-s02', 'c5-s02']);
    withToken.forEach((s) => {
      const tokens = s.text.join('').match(token) ?? [];
      expect(tokens.length, s.id).toBe(1);
      const base = s.text.map((l) => l.replace(token, ''));
      const full = s.text.map((l) => l.replace(token, (_m, _f, v: string) => v));
      expect(sentences(base), `${s.id} base`).toBeLessThanOrEqual(2);
      expect(sentences(full), `${s.id} full`).toBeLessThanOrEqual(3);
    });
  });
  it('PRD 4.3: 판별 poll/appeal/source/pledge 의 knows_<kind> 변주가 다음 장 이야기/생활 문화 장면에 있다', () => {
    const kinds: JudgeKind[] = ['poll', 'appeal', 'source', 'pledge'];
    kinds.forEach((k) => {
      const c = scenes.find((s) => s.kind === 'judge' && s.judge === k)!.chapter;
      const next = inChapter((c + 1) as Chapter).filter((s) => s.kind === 'story' || s.kind === 'culture');
      expect(next.some((s) => s.text.join('').includes(`{{flag:knows_${k}|`)), k).toBe(true);
    });
  });
  it('모든 토큰 문법이 닫혀 있다', () => {
    scenes.forEach((s) => s.text.forEach((t) => {
      const opens = (t.match(/\{\{/g) ?? []).length;
      const closes = (t.match(/\}\}/g) ?? []).length;
      expect(opens, s.id).toBe(closes);
      expect(t.replace(token, '').includes('{{'), s.id).toBe(false);
    }));
  });
});

describe('용어·묘사 상한', () => {
  it("'유신' 은 2장 어른 대사 한 줄에만, '유신 체제' 는 없다", () => {
    expect(allText).not.toContain('유신 체제');
    expect(allText.split('유신').length - 1).toBe(1);
    const hit = scenes.filter((s) => s.text.some((t) => t.includes('유신')));
    expect(hit.map((s) => s.id)).toEqual(['c2-s04']);
    expect(hit[0].speaker).toBe('이웃 어른');
    expect(timeline.some((e) => e.label.includes('유신'))).toBe(false);
  });
  it('표기 변형 0건', () => {
    const bad = ['4.19', '4·19혁명', '4ㆍ19', '5.18', '5·18민주화', '5ㆍ18', '6월민주항쟁', '6월 항쟁', '6월항쟁', '3.15', '3·15부정', '5.16', '5·16군사', '정전협정'];
    expect(bad.filter((w) => allText.includes(w))).toEqual([]);
    ['3·15 부정 선거', '4·19 혁명', '5·16 군사 정변', '5·18 민주화 운동', '6월 민주 항쟁'].forEach((w) => expect(allText).toContain(w));
  });
  it('묘사 상한 금지어 없음', () => {
    const banned = ['시신', '피를', '피가', '총을 쏘', '고문 장면', '총소리', '시체', '최루탄 피격'];
    expect(banned.filter((w) => sceneText.includes(w))).toEqual([]);
    expect(banned.filter((w) => allText.includes(w))).toEqual([]);
  });
  it("박종철은 '경찰의 고문으로 사망' 한 문장만, 꼬마 상주는 언급하지 않는다", () => {
    expect(sceneText.split('박종철').length - 1).toBe(1);
    expect(sceneText.split('고문').length - 1).toBe(1);
    expect(sceneText).toContain('경찰의 고문으로 사망했다');
    expect(allText).not.toContain('꼬마 상주');
  });
  it('공식 용어가 해당 장 본문(scene.text)에 교과서 표기 그대로 나온다', () => {
    const body = (c: Chapter) => inChapter(c).filter((s) => s.kind !== 'title').flatMap((s) => s.text).join('\n');
    expect(body(1)).toContain('4·19 혁명');
    expect(body(2)).toContain('5·16 군사 정변');
    expect(body(3)).toContain('5·18 민주화 운동');
    expect(body(4)).toContain('6월 민주 항쟁');
  });
  it('1960년 인물의 말에 시대착오 없음: 1장 대사에 "지금은 한 번만"·"지금도 두 번" 없음', () => {
    const c1 = inChapter(1).map((s) => JSON.stringify(s)).join('\n');
    expect(c1).not.toContain('지금은 한 번만');
    expect(c1).not.toContain('지금도 두 번');
  });
  it('계엄군·신군부·정변은 처음 나올 때 괄호로 뜻을 풀어 준다', () => {
    const all = scenes.flatMap((s) => s.text).join('\n');
    for (const w of ['정변', '신군부', '계엄군']) {
      const i = all.indexOf(w);
      expect(i, w).toBeGreaterThanOrEqual(0);
      expect(all.slice(i + w.length, i + w.length + 1), w).toBe('(');
    }
  });
  it('3장 상한 표현 사용', () => {
    const c3 = inChapter(3).flatMap((s) => s.text).join(' ');
    ['폭력적으로 진압', '많은 시민이 희생', '방송은 광주 시민을 폭도라고 했다'].forEach((w) => expect(c3).toContain(w));
  });
  it('진짜 정치인 이름 없음', () => {
    const names = ['이승만', '박정희', '전두환'];
    expect(judges.pledge.candidates.map((c) => c.name).filter((n) => names.some((x) => n.includes(x)))).toEqual([]);
    expect(JSON.stringify(judges.pledge)).not.toMatch(/노태우|김영삼|김대중/);
  });
});

describe('연표·문구', () => {
  it('고정 사건이 시간순으로 있다', () => {
    const labels = timeline.map((e) => e.label);
    ['3·15 부정 선거', '4·19 혁명', '5·16 군사 정변', '5·18 민주화 운동', '6월 민주 항쟁'].forEach((l) => expect(labels).toContain(l));
    expect(labels).not.toContain('헌법 개정, 긴 집권');
    expect(timeline.some((e) => e.year === 1972)).toBe(false);
    expect(timeline.length).toBe(10);
    const years = timeline.filter((e) => e.year !== undefined).map((e) => e.year as number);
    expect(years).toEqual([...years].sort((a, b) => a - b));
    expect(timeline[timeline.length - 1]).toEqual({ label: '오늘', chapter: 5 });
    expect(labels.slice(0, 4)).toEqual(['3·15 부정 선거', '김주열 학생 발견', '4·19 혁명', '이승만 대통령 하야']);
  });
  it('UI 문구·다짐 5줄', () => {
    ['start', 'resume', 'next', 'finishJudge', 'vote', 'restart'].forEach((k) => expect((copy.ui as Record<string, unknown>)[k]).toBeTruthy());
    expect(copy.habits.length).toBe(5);
    copy.habits.forEach((h) => expect(h.length).toBeGreaterThan(5));
  });
});
