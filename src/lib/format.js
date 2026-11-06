// Formatting helpers. Currency is USD with cents — never silently rounded.
import { format, formatDistanceToNowStrict, isToday, isTomorrow } from 'date-fns';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usdCompact = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });
const int = new Intl.NumberFormat('en-US');

export const EMPTY = '—';

export function money(value) {
  if (value == null || Number.isNaN(value)) return EMPTY;
  return usd.format(value);
}

/** Compact currency for chart axes and dense tiles only (e.g. $1.2M). */
export function moneyCompact(value) {
  if (value == null || Number.isNaN(value)) return EMPTY;
  return usdCompact.format(value);
}

export function number(value) {
  if (value == null || Number.isNaN(value)) return EMPTY;
  return int.format(value);
}

export function percent(value, digits = 0) {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) return EMPTY;
  return `${(value * 100).toFixed(digits)}%`;
}

export function date(value, pattern = 'MMM d, yyyy') {
  if (!value) return EMPTY;
  return format(new Date(value), pattern);
}

export function time(value) {
  if (!value) return EMPTY;
  return format(new Date(value), 'h:mm a');
}

export function dayLabel(value) {
  const d = new Date(value);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEE, MMM d');
}

export function ago(value) {
  if (!value) return EMPTY;
  return formatDistanceToNowStrict(new Date(value));
}

export function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}
