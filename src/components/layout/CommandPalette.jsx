import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Building2, CalendarPlus, CheckSquare, Contact, CornerDownLeft, Receipt, Search, StickyNote, UserPlus } from 'lucide-react';
import { flatNav } from '../../app/navigation.js';
import { useT } from '../../i18n/index.jsx';
import useFocusTrap from '../../hooks/useFocusTrap.js';
import useScrollLock from '../../hooks/useScrollLock.js';
import { searchService } from '../../services/index.js';
import { useQuickActions } from '../quick/QuickActionsProvider.jsx';

const KIND_ICON = { contact: Contact, lead: UserPlus, project: Building2, invoice: Receipt };

/** Global search / command palette — Ctrl/⌘+K. */
export default function CommandPalette({ open, onClose }) {
  const t = useT();
  const navigate = useNavigate();
  const quick = useQuickActions();
  const panel = useRef(null);
  const [q, setQ] = useState('');
  const [records, setRecords] = useState([]);
  const [active, setActive] = useState(0);
  useScrollLock(open);
  useFocusTrap(panel, open);

  useEffect(() => { if (!open) { setQ(''); setRecords([]); setActive(0); } }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    const handle = setTimeout(() => { searchService.query(q).then((r) => { if (alive) setRecords(r); }); }, 120);
    return () => { alive = false; clearTimeout(handle); };
  }, [q, open]);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const pages = flatNav()
      .map((n) => ({ id: `nav-${n.id}`, group: 'pages', label: t(n.labelKey), meta: n.parentKey ? t(n.parentKey) : '', icon: n.icon, run: () => navigate(n.to) }))
      .filter((p) => !needle || p.label.toLowerCase().includes(needle));
    const actions = [
      { id: 'a-task', label: `${t('common.create')}: ${t('quick.task')}`, icon: CheckSquare, run: () => quick.open('task') },
      { id: 'a-appt', label: `${t('common.create')}: ${t('quick.appointment')}`, icon: CalendarPlus, run: () => quick.open('appointment') },
      { id: 'a-note', label: `${t('common.create')}: ${t('quick.note')}`, icon: StickyNote, run: () => quick.open('note') },
      { id: 'a-lead', label: `${t('common.create')}: ${t('quick.lead')}`, icon: UserPlus, run: () => navigate('/crm/leads/new') },
    ].map((a) => ({ ...a, group: 'actions' })).filter((a) => !needle || a.label.toLowerCase().includes(needle));
    const recs = records.map((r) => ({ id: r.id, group: 'records', label: r.label, meta: r.meta, icon: KIND_ICON[r.kind], run: () => navigate(r.to) }));
    return [...recs, ...pages.slice(0, needle ? 8 : 6), ...actions];
  }, [q, records, t, navigate, quick]);

  useEffect(() => { setActive(0); }, [q]);
  if (!open) return null;

  const choose = (item) => { onClose(); item.run(); };
  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && items[active]) { e.preventDefault(); choose(items[active]); }
  };

  let lastGroup = null;
  return createPortal(
    <div className="palette-root" onKeyDown={onKeyDown}>
      <div className="modal-backdrop" onMouseDown={onClose} aria-hidden="true" />
      <div ref={panel} className="palette" role="dialog" aria-modal="true" aria-label={t('palette.title')}>
        <div className="palette__input">
          <Search aria-hidden="true" />
          <input
            data-autofocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('palette.placeholder')}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={items[active] ? `pi-${items[active].id}` : undefined}
            aria-autocomplete="list"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="palette__list" id="palette-list" role="listbox" aria-label={t('palette.title')}>
          {items.length === 0 && <p className="empty empty--compact">{t('palette.empty', { q })}</p>}
          {items.map((item, i) => {
            const header = item.group !== lastGroup ? <div className="palette__group" role="presentation">{t(`palette.${item.group}`)}</div> : null;
            lastGroup = item.group;
            const Icon = item.icon;
            return (
              <div key={item.id}>
                {header}
                <div
                  id={`pi-${item.id}`}
                  role="option"
                  aria-selected={i === active}
                  className="palette__item"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(item)}
                >
                  {Icon && <Icon aria-hidden="true" />}
                  <span className="truncate">{item.label}</span>
                  {item.meta && <span className="meta">{item.meta}</span>}
                  {i === active && <CornerDownLeft aria-hidden="true" style={{ marginLeft: item.meta ? 0 : 'auto' }} />}
                </div>
              </div>
            );
          })}
        </div>
        <div className="palette__foot">{t('palette.hint')}</div>
      </div>
    </div>,
    document.body,
  );
}
