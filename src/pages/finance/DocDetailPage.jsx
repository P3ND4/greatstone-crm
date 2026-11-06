import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRightLeft, BellRing, Check, CircleDollarSign, Download, Pencil, Send, Trash2, X } from 'lucide-react';
import DocPreview from '../../components/finance/DocPreview.jsx';
import TotalsBox from '../../components/finance/TotalsBox.jsx';
import { useQuickActions } from '../../components/quick/QuickActionsProvider.jsx';
import { ConfirmDialog, PageShell } from '../../components/shells/index.js';
import { Badge, Button, Card, DataState, EmptyState, Skeleton, useToast } from '../../components/ui/index.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { date, money } from '../../lib/format.js';
import { financeService } from '../../services/index.js';
import { API, BASE, TONE } from './DocsListPage.jsx';

/** Estimate / invoice detail: PDF-like preview + status actions + payments (invoice). */
export default function DocDetailPage({ kind }) {
  const t = useT();
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const quick = useQuickActions();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const api = API[kind];
  const isInvoice = kind === 'invoice';
  const ns = isInvoice ? 'invoiceStatus' : 'estimateStatus';
  const { data, loading, error, refetch } = useResource(() => api.get(id), [id, kind]);
  const d = data?.doc;

  const setStatus = async (status, msg) => { await api.setStatus(id, status); toast.show(msg); refetch(); };
  const convert = async () => { const inv = await financeService.convertToInvoice(id); toast.show(t('finance.convertedToast', { number: inv.number })); navigate(`/finance/invoices/${inv.id}/edit`); };
  const remind = async () => { await financeService.sendReminder(id); toast.show(t('finance.reminderToast', { number: d.number })); refetch(); };
  const remove = async () => { setConfirmDelete(false); await api.remove(id); toast.show(t('finance.deletedToast', { number: d.number })); navigate(BASE[kind], { replace: true }); };

  return (
    <PageShell fallback={BASE[kind]} breadcrumbs={[{ label: t('nav.finance'), to: BASE[kind] }, { label: t(`nav.${kind}s`), to: BASE[kind] }, { label: d?.number ?? '…' }]}>
      <DataState loading={loading && !data} error={error} onRetry={refetch} skeleton={<div className="stack"><Skeleton height={48} width="40%" /><Skeleton height={520} /></div>}>
        {d && (
          <>
            <div className="detail-head no-print">
              <div style={{ minWidth: 0 }}>
                <h1 className="detail-head__title">{t(`finance.kind.${kind}`)} {d.number}</h1>
                <div className="detail-head__meta">
                  <Badge tone={TONE[kind][d.status]} dot>{t(`${ns}.${d.status}`)}</Badge>
                  {d.client && <Link to={`/crm/contacts/${d.client.id}`}>{d.client.name}</Link>}
                  {d.project && <Link to={`/projects/${d.project.id}?tab=finance`}>· {d.project.name}</Link>}
                  {d.daysOverdue > 0 && <span style={{ color: 'var(--danger)', fontWeight: 600 }}>· {t('finance.daysLate', { n: d.daysOverdue })}</span>}
                </div>
              </div>
              <div className="page-head__actions">
                <Button icon={Download} onClick={() => window.print()}>{t('finance.actions.pdf')}</Button>
                {d.status === 'draft' && <Button icon={Pencil} to={`${BASE[kind]}/${d.id}/edit`}>{t('common.edit')}</Button>}
                {d.status === 'draft' && <Button icon={Trash2} onClick={() => setConfirmDelete(true)}>{t('common.delete')}</Button>}
                {d.status === 'draft' && <Button variant="primary" icon={Send} onClick={() => setStatus('sent', t('finance.sentToast', { number: d.number }))}>{t('finance.actions.send')}</Button>}
                {!isInvoice && ['sent', 'viewed'].includes(d.status) && (
                  <>
                    <Button icon={X} onClick={() => setStatus('declined', t('finance.declinedToast'))}>{t('finance.actions.decline')}</Button>
                    <Button icon={Check} onClick={() => setStatus('accepted', t('finance.acceptedToast'))}>{t('finance.actions.accept')}</Button>
                  </>
                )}
                {!isInvoice && ['sent', 'viewed', 'accepted'].includes(d.status) && !data.invoices.length && <Button variant="primary" icon={ArrowRightLeft} onClick={convert}>{t('finance.actions.convert')}</Button>}
                {isInvoice && ['sent', 'partial', 'overdue'].includes(d.status) && (
                  <>
                    <Button icon={BellRing} onClick={remind}>{t('finance.actions.remind')}</Button>
                    <Button variant="primary" icon={CircleDollarSign} onClick={() => quick.open('payment', { invoice: d, onSaved: refetch })}>{t('payment.short')}</Button>
                  </>
                )}
              </div>
            </div>

            <div className="doc-layout">
              <DocPreview doc={d} />
              <aside className="stack no-print">
                <Card title={t('finance.summary')}>
                  <TotalsBox totals={d.totals} paid={isInvoice ? d.paid : null} />
                  <dl className="dl" style={{ marginTop: 16 }}>
                    <div><dt>{isInvoice ? t('contacts.issued') : t('finance.date')}</dt><dd>{date(isInvoice ? d.issuedAt : d.createdAt)}</dd></div>
                    <div><dt>{isInvoice ? t('contacts.due') : t('finance.validUntil')}</dt><dd>{date(isInvoice ? d.dueAt : d.expiresAt)}</dd></div>
                    {isInvoice && d.remindersSent > 0 && <div><dt>{t('finance.reminders')}</dt><dd>{t('finance.remindersSent', { n: d.remindersSent })}</dd></div>}
                  </dl>
                </Card>
                {isInvoice && (
                  <Card title={t('finance.payments')} flush>
                    {data.payments.length ? (
                      <ul className="list">
                        {data.payments.map((p) => (
                          <li key={p.id} className="list-item">
                            <CircleDollarSign size={18} style={{ color: 'var(--success)' }} aria-hidden="true" />
                            <div className="list-item__main">
                              <p className="list-item__title tnum">{money(p.amount)}</p>
                              <p className="list-item__meta">{date(p.date)} · {t(`payment.methods.${p.method}`)}{p.reference ? ` · ${p.reference}` : ''}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : <EmptyState compact title={t('finance.noPayments')} />}
                  </Card>
                )}
                {(data.source || data.invoices.length > 0) && (
                  <Card title={t('finance.linked')} flush>
                    <ul className="list">
                      {data.source && (
                        <li><Link className="list-item" to={`/finance/estimates/${data.source.id}`}><div className="list-item__main"><p className="list-item__title">{t('finance.kind.estimate')} {data.source.number}</p></div><span className="list-item__aside tnum">{money(data.source.totals.total)}</span></Link></li>
                      )}
                      {data.invoices.map((i) => (
                        <li key={i.id}><Link className="list-item" to={`/finance/invoices/${i.id}`}><div className="list-item__main"><p className="list-item__title">{t('finance.kind.invoice')} {i.number}</p><p className="list-item__meta">{t(`invoiceStatus.${i.status}`)}</p></div><span className="list-item__aside tnum">{money(i.totals.total)}</span></Link></li>
                      ))}
                    </ul>
                  </Card>
                )}
              </aside>
            </div>
          </>
        )}
      </DataState>
      <ConfirmDialog open={confirmDelete} title={t('finance.deleteTitle', { number: d?.number })} body={t('finance.deleteBody')} confirmLabel={t('common.delete')} cancelLabel={t('common.cancel')} onCancel={() => setConfirmDelete(false)} onConfirm={remove} />
    </PageShell>
  );
}
