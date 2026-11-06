import { useEffect, useState } from 'react';

/**
 * Resolves CSS custom properties to concrete values (SVG presentation attributes
 * used by chart libraries can't read var()). Re-reads when data-theme changes.
 */
export default function useCssVars(names) {
  const read = () => {
    const cs = getComputedStyle(document.documentElement);
    return Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(n).trim()]));
  };
  const [vars, setVars] = useState(read);
  useEffect(() => {
    const obs = new MutationObserver(() => setVars(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return vars;
}
