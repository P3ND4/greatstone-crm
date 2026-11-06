import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * All list UI state in the URL (q, page, sort, view + named filters) so Back restores the exact view.
 * const list = useListState({ sort: 'createdAt:desc', view: 'table', filters: ['status', 'source'] })
 */
export default function useListState({ sort = '', view = 'table', pageSize = 15, filters = [] } = {}) {
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => ({
    q: params.get('q') || '',
    page: Number(params.get('page') || 1),
    sort: params.get('sort') || sort,
    view: params.get('view') || view,
    pageSize,
    filters: Object.fromEntries(filters.map((f) => [f, params.get(f) || ''])),
  }), [params, sort, view, pageSize, filters.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = useCallback((changes, { resetPage = true } = {}) => {
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      Object.entries(changes).forEach(([k, v]) => {
        const isDefault = (k === 'sort' && v === sort) || (k === 'view' && v === view) || (k === 'page' && Number(v) === 1);
        if (v === '' || v == null || isDefault) p.delete(k); else p.set(k, String(v));
      });
      if (resetPage && !('page' in changes)) p.delete('page');
      return p;
    }, { replace: true });
  }, [setParams, sort, view]);

  const activeFilters = Object.values(state.filters).filter(Boolean).length + (state.q ? 1 : 0);
  const clear = useCallback(() => patch({ q: '', ...Object.fromEntries(filters.map((f) => [f, ''])) }), [patch, filters.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    activeFilters,
    setQ: (q) => patch({ q }),
    setPage: (page) => patch({ page }, { resetPage: false }),
    setSort: (s) => patch({ sort: s }),
    setView: (v) => patch({ view: v }, { resetPage: false }),
    setFilter: (k, v) => patch({ [k]: v }),
    clear,
  };
}
