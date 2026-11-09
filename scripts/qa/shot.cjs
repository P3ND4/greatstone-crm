/*
 * Screenshot one page:  npm run qa:shot -- /crm/leads out.png [width] [height] [scale] [full]
 *   COLLAPSED=1 → sidebar hidden · SIGNED_OUT=1 → no session (e.g. /login)
 */
const { chromium } = require('playwright');
const prepare = require('./session.cjs');

const [, , route = '/', out = 'shot.png', w = '1440', h = '900', scale = '1', full = '0'] = process.argv;
const BASE = process.env.BASE || 'http://localhost:4173';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +scale });
  await prepare(page, { collapsed: process.env.COLLAPSED === '1', signedIn: process.env.SIGNED_OUT !== '1' });
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: out, fullPage: full === '1' });
  await browser.close();
  console.log(`saved ${out}`);
})();
