/*
 * Responsive + console audit: every route × 10 widths. Fails (exit 1) on horizontal page overflow
 * or any console error/warning. Run against a production build:
 *   npm run build && npm run preview          (other terminal)
 *   npm run qa:audit                          (sidebar open)
 *   COLLAPSED=1 npm run qa:audit              (sidebar hidden)
 *   BASE=http://localhost:5173 npm run qa:audit   (dev server: also catches "[i18n] missing key" warnings)
 * Needs Playwright once: npm i -D playwright && npx playwright install chromium
 */
const { chromium } = require('playwright');
const routes = require('./routes.cjs');
const prepare = require('./session.cjs');

const BASE = process.env.BASE || 'http://localhost:4173';
const WIDTHS = [[320, 640], [375, 812], [414, 896], [600, 900], [768, 1024], [1024, 768], [1280, 800], [1536, 864], [1920, 1080], [2560, 1440]];
const IGNORE = [/cross-world service worker/]; // Chrome notice while the service worker takes control on first load

(async () => {
  const browser = await chromium.launch();
  let problems = 0;
  for (const [w, h] of (process.env.WIDTHS ? WIDTHS.filter(([x]) => process.env.WIDTHS.split(',').includes(String(x))) : WIDTHS)) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await prepare(page, { collapsed: process.env.COLLAPSED === '1' });
    const logs = [];
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !IGNORE.some((r) => r.test(m.text()))) logs.push(`${m.type()}: ${m.text().slice(0, 200)}`); });
    page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
    for (const r of routes) {
      logs.length = 0;
      await page.goto(BASE + r, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 0 || logs.length) { problems += 1; console.log(`✗ ${w}px ${r} overflow=${overflow}`, [...new Set(logs)].slice(0, 3)); }
    }
    await page.close();
    console.log(`✓ ${w}px done`);
  }
  await browser.close();
  console.log(problems ? `${problems} problem(s)` : 'All routes clean.');
  process.exit(problems ? 1 : 0);
})();
