// Tiny color helpers for the brand-accent setting (hex in, hex out). No dependencies.

const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
export const isHex = (v) => /^#[0-9a-f]{6}$/i.test(String(v || ''));

function toRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (rgb) => `#${rgb.map((c) => clamp(c).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

/** Mix `hex` with `other` (weight = share of `other`, 0–1). */
export function mix(hex, other, weight) {
  const a = toRgb(hex);
  const b = toRgb(other);
  return toHex(a.map((c, i) => c * (1 - weight) + b[i] * weight));
}

function luminance(hex) {
  return toRgb(hex)
    .map((c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; })
    .reduce((acc, c, i) => acc + c * [0.2126, 0.7152, 0.0722][i], 0);
}

/** WCAG contrast ratio between two hex colors. */
export function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100;
}

/** CSS custom properties derived from one accent color (same names as tokens.css). Dark theme lifts it for contrast. */
export function accentVars(hex, dark = false) {
  if (dark) {
    // Lighten until dark text on the accent (buttons) reaches 4.5:1.
    let w = 0.28;
    while (w < 0.9 && contrast(mix(hex, '#FFFFFF', w), '#12100A') < 4.6) w += 0.04;
    return {
      '--accent': mix(hex, '#FFFFFF', w),
      '--accent-hover': mix(hex, '#FFFFFF', Math.min(w + 0.12, 0.95)),
      '--accent-strong': mix(hex, '#FFFFFF', Math.min(w + 0.27, 0.95)),
      '--accent-soft': mix(hex, '#12100A', 0.78),
    };
  }
  return {
    '--accent': hex,
    '--accent-hover': mix(hex, '#000000', 0.16),
    '--accent-strong': mix(hex, '#000000', 0.34),
    '--accent-soft': mix(hex, '#FFFFFF', 0.86),
  };
}
