import { format, isThisWeek, isToday, isYesterday } from 'date-fns';

export function shortTime(iso) {
  const d = new Date(iso);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  if (isThisWeek(d)) return format(d, 'EEE');
  return format(d, 'MMM d');
}

export function dayDivider(iso) {
  const d = new Date(iso);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMMM d');
}

export const LABEL_COLORS = { Clients: 'var(--chart-1)', Vendors: 'var(--chart-2)', Permits: 'var(--warning)', Billing: 'var(--success)' };
