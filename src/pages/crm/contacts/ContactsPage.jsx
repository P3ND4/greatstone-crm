import { useNavigate } from 'react-router-dom';
import { CalendarPlus, Contact, Eye, Mail, Pencil, Phone, Plus } from 'lucide-react';
import { CONTACT_TYPE_TONE, PersonCell, RowMenu, UserChip } from '../../../components/crm/bits.jsx';
import ListToolbar, { FilterSelect, SearchInput, ViewToggle } from '../../../components/list/ListToolbar.jsx';
import { useQuickActions } from '../../../components/quick/QuickActionsProvider.jsx';
import { Avatar, Badge, Button, Card, DataState, Pagination, Skeleton, Table, Tabs } from '../../../components/ui/index.js';
import useListState from '../../../hooks/useListState.js';
import useResource from '../../../hooks/useResource.js';
import { useT } from '../../../i18n/index.jsx';
import { contactsService, lookupService } from '../../../services/index.js';
import { NEIGHBORHOODS } from '../../../data/constants.js';
import { SubNav } from '../../system/ModulePlaceholder.jsx';

/** Tab → contact types. Partners tab groups vendors/partners and contractors. */
const TABS = { all: null, client: ['client'], partner: ['partner', 'contractor'], referrer: ['referrer'], architect: ['architect'] };

export default function ContactsPage() {
  const t = useT();
  const navigate = useNavigate();
  const quick = useQuickActions();
  const list = useListState({ sort: 'name:asc', filters: ['tab', 'hood', 'owner'] });
  const tab = list.filters.tab || 'all';
  const { hood, owner } = list.filters;
  const users = lookupService.users();

  const { data: counts } = useResource(() => contactsService.list({ pageSize: 1000 }).then(({ items }) => Object.fromEntries(
    Object.entries(TABS).map(([k, types]) => [k, items.filter((c) => !types || types.includes(c.type)).length]),
  )), []);

  const { data, loading, error, refetch } = useResource(() => contactsService.list({
    q: list.q, page: list.page, pageSize: list.pageSize, sort: list.sort,
    filter: (c) => (!TABS[tab] || TABS[tab].includes(c.type)) && (!hood || c.neighborhood === hood) && (!owner || c.ownerId === owner),
  }), [list.q, list.page, list.sort, tab, hood, owner]);

  const menu = (c) => [
    { label: t('common.view'), icon: Eye, to: `/crm/contacts/${c.id}` },
    { label: t('common.edit'), icon: Pencil, onClick: () => quick.open('contact', { contact: c, onSaved: refetch }) },
    { label: t('quick.appointment'), icon: CalendarPlus, onClick: () => quick.open('appointment', { contactId: c.id }) },
  ];

  const columns = [
    { key: 'name', header: t('leads.columns.name'), sortable: true, render: (c) => <PersonCell name={c.name} sub={c.company || c.email} /> },
    { key: 'type', header: t('list.type'), render: (c) => <Badge tone={CONTACT_TYPE_TONE[c.type]}>{t(`contactTypes.${c.type}`)}</Badge> },
    { key: 'phone', header: t('leads.fields.phone'), hide: 'xl', render: (c) => <span className="tnum">{c.phone}</span> },
    { key: 'neighborhood', header: t('leads.fields.neighborhood'), sortable: true, hide: 'lg', render: (c) => c.neighborhood || '—' },
    { key: 'tags', header: t('contacts.tags'), hide: 'xxl', render: (c) => <span className="tag-list">{c.tags.filter((x) => x !== c.type).map((x) => <Badge key={x}>{x}</Badge>)}</span> },
    { key: 'ownerId', header: t('list.owner'), hide: 'md', render: (c) => <UserChip user={users.find((u) => u.id === c.ownerId)} /> },
    { key: 'actions', header: <span className="sr-only">{t('common.actions')}</span>, render: (c) => <RowMenu items={menu(c)} /> },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-head__eyebrow">{t('nav.crm')}</p>
          <h1 className="page-title">{t('contacts.title')}</h1>
          <p className="page-subtitle">{t('contacts.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <Button variant="primary" icon={Plus} onClick={() => quick.open('contact', { type: TABS[tab]?.[0] ?? 'client', onSaved: refetch })}>{t('contacts.new')}</Button>
        </div>
      </div>
      <SubNav section="crm" />
      <Tabs
        label={t('contacts.title')}
        value={tab}
        onChange={(v) => list.setFilter('tab', v === 'all' ? '' : v)}
        tabs={Object.keys(TABS).map((k) => ({ id: k, label: t(`contacts.tabs.${k}`), count: counts?.[k] }))}
      />
      <Card flush className="list-card" style={{ marginTop: 16 }}>
        <ListToolbar
          search={<SearchInput value={list.q} onChange={list.setQ} placeholder={t('contacts.search')} />}
          activeFilters={Number(Boolean(hood)) + Number(Boolean(owner)) + Number(Boolean(list.q))}
          onClear={() => { list.setFilter('hood', ''); list.setFilter('owner', ''); list.setQ(''); }}
          filters={(
            <>
              <FilterSelect label={t('leads.fields.neighborhood')} value={hood} onChange={(v) => list.setFilter('hood', v)} options={NEIGHBORHOODS.map((n) => ({ value: n, label: n }))} />
              <FilterSelect label={t('list.owner')} value={owner} onChange={(v) => list.setFilter('owner', v)} options={users.map((u) => ({ value: u.id, label: u.name }))} />
            </>
          )}
          end={<ViewToggle value={list.view} onChange={list.setView} />}
        />
        <DataState error={error} onRetry={refetch} empty={data && data.total === 0} emptyIcon={Contact} emptyTitle={t('list.noResults')} emptyBody="">
          {list.view === 'cards' ? (
            <div className="cards-grid">
              {loading && !data ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={140} radius={10} />) : data?.items.map((c) => (
                <a key={c.id} href={`/crm/contacts/${c.id}`} className="record-card" onClick={(e) => { e.preventDefault(); navigate(`/crm/contacts/${c.id}`); }}>
                  <div className="record-card__head">
                    <Avatar name={c.name} size="lg" title="" />
                    <div style={{ minWidth: 0 }}>
                      <p className="record-card__title">{c.name}</p>
                      <p className="record-card__sub">{c.company ? `${c.company}${c.specialty ? ` · ${c.specialty}` : ''}` : c.neighborhood}</p>
                    </div>
                  </div>
                  <div className="stack-sm" style={{ fontSize: 13 }}>
                    <span className="row muted"><Phone size={14} aria-hidden="true" /><span className="tnum">{c.phone}</span></span>
                    <span className="row muted"><Mail size={14} aria-hidden="true" /><span className="truncate">{c.email}</span></span>
                  </div>
                  <div className="record-card__foot">
                    <Badge tone={CONTACT_TYPE_TONE[c.type]}>{t(`contactTypes.${c.type}`)}</Badge>
                    <span className="tag-list">{c.tags.filter((x) => x !== c.type).slice(0, 2).map((x) => <Badge key={x}>{x}</Badge>)}</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <Table caption={t('contacts.title')} columns={columns} rows={data?.items || []} loading={loading && !data} sort={list.sort} onSort={list.setSort} onRowClick={(c) => navigate(`/crm/contacts/${c.id}`)} />
          )}
          {data && data.total > 0 && <Pagination page={list.page} pageSize={list.pageSize} total={data.total} onChange={list.setPage} />}
        </DataState>
      </Card>
    </>
  );
}
