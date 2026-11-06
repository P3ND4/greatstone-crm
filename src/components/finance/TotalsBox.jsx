import { useT } from '../../i18n/index.jsx';
import { money } from '../../lib/format.js';
import { financeService } from '../../services/index.js';

/** Subtotal · discount · tax · total (· paid · balance). Exact cents, tabular figures. */
export default function TotalsBox({ totals, paid }) {
  const t = useT();
  const rate = financeService.settings().taxRate;
  return (
    <dl className="totals">
      <div><dt>{t('finance.subtotal')}</dt><dd>{money(totals.subtotal)}</dd></div>
      {totals.discount > 0 && <div><dt>{t('finance.discount')}</dt><dd>−{money(totals.discount)}</dd></div>}
      <div><dt>{t('finance.tax', { rate: `${Math.round(rate * 1000) / 10}%` })}</dt><dd>{money(totals.tax)}</dd></div>
      <div className="totals__grand"><dt>{t('contacts.total')}</dt><dd>{money(totals.total)}</dd></div>
      {paid != null && (
        <>
          {paid > 0 && <div><dt>{t('finance.paid')}</dt><dd>−{money(paid)}</dd></div>}
          <div className="totals__grand"><dt>{t('finance.balanceDue')}</dt><dd>{money(Math.round((totals.total - paid) * 100) / 100)}</dd></div>
        </>
      )}
    </dl>
  );
}
