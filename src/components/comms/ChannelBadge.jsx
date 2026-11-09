import { Mail, MessageCircle, MessageSquareText } from 'lucide-react';
import { useT } from '../../i18n/index.jsx';
import Badge from '../ui/Badge.jsx';

const LOOK = { whatsapp: ['success', MessageCircle], sms: ['accent', MessageSquareText], email: ['info', Mail] };

/** Channel of a conversation (WhatsApp / SMS / Email) — same look everywhere. */
export default function ChannelBadge({ channel }) {
  const t = useT();
  const [tone, icon] = LOOK[channel] || ['neutral', null];
  return <Badge tone={tone} icon={icon}>{t(`channels.${channel}`)}</Badge>;
}
