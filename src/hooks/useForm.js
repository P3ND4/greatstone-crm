import { useCallback, useMemo, useRef, useState } from 'react';

/**
 * Minimal form state: values, inline errors, dirty tracking, submit with validation.
 * validate(values) => { field: 'message' } ; first invalid field gets focus.
 */
export default function useForm(initialValues, { validate, onSubmit } = {}) {
  const initial = useRef(initialValues);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(initial.current), [values]);

  const set = useCallback((name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e));
  }, []);

  /** Spread onto inputs: {...bind('email')} */
  const bind = useCallback((name) => ({
    name,
    value: values[name] ?? '',
    onChange: (e) => set(name, e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e),
  }), [values, set]);

  const submit = useCallback(async (event) => {
    event?.preventDefault?.();
    const found = validate ? Object.fromEntries(Object.entries(validate(values)).filter(([, v]) => v)) : {};
    setErrors(found);
    const form = event?.target?.closest?.('form') || event?.target;
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      form?.querySelector?.(`[name="${first}"]`)?.focus();
      return false;
    }
    setSaving(true);
    try {
      await onSubmit?.(values);
      initial.current = values;
      setSubmitted(true);
      return true;
    } finally {
      setSaving(false);
    }
  }, [values, validate, onSubmit]);

  const reset = useCallback(() => { setValues(initial.current); setErrors({}); }, []);

  return { values, errors, set, bind, submit, saving, dirty: dirty && !submitted, reset };
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
export const isPhone = (v) => String(v || '').replace(/\D/g, '').length >= 10;
