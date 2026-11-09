/*
 * SMS length rules (what carriers bill). Pure functions, shared by the composer, templates and services.
 * GSM-7: 160 chars in one SMS, 153 per part when split. Characters from the GSM extension table ({}[]~\^|€)
 * count as 2. Any other character (emoji, curly quotes, accents outside GSM) switches the whole message to
 * UCS-2: 70 chars in one SMS, 67 per part.
 */
const GSM_BASIC = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
const GSM_EXT = '^{}\\[~]|€\f';

export function smsInfo(text = '') {
  const chars = [...text];
  const gsm = chars.every((ch) => GSM_BASIC.includes(ch) || GSM_EXT.includes(ch));
  const units = gsm ? chars.reduce((n, ch) => n + (GSM_EXT.includes(ch) ? 2 : 1), 0) : chars.length;
  const single = gsm ? 160 : 70;
  const multi = gsm ? 153 : 67;
  const segments = units === 0 ? 0 : units <= single ? 1 : Math.ceil(units / multi);
  const limit = segments <= 1 ? single : segments * multi;
  return { encoding: gsm ? 'GSM-7' : 'UCS-2', units, segments, remaining: limit - units, perSegment: segments <= 1 ? single : multi };
}

/** Text actually delivered for an outbound SMS (first message of a thread carries brand + opt-out footer). */
export function composeSms(body, { first = false, prefix = '', footer = '' } = {}) {
  if (!first) return body;
  const start = prefix && !body.startsWith(prefix.trim()) ? `${prefix.trim()} ` : '';
  const end = footer && !body.includes(footer.trim()) ? ` ${footer.trim()}` : '';
  return `${start}${body}${end}`;
}

/** Opt-out / opt-in keywords carriers and CTIA expect (case-insensitive, whole message). */
export const STOP_WORDS = ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'];
export const START_WORDS = ['START', 'YES', 'UNSTOP'];
export const HELP_WORDS = ['HELP', 'INFO'];
export const keywordOf = (text = '') => {
  const w = text.trim().toUpperCase();
  if (STOP_WORDS.includes(w)) return 'stop';
  if (START_WORDS.includes(w)) return 'start';
  if (HELP_WORDS.includes(w)) return 'help';
  return null;
};

/** Minutes since midnight in an IANA time zone (quiet-hours check in the recipient's local time). */
export function minutesInZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === 'hour').value);
  const m = Number(parts.find((p) => p.type === 'minute').value);
  return h * 60 + m;
}
export const hhmmToMinutes = (s) => { const [h, m] = String(s).split(':').map(Number); return h * 60 + (m || 0); };
