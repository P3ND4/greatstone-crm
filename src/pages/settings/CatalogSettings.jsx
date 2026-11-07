import { useMemo, useState } from 'react';
import { Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { RowMenu } from '../../components/crm/bits.jsx';
import ListToolbar, { FilterSelect, SearchInput } from '../../components/list/ListToolbar.jsx';
import { ConfirmDialog, FormShell, ModalShell } from '../../components/shells/index.js';
import { Badge, Button, Card, DataState, Field, Input, Select, SkeletonList, Switch, Table, useToast } from '../../components/ui/index.js';
import useForm from '../../hooks/useForm.js';
import useListState from '../../hooks/useListState.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { money } from '../../lib/format.js';
import { settingsService } from '../../services/index.js';
import { SettingsHeader, useSettingsAccess } from './shared.jsx';

const KINDS = ['service', 'product'];
const UNITS = ['project', 'hour', 'week', 'lot', 'room', 'set', 'sq ft', 'linear ft', 'window', 'each'];

function CatalogModal({ item, onClose, onSaved }) {
  const t = useT();
  const toast = useToast();
  const form = useForm(
    { kind: item?.kind || 'service', name: item?.name || '', unit: item?.unit || 'each', price: item?.price != null ? String(item.price) : '', taxable: item?.taxable ?? false },
    {
      validate: (v) => ({
        name: !v.name.trim() && t('validation.required'),
        price: v.price === '' ? t('validation.required') : (Number.isNaN(Number(v.price)) || Number(v.price) < 0) && t('validation.number'),
      }),
      onSubmit: async (v) => {
        const saved = await settingsService.saveCatalogItem({ ...(item?.id ? { id: item.id } : {}), ...v, name: v.name.trim() });
        toast.show(t(item ? 'settings.catalog.updated' : 'settings.catalog.created', { name: saved.name }));
        onSaved();
        onClose();
      },
    },
  );
  const set = form.set;
  return (
    <ModalShell open onClose={onClose} size="md" dirty={form.dirty}>
      {({ titleId, requestClose }) => (
        <FormShell titleId={titleId} title={item ? t('settings.catalog.editTitle') : t('settings.catalog.newTitle')} subtitle={t('settings.catalog.modalSub')} onCancel={requestClose} onSubmit={form.submit} dirty={form.dirty} saving={form.saving} submitLabel={item ? t('common.save') : t('common.create')}>
          <div className="field-grid field-grid--2">
            <Field label={t('list.type')}>
              <Select {...form.bind('kind')} onChange={(e) => { set('kind', e.target.value); set('taxable', e.target.value === 'product'); }} options={KINDS.map((k) => ({ value: k, label: t(`settings.catalog.kind.${k}`) }))} />
            </Field>
            <Field label={t('settings.catalog.unit')}>
              <Select {...form.bind('unit')} options={UNITS.map((u) => ({ value: u, label: u }))} />
            </Field>
            <Field label={t('list.name')} error={form.errors.name} required full><Input {...form.bind('name')} data-autofocus /></Field>
            <Field label={t('settings.catalog.price')} error={form.errors.price} required><Input {...form.bind('price')} inputMode="decimal" suffix="USD" /></Field>
            <div className="field" style={{ justifyContent: 'flex-end' }}>
              <Switch checked={form.values.taxable} onChange={(v) => set('taxable', v)} label={t('settings.catalog.taxable')} description={t('settings.catalog.taxableHint')} />
            </div>
          </div>
        </FormShell>
      )}
    </ModalShell>
  );
}

export default function CatalogSettings() {
  const t = useT();
  const toast = useToast();
  const { readOnly } = useSettingsAccess();
  const list = useListState({ sort: 'name:asc', filters: ['kind'] });
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const { data, loading, error, refetch } = useResource(() => settingsService.catalog(), []);

  const rows = useMemo(() => {
    const needle = list.q.trim().toLowerCase();
    const [field, dir] = list.sort.split(':');
    return (data || [])
      .filter((c) => (!list.filters.kind || c.kind === list.filters.kind) && (!needle || c.name.toLowerCase().includes(needle)))
      .sort((a, b) => (a[field] > b[field] ? 1 : a[field] < b[field] ? -1 : 0) * (dir === 'desc' ? -1 : 1));
  }, [data, list.q, list.sort, list.filters.kind]);

  const newBtn = <Button variant="primary" icon={Plus} onClick={() => setEditing({ item: null })} disabled={readOnly}>{t('settings.catalog.new')}</Button>;
  return (
    <>
      <SettingsHeader section="catalog" actions={newBtn} />
      <ListToolbar
        search={<SearchInput value={list.q} onChange={list.setQ} placeholder={t('settings.catalog.search')} />}
        filters={<FilterSelect label={t('list.type')} value={list.filters.kind || ''} onChange={(v) => list.setFilter('kind', v)} options={KINDS.map((k) => ({ value: k, label: t(`settings.catalog.kind.${k}`) }))} />}
        activeFilters={list.activeFilters}
        onClear={list.clear}
      />
      <Card flush className="list-card">
        <DataState
          loading={loading}
          error={error}
          onRetry={refetch}
          skeleton={<div style={{ padding: 16 }}><SkeletonList rows={8} /></div>}
          empty={!rows.length}
          emptyIcon={Package}
          emptyTitle={list.q || list.filters.kind ? t('list.noResults') : t('settings.catalog.emptyTitle')}
          emptyBody={list.q || list.filters.kind ? undefined : t('settings.catalog.emptyBody')}
          emptyAction={list.q || list.filters.kind ? <Button size="sm" onClick={list.clear}>{t('list.clearFilters')}</Button> : (!readOnly && newBtn)}
        >
          <Table
            caption={t('settings.nav.catalog')}
            rows={rows}
            sort={list.sort}
            onSort={list.setSort}
            onRowClick={readOnly ? undefined : (c) => setEditing({ item: c })}
            columns={[
              { key: 'name', header: t('list.name'), sortable: true, render: (c) => <span style={{ fontWeight: 500 }}>{c.name}</span> },
              { key: 'kind', header: t('list.type'), sortable: true, hide: 'md', render: (c) => <Badge tone={c.kind === 'product' ? 'info' : 'accent'}>{t(`settings.catalog.kind.${c.kind}`)}</Badge> },
              { key: 'unit', header: t('settings.catalog.unit'), hide: 'lg', render: (c) => <span className="muted">{c.unit}</span> },
              { key: 'taxable', header: t('settings.catalog.taxable'), hide: 'md', render: (c) => (c.taxable ? <Badge tone="warning" dot>{t('common.yes')}</Badge> : <span className="subtle">{t('common.no')}</span>) },
              { key: 'price', header: t('settings.catalog.price'), sortable: true, align: 'right', render: (c) => <span className="tnum">{money(c.price)}<span className="subtle"> / {c.unit}</span></span> },
              {
                key: 'menu', header: <span className="sr-only">{t('common.actions')}</span>, align: 'right', width: 56,
                render: (c) => (readOnly ? null : (
                  <RowMenu label={t('settings.catalog.actionsFor', { name: c.name })} items={[
                    { label: t('common.edit'), icon: Pencil, onClick: () => setEditing({ item: c }) },
                    { label: t('common.delete'), icon: Trash2, onClick: () => setRemoving(c) },
                  ]} />
                )),
              },
            ]}
          />
        </DataState>
      </Card>
      <p className="subtle" style={{ fontSize: 13, marginTop: 12 }}>{t('settings.catalog.note', { n: data?.length ?? 0 })}</p>
      {editing && <CatalogModal key={editing.item?.id || 'new'} item={editing.item} onClose={() => setEditing(null)} onSaved={refetch} />}
      <ConfirmDialog
        open={Boolean(removing)}
        title={t('settings.catalog.deleteTitle')}
        body={removing && t('settings.catalog.deleteBody', { name: removing.name })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setRemoving(null)}
        onConfirm={async () => { const r = removing; setRemoving(null); await settingsService.removeCatalogItem(r.id); toast.show(t('settings.catalog.deleted', { name: r.name })); refetch(); }}
      />
    </>
  );
}
