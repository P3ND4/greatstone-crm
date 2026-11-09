import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, Info, Loader2, LogIn } from 'lucide-react';
import { useSession } from '../../app/SessionProvider.jsx';
import { Badge, Button, Field, Input } from '../../components/ui/index.js';
import useForm, { isEmail } from '../../hooks/useForm.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { authService, DEMO_PASSWORD } from '../../services/index.js';
import AuthLayout from './AuthLayout.jsx';

/** Only same-app paths are accepted as ?next= (no open redirects). */
export function safeNext(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/login') ? value : '/';
}

export default function LoginPage() {
  const t = useT();
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);
  const { data: demo } = useResource(() => authService.demoAccounts(), []);
  // The sign-out redirect already happened; later deep links should use ?next= again.
  useEffect(() => { if (session.signedOut) session.clearSignedOut(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const form = useForm({ email: location.state?.email || '', password: '', remember: true }, {
    validate: (v) => ({
      email: !v.email.trim() ? t('validation.required') : !isEmail(v.email) && t('validation.email'),
      password: !v.password && t('validation.required'),
    }),
    onSubmit: async (v) => {
      setError(null);
      try {
        await session.signIn(v);
        navigate(next, { replace: true });
      } catch (e) {
        setError(e.code === 'too_many_attempts' ? t('auth.errors.too_many_attempts', { s: e.retryIn }) : t(`auth.errors.${e.code || 'unknown'}`));
        form.set('password', '');
        requestAnimationFrame(() => document.querySelector('input[name="password"]')?.focus());
      }
    },
  });

  if (session.isAuthenticated) return <Navigate to={next} replace />;

  const fillDemo = (u) => { form.set('email', u.email); form.set('password', DEMO_PASSWORD); setError(null); };

  return (
    <AuthLayout>
      <div className="auth__card">
        <h1 className="auth__title">{t('auth.signInTitle')}</h1>
        <p className="auth__subtitle">{t('auth.signInSub')}</p>
        {location.state?.signedOut && !error && <p className="auth__notice" role="status"><Info aria-hidden="true" />{t('auth.signedOut')}</p>}
        {params.get('next') && !location.state?.signedOut && !error && <p className="auth__notice" role="status"><Info aria-hidden="true" />{t('auth.needSignIn')}</p>}
        {error && <p className="auth__error" role="alert"><AlertCircle aria-hidden="true" />{error}</p>}
        <form className="stack" onSubmit={form.submit} noValidate>
          <Field label={t('settings.fields.email')} error={form.errors.email} required>
            <Input {...form.bind('email')} type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} autoFocus />
          </Field>
          <div className="field">
            <div className="row-between">
              <label className="field__label" htmlFor="login-password">{t('auth.password')}<span className="req" aria-hidden="true">*</span></label>
              <Link className="auth__link" to="/forgot-password" state={{ email: form.values.email }}>{t('auth.forgot')}</Link>
            </div>
            <div className="pw-field">
              <input
                id="login-password"
                name="password"
                className="input"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.values.password}
                onChange={(e) => form.set('password', e.target.value)}
                aria-invalid={form.errors.password ? 'true' : undefined}
                aria-describedby={form.errors.password ? 'login-password-err' : undefined}
                aria-required="true"
              />
              <button type="button" className="pw-field__toggle" onClick={() => setShow((s) => !s)} aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')} aria-pressed={show}>
                {show ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </div>
            {form.errors.password && <p id="login-password-err" className="field__error" role="alert"><AlertCircle aria-hidden="true" />{form.errors.password}</p>}
          </div>
          <label className="auth__remember">
            <input type="checkbox" className="checkbox" checked={form.values.remember} onChange={(e) => form.set('remember', e.target.checked)} />
            <span>{t('auth.remember')}</span>
          </label>
          <Button type="submit" variant="primary" block icon={form.saving ? Loader2 : LogIn} className={form.saving ? 'is-running' : undefined} disabled={form.saving}>
            {form.saving ? t('auth.signingIn') : t('auth.signIn')}
          </Button>
        </form>

        {demo?.length > 0 && (
          <section className="auth__demo" aria-labelledby="demo-title">
            <h2 id="demo-title" className="auth__demo-title">{t('auth.demoTitle')}</h2>
            <p className="auth__demo-sub">{t('auth.demoSub', { password: DEMO_PASSWORD })}</p>
            <ul className="auth__demo-list">
              {demo.map((u) => (
                <li key={u.id}>
                  <button type="button" className="auth__demo-user" onClick={() => fillDemo(u)}>
                    <span className="grow" style={{ minWidth: 0 }}>
                      <span className="truncate" style={{ display: 'block', fontWeight: 500 }}>{u.name}</span>
                      <span className="truncate subtle" style={{ display: 'block', fontSize: 12 }}>{u.email}</span>
                    </span>
                    <Badge tone={u.role === 'admin' ? 'accent' : 'neutral'}>{t(`roles.${u.role}`)}</Badge>
                    <ArrowRight className="auth__demo-arrow" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AuthLayout>
  );
}
