/*
 * Generates the PWA / favicon PNGs in public/icons from a text mark + brand colors.
 *   npm run icons                      (defaults below)
 *   MARK="A" DOT="." BG="#0F172A" FG="#FFFFFF" ACCENT="#38BDF8" npm run icons
 * Font: Work Sans 600 from @fontsource (change FONT_FILE for another brand font). Needs Playwright.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const FONT_FILE = path.join(ROOT, 'node_modules/@fontsource/work-sans/files/work-sans-latin-600-normal.woff2');
const { MARK = 'G', DOT = '.', BG = '#171200', FG = '#FFFEED', ACCENT = '#B39A4B' } = process.env;
const font = fs.readFileSync(FONT_FILE).toString('base64');

// [file, size px, empty margin share (maskable needs ~20%), corner radius]
const JOBS = [['icon-192.png', 192, 0.12, 0], ['icon-512.png', 512, 0.12, 0], ['maskable-512.png', 512, 0.2, 0], ['apple-touch-icon.png', 180, 0.12, 0], ['favicon-32.png', 32, 0.06, 7]];
const html = (size, pad, radius) => `<!doctype html><style>
@font-face { font-family: Brand; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 600; }
html, body { margin: 0; background: transparent; }
.i { width: ${size}px; height: ${size}px; background: ${BG}; border-radius: ${radius}px; display: grid; place-items: center; }
.m { font-family: Brand; font-weight: 600; color: ${FG}; font-size: ${size * (1 - 2 * pad) * 0.78}px; line-height: 1; letter-spacing: -0.02em; transform: translateY(-3%); }
.m span { color: ${ACCENT}; }
</style><div class="i"><div class="m">${MARK}<span>${DOT}</span></div></div>`;

(async () => {
  const out = path.join(ROOT, 'public/icons');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  for (const [file, size, pad, radius] of JOBS) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(html(size, pad, radius));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(out, file), omitBackground: true });
    await page.close();
  }
  await browser.close();
  console.log(`Icons written to public/icons (${JOBS.map((j) => j[0]).join(', ')})`);
})();
