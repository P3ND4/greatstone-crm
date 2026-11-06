// Small CRM display helpers shared by lists and detail pages.
import { Link } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { useT } from '../../i18n/index.jsx';
import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';
import Menu from '../ui/Menu.jsx';
import { IconButton } from '../ui/Button.jsx';

export const LEAD_STATUS_TONE = { new: 'info', contacted: 'accent', qualified: 'warning', converted: 'success', disqualified: 'neutral' };
export const CONTACT_TYPE_TONE = { client: 'accent', partner: 'info', referrer: 'success', architect: 'warning', contractor: 'neutral' };
export const PROSPECT_STATUS_TONE = { new: 'neutral', contacted: 'info', replied: 'accent', meeting: 'warning', converted: 'success', notInterested: 'neutral' };

export function PersonCell({ name, sub, to, dark }) {
  const inner = (
    <span className="cell-person">
      <Avatar name={name} dark={dark} title="" />
      <span style={{ minWidth: 0 }}>
        <span className="cell-person__name" style={{ display: 'block' }}>{name}</span>
        {sub && <span className="cell-person__sub" style={{ display: 'block' }}>{sub}</span>}
      </span>
    </span>
  );
  return to ? <Link to={to} onClick={(e) => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>{inner}</Link> : inner;
}

export function Score({ value }) {
  const tone = value >= 75 ? 'var(--success)' : value >= 50 ? 'var(--chart-1)' : 'var(--text-subtle)';
  return (
    <span className="score" aria-label={`Score ${value}`}>
      <span className="score__bar" aria-hidden="true"><span style={{ width: `${value}%`, background: tone }} /></span>
      <span>{value}</span>
    </span>
  );
}

export function StatusBadge({ ns, value, tones }) {
  const t = useT();
  return <Badge tone={tones[value] || 'neutral'} dot>{t(`${ns}.${value}`)}</Badge>;
}

export function UserChip({ user }) {
  if (!user) return <span className="subtle">—</span>;
  return <span className="row" style={{ gap: 6 }}><Avatar name={user.name} size="sm" title="" /><span className="truncate">{user.name.split(' ')[0]}</span></span>;
}

/** Row action menu; stops click from opening the row. items: [{ label, icon, onClick?, to? }] */
export function RowMenu({ items, label }) {
  const t = useT();
  return (
    <div className="row-actions" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Menu label={label ?? t('common.actions')} trigger={(p) => <IconButton icon={MoreHorizontal} size="sm" label={label ?? t('common.actions')} {...p} />}>
        {(close) => items.map((it) => {
          const Icon = it.icon;
          return it.to
            ? <Link key={it.label} role="menuitem" className="menu__item" to={it.to} onClick={close}>{Icon && <Icon />}{it.label}</Link>
            : <button key={it.label} role="menuitem" type="button" className="menu__item" onClick={() => { close(); it.onClick(); }}>{Icon && <Icon />}{it.label}</button>;
        })}
      </Menu>
    </div>
  );
}
