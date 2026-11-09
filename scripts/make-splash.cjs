/*
 * iOS launch screens (apple-touch-startup-image). iOS ignores the manifest's background_color: without
 * these, an installed app opens on a blank white screen. One PNG per iPhone screen size (portrait),
 * brand background + wordmark. Writes public/splash/*.png and prints the <link> tags for index.html.
 *   npm run splash     (WORD="Greatstone" DOT="." BG="#171200" FG="#FFFEED" ACCENT="#B39A4B")
 * Needs Playwright (see README).
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const FONT_FILE = path.join(ROOT, 'node_modules/@fontsource/work-sans/files/work-sans-latin-600-normal.woff2');
const { WORD = 'Greatstone', DOT = '.', BG = '#171200', FG = '#FFFEED', ACCENT = '#B39A4B' } = process.env;
const font = fs.readFileSync(FONT_FILE).toString('base64');

// [CSS width, CSS height, device pixel ratio] — current and recent iPhones (portrait).
const DEVICES = [
  [440, 956, 3], // 16 Pro Max
  [402, 874, 3], // 16 Pro
  [430, 932, 3], // 16 Plus · 15 Plus · 15 Pro Max · 14 Pro Max
  [393, 852, 3], // 16 · 15 · 15 Pro · 14 Pro
  [390, 844, 3], // 14 · 13 · 13 Pro · 12 · 12 Pro
  [428, 926, 3], // 14 Plus · 13 Pro Max · 12 Pro Max
  [375, 812, 3], // 13 mini · 12 mini · 11 Pro · XS · X
  [414, 896, 3], // 11 Pro Max · XS Max
  [414, 896, 2], // 11 · XR
  [375, 667, 2], // SE (2nd/3rd gen) · 8
];

const html = (w) => `<!doctype html><style>
@font-face { font-family: Brand; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 600; }
html, body { margin: 0; height: 100%; background: ${BG}; }
body { display: grid; place-items: center; }
.w { font-family: Brand; font-weight: 600; color: ${FG}; font-size: ${Math.round(w * 0.1)}px; letter-spacing: -0.01em; }
.w span { color: ${ACCENT}; }
</style><div class="w">${WORD}<span>${DOT}</span></div>`;

(async () => {
  const out = path.join(ROOT, 'public/splash');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const links = [];
  for (const [w, h, dpr] of DEVICES) {
    const file = `splash-${w * dpr}x${h * dpr}.png`;
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
    await page.setContent(html(w));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(out, file) });
    await page.close();
    links.push(`    <link rel="apple-touch-startup-image" href="/splash/${file}" media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)" />`);
  }
  await browser.close();
  console.log(links.join('\n'));
})();
