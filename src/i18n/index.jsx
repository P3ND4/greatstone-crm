import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import en from './en.js';
import es from './es.js';

const dictionaries = { en, es };
const I18nContext = createContext(null);

function lookup(dict, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict);
}

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

export function I18nProvider({ children, initialLocale = 'en' }) {
  const [locale, setLocale] = useState(initialLocale);

  const t = useCallback(
    (key, vars) => {
      const value = lookup(dictionaries[locale], key) ?? lookup(en, key);
      if (typeof value !== 'string') {
        if (import.meta.env.DEV && value === undefined) console.warn(`[i18n] missing key: ${key}`);
        return value === undefined ? key : value;
      }
      return interpolate(value, vars);
    },
    [locale],
  );

  const value = useMemo(() => ({ t, locale, setLocale }), [t, locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

export const useT = () => useI18n().t;
