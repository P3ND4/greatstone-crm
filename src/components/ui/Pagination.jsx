import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useT } from '../../i18n/index.jsx';
import { IconButton } from './Button.jsx';

export default function Pagination({ page, pageSize, total, onChange }) {
  const t = useT();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, total);
  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="tnum">{t('common.rows', { from, to, total })}</span>
      <div className="row">
        <IconButton icon={ChevronLeft} size="sm" label={t('common.prev')} disabled={page <= 1} onClick={() => onChange(page - 1)} />
        <span className="tnum">{t('common.page', { n: page, total: pages })}</span>
        <IconButton icon={ChevronRight} size="sm" label={t('common.next')} disabled={page >= pages} onClick={() => onChange(page + 1)} />
      </div>
    </nav>
  );
}
