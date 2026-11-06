import Skeleton from './Skeleton.jsx';
import cx from '../../lib/cx.js';

/** KPI tile. Never shows invented deltas/targets — `meta` is factual context only. */
export default function Kpi({ label, value, meta, metaTone, icon: Icon, loading }) {
  return (
    <div className="card kpi">
      <span className="kpi__label">{Icon && <Icon aria-hidden="true" />}{label}</span>
      {loading ? <Skeleton height={28} width="70%" /> : <span className="kpi__value">{value}</span>}
      {loading ? <Skeleton height={10} width="45%" /> : meta && <span className={cx('kpi__meta', metaTone === 'alert' && 'kpi__meta--alert')}>{meta}</span>}
    </div>
  );
}
