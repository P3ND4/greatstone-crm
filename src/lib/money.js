/*
 * Exact money math for estimates / invoices. Everything is computed in integer cents and
 * rounded once per line (half-up), so totals never drift and nothing is silently rounded.
 * line: { qty, unitPrice, discountPct (0–100), taxable (bool) } · taxRate: 0.07 = 7%
 */
const toCents = (n) => Math.round(Number(n || 0) * 100);
const roundCents = (n) => Math.round(n + Number.EPSILON);

export function lineAmounts(line, taxRate) {
  const qty = Number(line.qty) || 0;
  const base = roundCents(qty * toCents(line.unitPrice));
  const discount = roundCents(base * (Number(line.discountPct) || 0) / 100);
  const net = base - discount;
  const tax = line.taxable ? roundCents(net * taxRate) : 0;
  return { base, discount, net, tax, total: net + tax };
}

/** Returns dollars (2-decimal numbers) for display, computed from cents. */
export function documentTotals(lines, taxRate) {
  const sum = lines.reduce((acc, l) => {
    const a = lineAmounts(l, taxRate);
    return { base: acc.base + a.base, discount: acc.discount + a.discount, net: acc.net + a.net, tax: acc.tax + a.tax, total: acc.total + a.total };
  }, { base: 0, discount: 0, net: 0, tax: 0, total: 0 });
  return { subtotal: sum.base / 100, discount: sum.discount / 100, taxable: sum.net / 100, tax: sum.tax / 100, total: sum.total / 100 };
}

export const centsToDollars = (c) => c / 100;
