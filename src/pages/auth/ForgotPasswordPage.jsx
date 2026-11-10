import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, MailCheck, Send } from 'lucide-react';
import { Button, Field, Input } from '../../components/ui/index.js';
import useForm, { isEmail } from '../../hooks/useForm.js';
import { useT } from '../../i18n/index.jsx';
import { authService } from '../../services/index.js';
import AuthLayout from './AuthLayout.jsx';

/** Request a reset link. The answer is the same whether or not the email exists (no account enumeration). */
export default function ForgotPasswordPage() {
  const t = useT();
  const location = useLocation();
  const [sentTo, setSentTo] = useState(null);
  const form = useForm({ email: location.state?.email || '' }, {
    validate: (v) => ({ email: !v.email.trim() ? t('validation.required') : !isEmail(v.email) && t('validation.email') }),
    onSubmit: async (v) => { await authService.requestPasswordReset(v.email.trim()); setSentTo(v.email.trim()); },
  });
  return (
    <AuthLayout>
      <div className="auth__card">
        {sentTo ? (
          <div className="stack" role="status">
            <span className="auth__icon" aria-hidden="true"><MailCheck /></span>
            <h1 className="auth__title">{t('auth.resetSentTitle')}</h1>
            <p className="auth__subtitle">{t('auth.resetSentBody', { email: sentTo })}</p>
            <Button to="/login" state={{ email: sentTo }} variant="primary" block icon={ArrowLeft}>{t('auth.backToSignIn')}</Button>
          </div>
        ) : (
          <>
            <h1 className="auth__title">{t('auth.forgotTitle')}</h1>
            <p className="auth__subtitle">{t('auth.forgotSub')}</p>
            <form className="stack" onSubmit={form.submit} noValidate>
              <Field label={t('settings.fields.email')} error={form.errors.email} required>
                <Input {...form.bind('email')} type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} autoFocus />
              </Field>
              <Button type="submit" variant="primary" block icon={form.saving ? Loader2 : Send} className={form.saving ? 'is-running' : undefined} disabled={form.saving}>
                {form.saving ? t('auth.sending') : t('auth.sendLink')}
              </Button>
            </form>
            <p className="auth__back"><Link className="auth__link" to="/login" state={{ email: form.values.email }}><ArrowLeft aria-hidden="true" />{t('auth.backToSignIn')}</Link></p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
