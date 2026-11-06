import { useState } from 'react';
import { Package } from 'lucide-react';
import { Card, EmptyState, Select, Table, useToast } from '../../../components/ui/index.js';
import { useT } from '../../../i18n/index.jsx';
import { money, number } from '../../../lib/format.js';
import { projectsService } from '../../../services/index.js';

export const SELECTION_STATUSES = ['proposed', 'approved', 'ordered', 'delivered', 'installed'];

export default function SelectionsTab({ d, projectId }) {
  const t = useT();
  const toast = useToast();
  const [rows, setRows] = useState(d.selections);
  const [status, setStatus] = useState('');
  const visible = rows.filter((s) => !status || s.status === status);
  const total = visible.reduce((a, s) => a + s.qty * s.unitCost, 0);

  const change = async (s, value) => {
    setRows((list) => list.map((x) => (x.id === s.id ? { ...x, status: value } : x)));
    await projectsService.updateSelection(projectId, s.id, { status: value });
    toast.show(t('projects.selectionUpdated', { item: s.item, status: t(`selectionStatus.${value}`) }));
  };

  return (
    <Card
      flush
      className="list-card"
      title={t('projects.tabs.selections')}
      subtitle={t('projects.selectionsTotal', { total: money(total), n: visible.length })}
      actions={<Select className="select--sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t('list.status')} placeholder={`${t('list.status')}: ${t('common.all')}`} options={SELECTION_STATUSES.map((s) => ({ value: s, label: t(`selectionStatus.${s}`) }))} />}
    >
      {visible.length ? (
        <Table
          caption={t('projects.tabs.selections')}
          rows={visible}
          columns={[
            { key: 'item', header: t('projects.sel.item'), render: (s) => <span><strong style={{ fontWeight: 500, display: 'block' }}>{s.item}</strong><span className="muted" style={{ fontSize: 12 }}>{s.category}</span></span> },
            { key: 'room', header: t('projects.sel.room'), hide: 'xl', render: (s) => s.room?.name },
            { key: 'vendor', header: t('projects.sel.vendor'), hide: 'lg', render: (s) => <span className="truncate" style={{ display: 'block', maxWidth: 180 }}>{s.vendor?.company || s.vendor?.name}</span> },
            { key: 'qty', header: t('projects.sel.qty'), align: 'right', hide: 'md', render: (s) => `${number(s.qty)} ${s.unit}` },
            { key: 'unitCost', header: t('projects.sel.unitCost'), align: 'right', hide: 'xxl', render: (s) => money(s.unitCost) },
            { key: 'total', header: t('contacts.total'), align: 'right', render: (s) => money(s.qty * s.unitCost) },
            { key: 'lead', header: t('projects.sel.leadTime'), align: 'right', hide: 'xxl', render: (s) => t('projects.sel.weeks', { n: s.leadTimeWeeks }) },
            {
              key: 'status', header: t('list.status'),
              render: (s) => (
                <Select className={`select--sm status-select status-select--${s.status}`} value={s.status} onChange={(e) => change(s, e.target.value)} aria-label={`${t('list.status')}: ${s.item}`} options={SELECTION_STATUSES.map((x) => ({ value: x, label: t(`selectionStatus.${x}`) }))} />
              ),
            },
          ]}
        />
      ) : <EmptyState icon={Package} title={t('list.noResults')} />}
    </Card>
  );
}
