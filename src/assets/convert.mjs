// dev-time: PNG -> webp via Playwright canvas. 실행: democracy-journey 폴더에서 `node src/assets/convert.mjs`
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const IMG = join(ROOT, 'assets/img'), KIT = join(IMG, 'kit'), UIKIT = join(ROOT, '../시안/democracy-journey/ui/kit');
const OUT = join(ROOT, 'src/assets/img');
mkdirSync(OUT, { recursive: true });
const jobs = []; // {src,name,max,q,half?,group}
const ls = (d) => readdirSync(d).filter((f) => f.endsWith('.png'));
for (const f of ls(IMG)) {
  const n = basename(f, '.png');
  if (n.startsWith('bg-')) jobs.push({ src: join(IMG, f), name: n, max: 1280, q: 0.6, group: 'bg' });
  else if (n.startsWith('po-')) jobs.push({ src: join(IMG, f), name: n, max: 400, q: 0.82, group: 'portrait-sheet' });
  else if (n.startsWith('cmp-')) {
    const id = n.split('-')[1];
    for (const half of ['then', 'today']) jobs.push({ src: join(IMG, f), name: `cmp-${id}-${half}`, max: 640, q: 0.7, half, group: 'compare' });
  }
}
for (const f of ls(KIT)) {
  const n = basename(f, '.png');
  jobs.push({ src: join(KIT, f), name: n, max: n.startsWith('po-') ? 400 : 600, q: 0.72, group: n.startsWith('po-') ? 'portrait' : n.startsWith('info-') ? 'info' : 'organ' });
}
for (const f of ls(UIKIT)) {
  const n = basename(f, '.png');
  const icon = n.startsWith('icon-');
  jobs.push({ src: join(UIKIT, f), name: icon ? n : `ui-${n}`, max: icon ? 256 : 1024, q: icon ? 0.82 : 0.9, group: icon ? 'icon' : 'ui' });
}
const skip = new Set(['portrait-sheet']); // 일러스트 시트(po-y10.png 등)는 쓰지 않음
const browser = await chromium.launch();
const page = await browser.newPage();
const sums = {};
for (const j of jobs) {
  if (skip.has(j.group)) continue;
  const b64 = readFileSync(j.src).toString('base64');
  const out = await page.evaluate(async ({ b64, max, q, half }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    let sx = 0, sw = img.width;
    if (half) { sw = Math.floor(img.width / 2); sx = half === 'then' ? 0 : img.width - sw; }
    const s = Math.min(1, max / sw);
    const c = document.createElement('canvas');
    c.width = Math.round(sw * s); c.height = Math.round(img.height * s);
    c.getContext('2d').drawImage(img, sx, 0, sw, img.height, 0, 0, c.width, c.height);
    return c.toDataURL('image/webp', q).split(',')[1];
  }, { b64, max: j.max, q: j.q, half: j.half });
  const buf = Buffer.from(out, 'base64');
  writeFileSync(join(OUT, j.name + '.webp'), buf);
  const g = (sums[j.group] ??= { n: 0, kb: 0 });
  g.n++; g.kb += buf.length / 1024;
  console.log(j.group.padEnd(9), j.name.padEnd(24), (buf.length / 1024).toFixed(0).padStart(5), 'KB');
}
await browser.close();
console.table(Object.fromEntries(Object.entries(sums).map(([k, v]) => [k, { files: v.n, KB: Math.round(v.kb) }])));
