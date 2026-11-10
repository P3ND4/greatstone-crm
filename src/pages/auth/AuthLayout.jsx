import { Languages } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';

/** Split screen for sign-in / password reset: brand panel + form. Stacks on phones. */
export default function AuthLayout({ children }) {
  const { t, locale, setLocale } = useI18n();
  return (
    <div className="auth">
      <aside className="auth__brand" aria-hidden="false">
        <div className="auth__brand-inner">
          <p className="wordmark auth__wordmark">Greatstone<span>.</span><small>CRM</small></p>
          <div className="auth__pitch">
            <p className="auth__eyebrow">{t('auth.eyebrow')}</p>
            <h2 className="auth__headline">{t('auth.headline')}</h2>
            <p className="auth__lede">{t('auth.lede')}</p>
          </div>
          <p className="auth__foot">{t('auth.footer', { year: new Date().getFullYear() })}</p>
        </div>
        <div className="auth__arches" aria-hidden="true"><span /><span /><span /></div>
      </aside>
      <main className="auth__main" id="main">
        <div className="auth__top">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setLocale(locale === 'en' ? 'es' : 'en')} lang={locale === 'en' ? 'es' : 'en'}>
            <Languages aria-hidden="true" />{locale === 'en' ? 'Español' : 'English'}
          </button>
        </div>
        <div className="auth__panel">{children}</div>
      </main>
    </div>
  );
}
