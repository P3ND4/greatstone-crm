import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Keeps a piece of UI state (filter, tab, page, sort) in the URL query string,
 * so "Back" restores exactly the same view. Default values are omitted from the URL.
 */
export default function useUrlState(key, defaultValue) {
  const [params, setParams] = useSearchParams();
  const raw = params.get(key);
  const value = raw == null ? defaultValue : typeof defaultValue === 'number' ? Number(raw) : raw;

  const setValue = useCallback((next) => {
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      if (next === defaultValue || next === '' || next == null) p.delete(key);
      else p.set(key, String(next));
      return p;
    }, { replace: true });
  }, [key, defaultValue, setParams]);

  return [value, setValue];
}
