import { Link, useNavigate, useParams } from 'react-router-dom';
import { Building2, CalendarPlus, CheckSquare, Mail, MapPin, MessageCircle, Pencil, Phone, Receipt, UserPlus } from 'lucide-react';
import { CONTACT_TYPE_TONE } from '../../../components/crm/bits.jsx';
import { useQuickActions } from '../../../components/quick/QuickActionsProvider.jsx';
import { PageShell } from '../../../components/shells/index.js';
import { Avatar, Badge, Button, Card, DataState, EmptyState, Skeleton, Table, Tabs } from '../../../components/ui/index.js';
import useResource from '../../../hooks/useResource.js';
import useUrlState from '../../../hooks/useUrlState.js';
import { useT } from '../../../i18n/index.jsx';
import { ago, date, dayLabel, money, percent, time } from '../../../lib/format.js';
import { crmService } from '../../../services/index.js';

export const INVOICE_TONE = { draft: 'neutral', sent: 'info', partial: 'warning', paid: 'success', overdue: 'danger' };
export const PROJECT_TONE = { planning: 'neutral', design: 'info', permits: 'warning', construction: 'accent', finishing: 'accent', completed: 'success', onHold: 'neutral' };

export default function ContactDetailPage() {
  const t = useT();
  const { id } = useParams();
  const navigate = useNavigate();
  const quick = useQuickActions();
  const [tab, setTab] = useUrlState('tab', 'overview');
  const { data, loading, error, refetch } = useResource(() => crmService.contact(id), [id]);
  const c = data?.contact;
  const isVendor = c && ['partner', 'contractor'].includes(c.type);

  const tabs = data ? [
    { id: 'overview', label: t('contacts.tabs.overview') },
    { id: 'communications', label: t('nav.communications'), count: data.conversations.length },
    { id: 'projects', label: t('nav.projects'), count: data.projects.length },
    isVendor
      ? { id: 'expenses', label: t('nav.expenses'), count: data.expenses.length }
      : { id: 'invoices', label: t('nav.invoices'), count: data.invoices.length },
  ] : [];

  return (
    <PageShell fallback="/crm/contacts" breadcrumbs={[{ label: t('nav.crm'), to: '/crm/contacts' }, { label: t('contacts.title'), to: '/crm/contacts' }, { label: c?.name ?? '…' }]}>
      <DataState loading={loading && !data} error={error} onRetry={refetch} skeleton={<div className="stack"><Skeleton height={44} width="40%" /><Skeleton height={240} /></div>}>
        {c && (
          <>
            <div className="detail-head">
              <div className="detail-head__main">
                <Avatar name={c.name} size="lg" dark={isVendor} />
                <div style={{ minWidth: 0 }}>
                  <h1 className="detail-head__title">{c.name}</h1>
                  <div className="detail-head__meta">
                    <Badge tone={CONTACT_TYPE_TONE[c.type]}>{t(`contactTypes.${c.type}`)}</Badge>
                    {c.company && <span>{c.company}{c.specialty ? ` · ${c.specialty}` : ''}</span>}
                    {c.tags.filter((x) => x !== c.type).map((x) => <Badge key={x}>{x}</Badge>)}
                  </div>
                </div>
              </div>
              <div className="page-head__actions">
                <Button icon={MessageCircle} to="/crm/communications/whatsapp">{t('channels.whatsapp')}</Button>
                <Button icon={Mail} to={`/crm/communications/email/compose?to=${encodeURIComponent(c.email)}&contact=${c.id}`}>{t('channels.email')}</Button>
                <Button icon={CalendarPlus} onClick={() => quick.open('appointment', { contactId: c.id })}>{t('quick.appointment')}</Button>
                <Button icon={Pencil} onClick={() => quick.open('contact', { contact: c, onSaved: refetch })}>{t('common.edit')}</Button>
              </div>
            </div>

            <Tabs label={c.name} value={tab} onChange={setTab} tabs={tabs} />
            <div className="tab-panel" role="tabpanel">
              {tab === 'overview' && (
                <div className="detail-grid">
                  <div className="stack">
                    <Card title={t('contacts.details')}>
                      <dl className="dl dl--2">
                        <div><dt>{t('leads.fields.email')}</dt><dd><a href={`mailto:${c.email}`}>{c.email}</a></dd></div>
                        <div><dt>{t('leads.fields.phone')}</dt><dd><a href={`tel:${c.phone}`} className="tnum">{c.phone}</a></dd></div>
                        <div><dt>{t('contacts.address')}</dt><dd>{c.address || '—'}</dd></div>
                        <div><dt>{t('leads.fields.neighborhood')}</dt><dd>{c.neighborhood || '—'}</dd></div>
                        <div><dt>{t('leads.fields.source')}</dt><dd>{t(`sources.${c.source}`)}</dd></div>
                        <div><dt>{t('list.owner')}</dt><dd>{data.owner?.name ?? '—'}</dd></div>
                        <div><dt>{t('contacts.since')}</dt><dd>{date(c.createdAt)}</dd></div>
                      </dl>
                    </Card>
                    <Card title={t('contacts.referrals')} subtitle={t('contacts.referralsSub')} flush>
                      {data.referrals.length ? (
                        <ul className="list">
                          {data.referrals.map((l) => (
                            <li key={l.id}>
                              <Link className="list-item" to={`/crm/leads/${l.id}`}>
                                <Avatar name={l.name} size="sm" />
                                <div className="list-item__main"><p className="list-item__title">{l.name}</p><p className="list-item__meta">{t(`services.${l.serviceType}`)} · {date(l.createdAt, 'MMM d, yyyy')}</p></div>
                                <span className="list-item__aside tnum">{money(l.budget)}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : <EmptyState compact icon={UserPlus} title={t('contacts.noReferrals')} />}
                    </Card>
                  </div>
                  <Card title={t('contacts.upcoming')} flush>
                    {data.appointments.length ? (
                      <ul className="list">
                        {data.appointments.slice(0, 6).map((a) => (
                          <li key={a.id}>
                            <Link className="list-item" to={`/crm/agenda/${a.id}`}>
                              <span className="date-chip" aria-hidden="true"><span className="date-chip__m">{date(a.start, 'MMM')}</span><span className="date-chip__d">{date(a.start, 'd')}</span></span>
                              <div className="list-item__main"><p className="list-item__title">{a.title}</p><p className="list-item__meta">{dayLabel(a.start)} · {time(a.start)}</p></div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : <EmptyState compact icon={CalendarPlus} title={t('dashboard.lists.noAppointments')} action={<Button size="sm" onClick={() => quick.open('appointment', { contactId: c.id })}>{t('quick.appointment')}</Button>} />}
                  </Card>
                </div>
              )}

              {tab === 'communications' && (
                <Card flush>
                  {data.conversations.length ? (
                    <ul className="list">
                      {data.conversations.map((cv) => (
                        <li key={cv.id}>
                          <Link className="list-item" to={`/crm/communications/${cv.channel}?c=${cv.id}`}>
                            <Badge tone={cv.channel === 'whatsapp' ? 'success' : 'info'} icon={cv.channel === 'whatsapp' ? MessageCircle : Mail}>{t(`channels.${cv.channel}`)}</Badge>
                            <div className="list-item__main"><p className="list-item__title">{cv.subject || cv.lastMessage}</p><p className="list-item__meta">{cv.subject ? cv.lastMessage : ''}</p></div>
                            <span className="list-item__aside">{ago(cv.lastMessageAt)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : <EmptyState icon={MessageCircle} title={t('contacts.noConversations')} />}
                </Card>
              )}

              {tab === 'projects' && (
                <Card flush className="list-card">
                  {data.projects.length ? (
                    <Table
                      caption={t('nav.projects')}
                      rows={data.projects}
                      onRowClick={(p) => navigate(`/projects/${p.id}`)}
                      columns={[
                        { key: 'name', header: t('dashboard.health.project'), render: (p) => <span className="row"><Building2 size={16} className="subtle" aria-hidden="true" /><strong style={{ fontWeight: 500 }}>{p.name}</strong></span> },
                        { key: 'status', header: t('list.status'), render: (p) => <Badge tone={PROJECT_TONE[p.status]} dot>{t(`projectStatus.${p.status}`)}</Badge> },
                        { key: 'neighborhood', header: t('leads.fields.neighborhood'), hide: 'lg', render: (p) => <span className="row"><MapPin size={14} className="subtle" aria-hidden="true" />{p.neighborhood}</span> },
                        { key: 'budget', header: t('contacts.budget'), align: 'right', render: (p) => money(p.budget) },
                        { key: 'progress', header: t('dashboard.health.progress'), align: 'right', render: (p) => percent(p.progress) },
                      ]}
                    />
                  ) : <EmptyState icon={Building2} title={t('contacts.noProjects')} />}
                </Card>
              )}

              {tab === 'invoices' && (
                <Card flush className="list-card">
                  {data.invoices.length ? (
                    <Table
                      caption={t('nav.invoices')}
                      rows={data.invoices}
                      onRowClick={(i) => navigate(`/finance/invoices/${i.id}`)}
                      columns={[
                        { key: 'number', header: '#', render: (i) => <span className="row tnum"><Receipt size={16} className="subtle" aria-hidden="true" />{i.number}</span> },
                        { key: 'issuedAt', header: t('contacts.issued'), render: (i) => date(i.issuedAt) },
                        { key: 'dueAt', header: t('contacts.due'), hide: 'lg', render: (i) => date(i.dueAt) },
                        { key: 'status', header: t('list.status'), render: (i) => <Badge tone={INVOICE_TONE[i.status]} dot>{t(`invoiceStatus.${i.status}`)}</Badge> },
                        { key: 'total', header: t('contacts.total'), align: 'right', render: (i) => money(i.total) },
                        { key: 'balance', header: t('contacts.balance'), align: 'right', render: (i) => money(i.total - i.paid) },
                      ]}
                    />
                  ) : <EmptyState icon={Receipt} title={t('contacts.noInvoices')} />}
                </Card>
              )}

              {tab === 'expenses' && (
                <Card flush className="list-card">
                  {data.expenses.length ? (
                    <Table
                      caption={t('nav.expenses')}
                      rows={data.expenses}
                      columns={[
                        { key: 'date', header: t('appointment.date'), render: (e) => date(e.date) },
                        { key: 'category', header: t('contacts.category'), render: (e) => t(`expenseCategories.${e.category}`) },
                        { key: 'type', header: t('list.type'), render: (e) => <Badge>{e.type === 'po' ? 'PO' : t('contacts.expense')}</Badge> },
                        { key: 'status', header: t('list.status'), render: (e) => <Badge tone={e.status === 'approved' ? 'success' : 'warning'} dot>{t(`approvalStatus.${e.status}`)}</Badge> },
                        { key: 'amount', header: t('contacts.total'), align: 'right', render: (e) => money(e.amount) },
                      ]}
                    />
                  ) : <EmptyState icon={CheckSquare} title={t('contacts.noExpenses')} />}
                </Card>
              )}
            </div>
          </>
        )}
      </DataState>
    </PageShell>
  );
}
