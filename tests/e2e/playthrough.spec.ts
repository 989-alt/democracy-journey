import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { CONTENT } from '../../src/content';
import { COPY } from '../../src/content/copy';
import { verdict } from '../../src/engine/verdict';
import { sortSpots } from '../../src/ui/judge/drag';
import { clickCount, noT, play, readSave, sceneOnScreen, start } from './helpers';

const SHOTS = process.env.T10_SHOTS ?? '';
const shot = async (page: Page, name: string) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}` }); };

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
  // R32: 다시하기 → 저장 삭제, 타이틀에 이어하기 없음(새로고침해도)
  await page.getByRole('button', { name: COPY.ui.restart }).click();
  await expect(page.getByRole('button', { name: COPY.ui.start, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: new RegExp(`^${COPY.ui.resume}`) })).toHaveCount(0);
  expect(await readSave(page)).toBeNull();
  await page.reload();
  await expect(page.getByRole('button', { name: COPY.ui.start, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: new RegExp(`^${COPY.ui.resume}`) })).toHaveCount(0);
});

test('R28 생활 문화: 첫 선택 확정·맞음/틀림 메모·수치 칩 숨김 / R30 판별 피드백에서 새로고침해도 다시 풀 수 없음 / R32 시작은 저장 삭제', async ({ page }) => {
  await start(page);
  await play(page, { until: async () => (await sceneOnScreen(page)) === 'c1-s07' });
  const sc = CONTENT.scenes.find((x) => x.id === 'c1-s07')!;
  const wrongIdx = sc.options.findIndex((o) => o.id !== sc.culture!.answer);
  const answer = sc.options.find((o) => o.id === sc.culture!.answer)!;
  await expect(page.locator('.cards .card .st')).toHaveCount(0); // 수치 칩 숨김
  await page.locator('.cards .card').nth(wrongIdx).click();
  const memo = page.locator('.dialog.memo');
  await expect(memo).toContainText(`${COPY.ui.answerIs} ${answer.label}`);
  await expect(memo).toContainText(sc.culture!.why[0]);
  await expect(memo.getByRole('img', { name: COPY.ui.wrong })).toBeVisible();
  // 다른 카드·숫자키는 무시
  const other = sc.options.findIndex((o, i) => i !== wrongIdx);
  await page.locator('.cards .card').nth(other).click();
  for (const k of ['1', '2', '3']) await page.keyboard.press(k);
  await expect(page.locator('.cards .card').nth(wrongIdx)).toHaveClass(/picked/);
  await expect(page.locator('.cards .card.picked')).toHaveCount(1);
  await expect(memo.getByRole('img', { name: COPY.ui.wrong })).toBeVisible();
  await shot(page, 't10-culture.png');
  // QA r1 #0·#2: 첫 답은 고르는 즉시 저장 → 메모를 본 채 새로고침해도 같은 답·메모(다시 고를 수 없음)
  expect((await readSave(page)).chosen['c1-s07']).toBe(sc.options[wrongIdx].id);
  await page.reload();
  await page.getByRole('button', { name: `${COPY.ui.resume} (${COPY.ui.chapterN(1)})`, exact: true }).click();
  await expect(memo.getByRole('img', { name: COPY.ui.wrong })).toBeVisible();
  await expect(page.locator('.cards .card').nth(wrongIdx)).toHaveClass(/picked/);
  await memo.getByRole('button', { name: COPY.ui.next }).click();

  // 1장 판별(투표소): 함정 하나만 누르고 판단 끝내기 → 피드백. 그 자리에서 새로고침.
  await page.locator('.pfield').waitFor();
  const spots = sortSpots(CONTENT.judges.poll.spots);
  const trap = spots.findIndex((x) => x.violation === null);
  await page.getByRole('button', { name: `${COPY.ui.spotLabel} ${trap + 1}`, exact: true }).click();
  await page.getByRole('button', { name: COPY.ui.finishJudge }).click();
  await expect(page.locator('.fb.poll')).toBeVisible();
  await expect.poll(async () => (await readSave(page))?.judges?.poll?.items?.length).toBe(6); // 판단 끝내기 직후 저장
  const save = await readSave(page);
  expect(save.log.find((e: { type: string; scene?: string }) => e.type === 'culture' && e.scene === 'c1-s07').option).toBe(sc.options[wrongIdx].id);
  await page.reload();
  await page.getByRole('button', { name: `${COPY.ui.resume} (${COPY.ui.chapterN(1)})`, exact: true }).click();
  await expect(page.locator('.fb.poll')).toBeVisible(); // 새 판이 아니라 저장된 채점 결과
  await expect(page.locator('.pbar')).toHaveCount(0);
  await expect(page.getByRole('button', { name: `${COPY.ui.spotLabel} ${trap + 1}`, exact: true })).toBeDisabled();
  await expect(page.locator('.fb.poll')).toContainText(COPY.feedback['poll.miss']);
  const judged = (await readSave(page)).log.filter((e: { type: string }) => e.type === 'judge').length;
  await page.locator('.fb.poll [data-primary]').click();
  await expect(page.locator('.cmp')).toBeVisible();

  // '시작'(새 게임)은 저장을 지운다 → 새로고침 뒤 이어하기 없음
  await page.reload();
  await expect(page.getByRole('button', { name: new RegExp(`^${COPY.ui.resume}`) })).toHaveCount(1);
  await page.getByRole('button', { name: COPY.ui.start, exact: true }).click();
  expect(await readSave(page)).toBeNull();
  await page.reload();
  await expect(page.getByRole('button', { name: new RegExp(`^${COPY.ui.resume}`) })).toHaveCount(0);
  expect(judged).toBe(6);
});

test('R29 다시 보기: 2장에서 큐의 poll 문항 전부를 차례로 / R31 M25 선택 직후 교정 메모', async ({ page }) => {
  await start(page);
  const asked: { kind: string; item: string; n: number }[] = [];
  const wrongPoll = ['bribe', 'trap_home']; // 위반 3곳 놓침 + 함정 1곳 누름 → 4문항 큐
  await play(page, {
    until: async () => (await sceneOnScreen(page)) === 'c4-s06',
    over: {
      poll: wrongPoll,
      onRetryItem: async (kind, item, n) => {
        const chapter = (await page.locator('.jtop .task').textContent()) ?? '';
        asked.push({ kind, item, n });
        if (n === 1 && kind === 'poll') await shot(page, 't10-retry.png');
        expect(chapter).toContain(COPY.ui.retryStart);
      },
    },
  });
  const ch2 = asked.filter((a) => a.kind === 'poll');
  expect(ch2.map((a) => a.item).sort()).toEqual(['group', 'proxy', 'stack', 'trap_home']);
  expect(ch2.map((a) => a.n)).toEqual([0, 1, 2, 3]); // 한 장면 안에서 차례로
  // 판단 직후 저장되는 3장 판별 저장본에 2장 다시 보기 기록이 있다
  const save = await readSave(page);
  const retried = save.log.filter((e: { type: string; chapter: number; kind?: string }) => e.type === 'retry' && e.chapter === 2 && e.kind === 'poll');
  expect(retried).toHaveLength(4);
  expect(save.retryQueue.filter((q: { kind: string }) => q.kind === 'poll')).toEqual([]);

  // R31: c4-s06 의 M25 선택지 → 교정 메모(도장 없음), 다른 카드 무시, '다음' 뒤 선택 기록
  const sc = CONTENT.scenes.find((x) => x.id === 'c4-s06')!;
  const mIdx = sc.options.findIndex((o) => o.misconception === 'M25');
  await page.locator('.cards .card').nth(mIdx).click();
  const memo = page.locator('.dialog.memo');
  await expect(memo).toContainText(COPY.feedback.M25);
  await expect(memo.locator('img.stamp')).toHaveCount(0);
  await page.locator('.cards .card').nth(mIdx === 0 ? 1 : 0).click();
  await expect(page.locator('.cards .card.picked')).toHaveCount(1);
  await expect(page.locator('.cards .card').nth(mIdx)).toHaveClass(/picked/);
  await shot(page, 't10-m25.png');
  await memo.getByRole('button', { name: COPY.ui.next }).click();
  await expect.poll(() => sceneOnScreen(page)).not.toBe('c4-s06');
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
