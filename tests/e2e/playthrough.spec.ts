import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { CONTENT } from '../../src/content';
import { COPY } from '../../src/content/copy';
import { verdict } from '../../src/engine/verdict';
import { clickCount, noT, play, readSave, start } from './helpers';

test.describe.configure({ mode: 'serial' });
test.setTimeout(5 * 60_000);

const doneSave = async (page: Page) => {
  await expect.poll(async () => (await readSave(page))?.stage).toBe('done');
  return readSave(page);
};

test('시드 완주: 클릭 ≤120, S1~S10 통과', async ({ page }) => {
  await start(page);
  await play(page);
  expect(await page.getByRole('button', { name: COPY.ui.restart }).isVisible()).toBe(true);
  const save = await doneSave(page);
  const log = save.log;
  const v = verdict(log);
  for (let n = 1; n <= 10; n++) expect(v.fails, `S${n}`).not.toContain(`S${n}`);
  expect(v.pass).toBe(true);
  for (const k of ['poll', 'appeal', 'source', 'pledge', 'organ']) expect(log.some((e: { type: string; kind?: string }) => e.type === 'judge' && e.kind === k), k).toBe(true);
  expect(log.filter((e: { type: string }) => e.type === 'compare_view')).toHaveLength(5);
  // 훅이 같은 판정을 낸다
  expect(await page.evaluate(() => (window as unknown as { __dj: { verdict: () => { pass: boolean } } }).__dj.verdict().pass)).toBe(true);
  console.log(`clicks=${clickCount(page)} log=${log.length}`);
  expect(clickCount(page)).toBeLessThanOrEqual(120);
});

test('결정성: 새 컨텍스트 2회 로그 동일(t 제외)', async ({ browser }) => {
  const logs: unknown[] = [];
  for (let i = 0; i < 2; i++) {
    const ctx = await browser.newContext({ baseURL: 'http://localhost:4174' });
    const page = await ctx.newPage();
    await start(page);
    await play(page);
    logs.push(noT((await doneSave(page)).log));
    await ctx.close();
  }
  expect(logs[0]).toEqual(logs[1]);
});

test('복원: 3장 제목에서 새로고침 → 이어하기(3장)', async ({ page }) => {
  await start(page);
  await play(page, { stopAtTitle3: true });
  await expect.poll(async () => (await readSave(page))?.log.filter((e: { type: string }) => e.type === 'chapter_end').length).toBe(2);
  const before = (await readSave(page)).stats as Record<string, number>;
  await page.reload();
  await page.getByRole('button', { name: `${COPY.ui.resume} (3장)`, exact: true }).click();
  await expect(page.locator('.chtitle h1')).toHaveText(CONTENT.scenes.find((s) => s.id === 'c3-s01')!.text[0]);
  const first = CONTENT.scenes.find((s) => s.id === 'c3-s02')!;
  await expect(page.locator('.dialog')).toContainText(first.text[0].split('}}').pop()!.trim().slice(0, 12));
  for (const k of ['join', 'info', 'home'] as const) {
    await expect(page.getByRole('img', { name: `${COPY.ui.stats[k]} ${before[k]}/3` })).toBeVisible();
  }
});

test('오개념 경로: 3장 정보 카드 방송 높음 → M14 피드백, 4장 다시 보기에서 정답, S10 통과', async ({ page }) => {
  await start(page);
  // 방송(radio) 카드를 기준 하나 없이 '높음' 으로 신뢰
  const radioWrong = { checks: [false, false, false, false], trust: 'high' as const };
  const sourceCards = CONTENT.judges.source.cards;
  expect(sourceCards.find((c) => c.id === 'radio')!.answerTrust).not.toBe('high');
  await play(page, {
    over: {
      source: { radio: radioWrong },
      // 피드백이 떠 있는 동안 M14 문구를 확인한다
      onFeedback: async (kind) => { if (kind === 'source') await expect(page.locator('.fside')).toContainText(COPY.feedback.M14); },
    },
  });
  const save = await doneSave(page);
  expect(save.log.some((e: { type: string; kind?: string; item?: string; attempt?: number; correct?: boolean; misconception?: string }) => e.type === 'judge' && e.kind === 'source' && e.item === 'radio' && e.attempt === 1 && e.correct === false && e.misconception === 'M14')).toBe(true);
  expect(save.log.some((e: { type: string; item?: string; correct?: boolean }) => e.type === 'retry' && e.item === 'radio' && e.correct === true)).toBe(true);
  const v = verdict(save.log);
  expect(v.fails).not.toContain('S10');
  expect(v.pass).toBe(true);
});

test('debug 훅: ?debug 없는 프로덕션에는 window.__dj 없음', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => '__dj' in window)).toBe(false);
  await page.goto('/?debug=1');
  await expect.poll(() => page.evaluate(() => '__dj' in window)).toBe(true);
});
