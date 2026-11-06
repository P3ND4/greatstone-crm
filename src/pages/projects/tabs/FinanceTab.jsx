import { useState } from 'react';
import { CircleDollarSign, FileText, Receipt } from 'lucide-react';
import { ESTIMATE_TONE, INVOICE_TONE } from '../../../components/crm/bits.jsx';
import { useQuickActions } from '../../../components/quick/QuickActionsProvider.jsx';
import { Badge, Button, Card, EmptyState, Table } from '../../../components/ui/index.js';
import { useT } from '../../../i18n/index.jsx';
import { date, money } from '../../../lib/format.js';

export default function FinanceTab({ d }) {
  const t = useT();
  const quick = useQuickActions();
  const [invoices, setInvoices] = useState(d.invoices);
  const billed = invoices.reduce((a, i) => a + i.total, 0);
  const collected = invoices.reduce((a, i) => a + i.paid, 0);
  return (
    <div className="stack">
      <div className="summary-strip">
        <div className="card kpi"><span className="kpi__label">{t('projects.form.contract')}</span><span className="kpi__value">{money(d.project.contractValue)}</span></div>
        <div className="card kpi"><span className="kpi__label">{t('projects.billed')}</span><span className="kpi__value">{money(billed)}</span></div>
        <div className="card kpi"><span className="kpi__label">{t('projects.collected')}</span><span className="kpi__value">{money(collected)}</span></div>
        <div className="card kpi"><span className="kpi__label">{t('contacts.balance')}</span><span className="kpi__value">{money(billed - collected)}</span></div>
      </div>
      <Card flush className="list-card" title={t('nav.estimates')}>
        {d.estimates.length ? (
          <Table
            caption={t('nav.estimates')}
            rows={d.estimates}
            columns={[
              { key: 'number', header: '#', render: (e) => <span className="row tnum"><FileText size={16} className="subtle" aria-hidden="true" />{e.number}</span> },
              { key: 'createdAt', header: t('projects.created'), render: (e) => date(e.createdAt) },
              { key: 'expiresAt', header: t('projects.expires'), hide: 'md', render: (e) => date(e.expiresAt) },
              { key: 'status', header: t('list.status'), render: (e) => <Badge tone={ESTIMATE_TONE[e.status]} dot>{t(`estimateStatus.${e.status}`)}</Badge> },
              { key: 'total', header: t('contacts.total'), align: 'right', render: (e) => money(e.total) },
            ]}
          />
        ) : <EmptyState icon={FileText} title={t('projects.noEstimates')} />}
      </Card>
      <Card flush className="list-card" title={t('nav.invoices')}>
        {invoices.length ? (
          <Table
            caption={t('nav.invoices')}
            rows={invoices}
            columns={[
              { key: 'number', header: '#', render: (i) => <span className="row tnum"><Receipt size={16} className="subtle" aria-hidden="true" />{i.number}</span> },
              { key: 'issuedAt', header: t('contacts.issued'), hide: 'md', render: (i) => date(i.issuedAt) },
              { key: 'dueAt', header: t('contacts.due'), render: (i) => date(i.dueAt) },
              { key: 'status', header: t('list.status'), render: (i) => <Badge tone={INVOICE_TONE[i.status]} dot>{t(`invoiceStatus.${i.status}`)}</Badge> },
              { key: 'total', header: t('contacts.total'), align: 'right', hide: 'lg', render: (i) => money(i.total) },
              { key: 'balance', header: t('contacts.balance'), align: 'right', render: (i) => money(i.total - i.paid) },
              {
                key: 'pay', header: <span className="sr-only">{t('common.actions')}</span>,
                render: (i) => (i.status !== 'paid' && i.status !== 'draft' ? (
                  <Button size="sm" icon={CircleDollarSign} onClick={() => quick.open('payment', { invoice: i, onSaved: (saved) => setInvoices((list) => list.map((x) => (x.id === saved.id ? saved : x))) })}>{t('payment.short')}</Button>
                ) : null),
              },
            ]}
          />
        ) : <EmptyState icon={Receipt} title={t('contacts.noInvoices')} />}
      </Card>
    </div>
  );
}
