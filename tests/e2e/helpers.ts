import type { Locator, Page } from '@playwright/test';
import { CONTENT } from '../../src/content';
import { COPY } from '../../src/content/copy';
import type { JudgeKind, SourceCard } from '../../src/content/types';
import { sortSpots } from '../../src/ui/judge/drag';

type Trust = 'low' | 'mid' | 'high';
export interface SourceSpec { checks: boolean[]; trust: Trust }
export interface Overrides { source?: Record<string, SourceSpec>; onFeedback?: (kind: JudgeKind) => Promise<void> }
export interface PlayOpts { stopAtTitle3?: boolean; over?: Overrides }

const J = CONTENT.judges;
const FB = '.fb [data-primary], .fside [data-primary]';
const clicks = new WeakMap<Page, number>();
export const clickCount = (p: Page) => clicks.get(p) ?? 0;
async function tap(p: Page, loc: Locator) {
  clicks.set(p, clickCount(p) + 1);
  await loc.click();
}

export async function start(page: Page) {
  clicks.set(page, 0);
  await page.goto('/?debug=1');
  await tap(page, page.getByRole('button', { name: COPY.ui.start, exact: true }));
}

export async function clickPrimary(page: Page, sel = '.stage [data-primary]') {
  const b = page.locator(sel).first();
  await b.waitFor();
  await tap(page, b);
}

// story/culture 장면에서 고를 카드 번호: 잠기지 않았고 오개념 없는 첫 카드(culture 는 정답 카드).
export async function chooseFirst(page: Page) {
  const info = await page.evaluate(() => ({
    labels: [...document.querySelectorAll('.cards .card .t')].map((e) => e.textContent ?? ''),
    locked: [...document.querySelectorAll('.cards .card')].map((e) => e.getAttribute('aria-disabled') === 'true'),
  }));
  const sc = CONTENT.scenes.find((s) => s.options.length === info.labels.length && s.options.every((o, i) => o.label === info.labels[i]));
  if (!sc) throw new Error(`장면을 못 찾음: ${info.labels.join(' | ')}`);
  let i = sc.kind === 'culture' ? sc.options.findIndex((o) => o.id === sc.culture!.answer) : sc.options.findIndex((o, k) => !o.misconception && !info.locked[k]);
  if (i < 0 || info.locked[i]) throw new Error(`고를 카드 없음: ${sc.id}`);
  await tap(page, page.locator('.cards .card').nth(i));
  if (sc.kind === 'culture') await tap(page, page.locator('.culture-pick .btn'));
}

const correctSource = (c: SourceCard): SourceSpec => ({ checks: [...c.answerChecks], trust: c.answerTrust });

async function answerSourceCard(page: Page, c: SourceCard, spec: SourceSpec) {
  const g = page.getByRole('group', { name: c.source, exact: true });
  for (let i = 0; i < 4; i++) if (spec.checks[i]) await tap(page, g.getByRole('checkbox').nth(i));
  await tap(page, g.getByRole('button', { name: COPY.ui.trust[spec.trust], exact: true }));
}

export async function answerJudge(page: Page, kind: JudgeKind, over: Overrides = {}) {
  if (kind === 'poll') {
    const spots = sortSpots(J.poll.spots);
    for (const [i, s] of spots.entries()) if (s.violation !== null) await tap(page, page.getByRole('button', { name: `${COPY.ui.spotLabel} ${i + 1}`, exact: true }));
    await clickPrimary(page);
  } else if (kind === 'appeal') {
    for (let i = 0; i < J.appeal.cards.length; i++) await tap(page, page.locator('.flipcard').nth(i));
    await tap(page, page.locator('.grid3 .card').nth(J.appeal.why.findIndex((w) => w.correct)));
  } else if (kind === 'source') {
    for (const c of J.source.cards) await answerSourceCard(page, c, over.source?.[c.id] ?? correctSource(c));
    await clickPrimary(page);
  } else if (kind === 'pledge') {
    const ups = page.getByRole('button', { name: COPY.ui.scoreUp, exact: true });
    const n = await ups.count();
    for (let i = 0; i < n; i++) await tap(page, ups.nth(i)); // 9칸 모두 1점 → 동점이라 어느 후보든 정답(R15)
    await tap(page, page.getByRole('button', { name: `${J.pledge.candidates[0].name}${COPY.ui.voteFor}` }));
  } else {
    const re = (t: string) => new RegExp(`^\\s*${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
    const zone = (o: string) => page.getByRole('button', { name: `${COPY.ui.organs[o as 'assembly']} ${COPY.ui.zoneSuffix}`, exact: true });
    for (const c of J.organ.cards) {
      await tap(page, page.locator('.tray .chip').filter({ hasText: re(c.label) }));
      await tap(page, zone(c.organ));
    }
    for (const c of J.organ.checks) {
      await tap(page, page.locator('.tray .chip').filter({ hasText: re(`${COPY.ui.organs[c.from]} → ${c.label}`) }));
      await tap(page, zone(c.to));
    }
  }
  await page.locator(FB).first().waitFor();
  await over.onFeedback?.(kind);
  await clickPrimary(page, FB); // 피드백의 '다음'
}

type Screen = 'title' | 'poll' | 'appeal' | 'source' | 'pledge' | 'organ' | 'compare' | 'retry' | 'scene' | 'result' | 'none';
const screenOf = (page: Page) => page.evaluate((): Screen => {
  const q = (s: string) => !!document.querySelector(`.stage ${s}`);
  const map: [string, Screen][] = [['.sum', 'result'], ['.chtitle', 'title'], ['.pfield', 'poll'], ['.flipcard', 'appeal'], ['.sgrid', 'source'], ['.pgrid', 'pledge'], ['.organ-drag', 'organ'], ['.cmp', 'compare'], ['.rbody', 'retry'], ['.cards', 'scene']];
  return map.find(([s]) => q(s))?.[1] ?? 'none';
});

// 시드 완주 루프. 화면을 읽어 다음 동작을 고른다. 결과 화면(또는 3장 제목)에서 멈춘다.
export async function play(page: Page, { stopAtTitle3, over = {} }: PlayOpts = {}) {
  const title3 = CONTENT.scenes.find((s) => s.id === 'c3-s01')!.text[0];
  for (let step = 0; step < 400; step++) {
    const s = await screenOf(page);
    if (s === 'result') return;
    if (s === 'none') { await page.waitForTimeout(100); continue; }
    if (s === 'title') {
      if (stopAtTitle3 && (await page.locator('.chtitle h1').textContent()) === title3) return;
      await page.waitForSelector('.chtitle', { state: 'detached', timeout: 5000 }); // 1.5초 자동 진행
    } else if (s === 'scene') await chooseFirst(page);
    else if (s === 'compare') await clickPrimary(page);
    else if (s === 'retry') {
      // 큐에 없으면 곧바로 넘어가 화면이 사라진다. 있으면 정보 카드만 다룬다.
      await page.waitForTimeout(150);
      const g = page.locator('.rbody .icard');
      if ((await g.count()) === 0) continue;
      const src = await g.getAttribute('aria-label');
      const c = J.source.cards.find((x) => x.source === src)!;
      await answerSourceCard(page, c, correctSource(c));
      await clickPrimary(page);
      await clickPrimary(page, FB);
    } else await answerJudge(page, s, over);
  }
  throw new Error('완주 루프 400 단계 초과');
}

export async function readSave(page: Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('dj.save.v1');
    return raw ? JSON.parse(raw) : null;
  });
}

export const noT = (log: { t?: number }[]) => log.map(({ t: _t, ...r }) => r);
