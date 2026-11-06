// Deterministic PRNG so the mock data is identical on every load.
export function createRandom(seed = 42) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    weighted: (entries) => {
      const total = entries.reduce((a, [, w]) => a + w, 0);
      let r = next() * total;
      for (const [v, w] of entries) { if ((r -= w) <= 0) return v; }
      return entries[entries.length - 1][0];
    },
    round: (value, step = 1) => Math.round(value / step) * step,
  };
}
