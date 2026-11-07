import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import { Eye, Lock, RotateCcw, Save } from 'lucide-react';
import { useSession } from '../../app/SessionProvider.jsx';
import { ConfirmDialog } from '../../components/shells/index.js';
import { Badge, Button, useToast } from '../../components/ui/index.js';
import useForm from '../../hooks/useForm.js';
import { useT } from '../../i18n/index.jsx';

/** Settings are editable only with "full" access to the Settings module. */
export function useSettingsAccess() {
  const { access } = useSession();
  return { readOnly: access('settings') !== 'full' };
}

export function SettingsHeader({ section, actions }) {
  const t = useT();
  const { readOnly } = useSettingsAccess();
  return (
    <div className="page-head">
      <div>
        <p className="page-head__eyebrow">{t('nav.settings')}</p>
        <h1 className="page-title">{t(`settings.nav.${section}`)}</h1>
        <p className="page-subtitle">{t(`settings.${section}.subtitle`)}</p>
        {readOnly && <div style={{ marginTop: 10 }}><Badge tone="info" icon={Eye}>{t('settings.readOnly')}</Badge></div>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </div>
  );
}

/** A titled block inside a settings page: description on the left (wide screens), controls on the right. */
export function SettingsSection({ title, description, children, aside }) {
  return (
    <section className="set-section">
      <div className="set-section__intro">
        <h2 className="set-section__title">{title}</h2>
        {description && <p className="set-section__desc">{description}</p>}
        {aside}
      </div>
      <div className="set-section__body card">{children}</div>
    </section>
  );
}

/** Sticky bar that appears while a settings form has unsaved changes. */
export function SaveBar({ dirty, saving, onDiscard }) {
  const t = useT();
  useEffect(() => {
    document.body.classList.toggle('has-savebar', dirty);
    return () => document.body.classList.remove('has-savebar');
  }, [dirty]);
  if (!dirty && !saving) return null;
  return (
    <div className="savebar" role="region" aria-label={t('settings.unsaved')}>
      <span className="grow savebar__text"><span className="savebar__dot" aria-hidden="true" />{t('settings.unsaved')}</span>
      <Button icon={RotateCcw} onClick={onDiscard} disabled={saving}>{t('settings.discard')}</Button>
      <Button variant="primary" type="submit" icon={Save} disabled={saving}>{saving ? t('common.saving') : t('settings.saveChanges')}</Button>
    </div>
  );
}

/**
 * Form frame used by every editable settings page: validation, sticky save bar,
 * read-only mode (fieldset disabled) and a guard before leaving with unsaved changes.
 */
export function SettingsForm({ initial, validate, onSave, children, savedKey = 'settings.saved' }) {
  const t = useT();
  const toast = useToast();
  const { readOnly } = useSettingsAccess();
  const tRef = useRef(t);
  tRef.current = t;
  const form = useForm(initial, {
    validate,
    onSubmit: async (v) => {
      await onSave(v);
      // Next tick so a language change made by this save is already applied to the toast.
      setTimeout(() => toast.show(tRef.current(savedKey)), 0);
    },
  });
  const blocker = useBlocker(({ currentLocation, nextLocation }) => form.dirty && !form.saving && currentLocation.pathname !== nextLocation.pathname);
  return (
    <form onSubmit={form.submit} noValidate className="set-form">
      <fieldset disabled={readOnly} className="set-fieldset">
        <legend className="sr-only">{t('nav.settings')}</legend>
        {children(form)}
      </fieldset>
      {readOnly && <p className="set-readonly"><Lock aria-hidden="true" />{t('settings.readOnlyBody')}</p>}
      <SaveBar dirty={form.dirty} saving={form.saving} onDiscard={form.reset} />
      <ConfirmDialog open={blocker.state === 'blocked'} onCancel={() => blocker.reset?.()} onConfirm={() => blocker.proceed?.()} />
    </form>
  );
}

/** Updates one key of a nested object value in a useForm instance. */
export const setIn = (form, key, sub, value) => form.set(key, { ...form.values[key], [sub]: value });
