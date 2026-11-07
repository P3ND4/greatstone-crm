import { useT } from '../../i18n/index.jsx';
import { lineAmounts } from '../../lib/money.js';
import { date, money, number } from '../../lib/format.js';
import { financeService } from '../../services/index.js';
import TotalsBox from './TotalsBox.jsx';

/**
 * PDF-like document (letter proportions). Also the print area: "Download PDF" prints only this node.
 * doc: { kind, number, status, client, project, lines, totals, terms, notes, issuedAt|createdAt, dueAt|expiresAt, paid }
 */
export default function DocPreview({ doc }) {
  const t = useT();
  const s = financeService.settings();
  const rate = doc.taxRate ?? s.taxRate;
  const isInvoice = doc.kind === 'invoice';
  const issue = isInvoice ? doc.issuedAt : doc.createdAt;
  const until = isInvoice ? doc.dueAt : doc.expiresAt;
  return (
    <article className="paper print-area" aria-label={`${t(`finance.kind.${doc.kind}`)} ${doc.number}`}>
      {['paid', 'void', 'declined'].includes(doc.status) && <span className={`paper__stamp paper__stamp--${doc.status}`} aria-hidden="true">{t(`${isInvoice ? 'invoiceStatus' : 'estimateStatus'}.${doc.status}`)}</span>}
      <header className="paper__head">
        <div>
          {s.company.logo
            ? <img className="paper__logo" src={s.company.logo} alt={s.company.name} />
            : <p className="paper__brand">{String(s.company.name || 'Greatstone').split(' ')[0]}<span>.</span></p>}
          <p className="paper__muted">{s.company.tagline}</p>
          <p className="paper__muted">{s.company.city} · {s.company.phone}</p>
          <p className="paper__muted">{s.company.email}</p>
        </div>
        <div className="paper__title">
          <h2>{t(`finance.kind.${doc.kind}`)}</h2>
          <dl>
            <div><dt>#</dt><dd>{doc.number}</dd></div>
            <div><dt>{isInvoice ? t('finance.issued') : t('finance.date')}</dt><dd>{date(issue)}</dd></div>
            <div><dt>{isInvoice ? t('contacts.due') : t('finance.validUntil')}</dt><dd>{date(until)}</dd></div>
          </dl>
        </div>
      </header>

      <section className="paper__parties">
        <div>
          <p className="paper__label">{isInvoice ? t('finance.billTo') : t('finance.preparedFor')}</p>
          <p className="paper__strong">{doc.client?.name ?? '—'}</p>
          {doc.client?.address && <p className="paper__muted">{doc.client.address}</p>}
          {doc.client?.neighborhood && <p className="paper__muted">{doc.client.neighborhood}, Miami, FL</p>}
          {doc.client?.email && <p className="paper__muted">{doc.client.email}</p>}
        </div>
        {doc.project && (
          <div>
            <p className="paper__label">{t('finance.project')}</p>
            <p className="paper__strong">{doc.project.name}</p>
            <p className="paper__muted">{doc.project.address || doc.project.neighborhood}</p>
          </div>
        )}
      </section>

      <div className="paper__table-wrap">
        <table className="paper__table">
          <thead>
            <tr>
              <th scope="col">{t('finance.lines.description')}</th>
              <th scope="col" className="num">{t('finance.lines.qty')}</th>
              <th scope="col" className="num">{t('finance.lines.price')}</th>
              <th scope="col" className="num">{t('finance.lines.amount')}</th>
            </tr>
          </thead>
          <tbody>
            {doc.lines.length === 0 && <tr><td colSpan={4} className="paper__muted">{t('finance.noLines')}</td></tr>}
            {doc.lines.map((l) => {
              const a = lineAmounts(l, rate);
              return (
                <tr key={l.id}>
                  <td>
                    <span className="paper__desc">{l.description || '—'}{l.taxable ? <sup title={t('finance.taxable')}> *</sup> : null}</span>
                    {Number(l.discountPct) > 0 && <span className="paper__muted"> · {t('finance.lines.discountShort', { pct: l.discountPct })}</span>}
                  </td>
                  <td className="num">{number(Number(l.qty))} {l.unit}</td>
                  <td className="num">{money(Number(l.unitPrice))}</td>
                  <td className="num">{money(a.net / 100)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="paper__foot">
        <div className="paper__terms">
          {doc.lines.some((l) => l.taxable) && <p className="paper__muted">* {t('finance.taxableNote', { rate: `${Math.round(rate * 1000) / 10}%` })}</p>}
          {doc.terms && <><p className="paper__label">{t('finance.terms')}</p><p className="prose paper__small">{doc.terms}</p></>}
          {doc.notes && <p className="prose paper__small" style={{ marginTop: 8 }}>{doc.notes}</p>}
        </div>
        <TotalsBox totals={doc.totals} rate={rate} paid={isInvoice ? doc.paid : null} />
      </div>
    </article>
  );
}
