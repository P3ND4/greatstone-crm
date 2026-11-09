import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { useT } from '../../i18n/index.jsx';
import Badge from '../ui/Badge.jsx';

const CONSENT = {
  opted_in: { tone: 'success', icon: ShieldCheck },
  opted_out: { tone: 'danger', icon: ShieldAlert },
  unknown: { tone: 'warning', icon: ShieldQuestion },
};

/** SMS consent status (thread header, contact panel, contact page). */
export default function ConsentBadge({ consent }) {
  const t = useT();
  const status = consent?.status || 'unknown';
  const c = CONSENT[status] || CONSENT.unknown;
  return <Badge tone={c.tone} icon={c.icon}>{t(`comms.sms.consent.${status}`)}</Badge>;
}
