import { Check, Ruler } from 'lucide-react';
import { Badge, Card, EmptyState } from '../../../components/ui/index.js';
import { useT } from '../../../i18n/index.jsx';
import { number } from '../../../lib/format.js';

const TONE = { design: 'info', inProgress: 'warning', done: 'success' };

export default function ScopeTab({ d }) {
  const t = useT();
  if (!d.rooms.length) return <Card><EmptyState icon={Ruler} title={t('projects.noRooms')} /></Card>;
  const total = d.rooms.reduce((a, r) => a + r.areaSqft, 0);
  return (
    <div className="stack">
      <p className="muted">{t('projects.scopeSummary', { n: d.rooms.length, area: number(total) })}</p>
      <div className="grid grid-3">
        {d.rooms.map((room) => (
          <Card key={room.id} title={room.name} subtitle={`${number(room.areaSqft)} sq ft`} actions={<Badge tone={TONE[room.status]} dot>{t(`roomStatus.${room.status}`)}</Badge>}>
            <ul className="stack-sm">
              {room.scope.map((s) => (
                <li key={s} className="row" style={{ alignItems: 'flex-start' }}>
                  <Check size={14} style={{ marginTop: 3, color: 'var(--accent)', flex: 'none' }} aria-hidden="true" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <p className="subtle" style={{ fontSize: 12, marginTop: 12 }}>{t('projects.selectionsInRoom', { n: d.selections.filter((s) => s.roomId === room.id).length })}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
