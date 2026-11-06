import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useT } from '../../i18n/index.jsx';
import { lineAmounts } from '../../lib/money.js';
import { money } from '../../lib/format.js';
import { financeService } from '../../services/index.js';
import Button, { IconButton } from '../ui/Button.jsx';
import Textarea from '../ui/Textarea.jsx';

let lineSeq = 0;
export const newLine = () => ({ id: `ln_new_${Date.now()}_${(lineSeq += 1)}`, catalogId: '', description: '', unit: 'ea', qty: 1, unitPrice: 0, discountPct: 0, taxable: false });

/**
 * Line-item editor. Desktop: aligned grid row per line. Small screens: each line becomes a stacked card
 * (same inputs, labels visible) — never horizontal scroll. errors: { [lineId]: { description, qty, unitPrice, discountPct } }
 */
export default function LineEditor({ lines, onChange, errors = {} }) {
  const t = useT();
  const taxRate = financeService.settings().taxRate;
  const catalog = financeService.catalog();
  const update = (id, patch) => onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const pick = (id, catalogId) => {
    const c = catalog.find((x) => x.id === catalogId);
    update(id, c ? { catalogId, description: c.name, unit: c.unit, unitPrice: c.price, taxable: c.taxable } : { catalogId: '' });
  };
  const move = (i, dir) => {
    const next = [...lines];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <div className="lines">
      <div className="lines__head" aria-hidden="true">
        <span>{t('finance.lines.item')}</span>
        <span className="num">{t('finance.lines.qty')}</span>
        <span className="num">{t('finance.lines.price')}</span>
        <span className="num">{t('finance.lines.discount')}</span>
        <span>{t('finance.lines.tax')}</span>
        <span className="num">{t('finance.lines.amount')}</span>
        <span />
      </div>
      <ol className="lines__list">
        {lines.map((l, i) => {
          const a = lineAmounts(l, taxRate);
          const e = errors[l.id] || {};
          const n = i + 1;
          return (
            <li key={l.id} className="line">
              <div className="line__item">
                <label className="line__label" htmlFor={`${l.id}-cat`}>{t('finance.lines.catalog', { n })}</label>
                <select id={`${l.id}-cat`} className="select select--sm" value={l.catalogId} onChange={(ev) => pick(l.id, ev.target.value)}>
                  <option value="">{t('finance.lines.custom')}</option>
                  <optgroup label={t('finance.lines.services')}>{catalog.filter((c) => c.kind === 'service').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>
                  <optgroup label={t('finance.lines.products')}>{catalog.filter((c) => c.kind === 'product').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>
                </select>
                <label className="sr-only" htmlFor={`${l.id}-desc`}>{t('finance.lines.description')} {n}</label>
                <Textarea id={`${l.id}-desc`} name={`line-${i}-description`} value={l.description} onChange={(ev) => update(l.id, { description: ev.target.value })} minRows={1} maxRows={5} placeholder={t('finance.lines.descriptionPh')} aria-invalid={e.description ? 'true' : undefined} />
                {e.description && <p className="field__error">{e.description}</p>}
              </div>
              <div className="line__num">
                <label className="line__label" htmlFor={`${l.id}-qty`}>{t('finance.lines.qty')}</label>
                <input id={`${l.id}-qty`} name={`line-${i}-qty`} className="input input--num" inputMode="decimal" value={l.qty} onChange={(ev) => update(l.id, { qty: ev.target.value })} aria-invalid={e.qty ? 'true' : undefined} />
                <span className="line__unit">{l.unit}</span>
                {e.qty && <p className="field__error">{e.qty}</p>}
              </div>
              <div className="line__num">
                <label className="line__label" htmlFor={`${l.id}-price`}>{t('finance.lines.price')}</label>
                <input id={`${l.id}-price`} name={`line-${i}-price`} className="input input--num" inputMode="decimal" value={l.unitPrice} onChange={(ev) => update(l.id, { unitPrice: ev.target.value })} aria-invalid={e.unitPrice ? 'true' : undefined} />
                {e.unitPrice && <p className="field__error">{e.unitPrice}</p>}
              </div>
              <div className="line__num">
                <label className="line__label" htmlFor={`${l.id}-disc`}>{t('finance.lines.discount')}</label>
                <input id={`${l.id}-disc`} className="input input--num" inputMode="decimal" value={l.discountPct} onChange={(ev) => update(l.id, { discountPct: ev.target.value })} aria-invalid={e.discountPct ? 'true' : undefined} />
                {e.discountPct && <p className="field__error">{e.discountPct}</p>}
              </div>
              <div className="line__tax">
                <label className="row" style={{ gap: 6, fontSize: 13 }}>
                  <input type="checkbox" className="checkbox" checked={l.taxable} onChange={(ev) => update(l.id, { taxable: ev.target.checked })} />
                  <span className="line__label line__label--inline">{t('finance.lines.tax')}</span>
                </label>
              </div>
              <div className="line__total num">
                <span className="line__label">{t('finance.lines.amount')}</span>
                <strong>{money(a.net / 100)}</strong>
                {a.tax > 0 && <span className="subtle" style={{ fontSize: 11 }}>+{money(a.tax / 100)} {t('finance.lines.taxShort')}</span>}
              </div>
              <div className="line__actions">
                <IconButton icon={ArrowUp} size="sm" label={t('finance.lines.up', { n })} disabled={i === 0} onClick={() => move(i, -1)} />
                <IconButton icon={ArrowDown} size="sm" label={t('finance.lines.down', { n })} disabled={i === lines.length - 1} onClick={() => move(i, 1)} />
                <IconButton icon={Trash2} size="sm" label={t('finance.lines.remove', { n })} onClick={() => onChange(lines.filter((x) => x.id !== l.id))} />
              </div>
            </li>
          );
        })}
      </ol>
      <Button icon={Plus} size="sm" onClick={() => onChange([...lines, newLine()])}>{t('finance.lines.add')}</Button>
    </div>
  );
}
