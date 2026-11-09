import { PanelLeftOpen, Download, WifiOff, Eye, Bell, CalendarPlus, CheckSquare, ChevronDown, FileText, LogOut, Menu as MenuIcon, Plus, Receipt, Search, SlidersHorizontal, StickyNote, User, UserPlus, Building2, Languages } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useI18n } from '../../i18n/index.jsx';
import { useQuickActions } from '../quick/QuickActionsProvider.jsx';
import Avatar from '../ui/Avatar.jsx';
import Button, { IconButton } from '../ui/Button.jsx';
import Menu from '../ui/Menu.jsx';
import { ModuleRow, SubmoduleRow, useActiveModule } from './ModuleNav.jsx';
import { useSession } from '../../app/SessionProvider.jsx';
import { SETTINGS_META } from '../../services/index.js';
import { usePwa } from '../../app/pwa.js';

/**
 * Topbar. Never repeats what the sidebar already shows:
 * - Desktop, sidebar open: wide search · + New · notifications · user (single row).
 * - Desktop, sidebar hidden: expand · "G." · module icons (animated in) · search · actions,
 *   plus row 2 with the submodules of the active module.
 * - Phone / tablet: menu · current module name · actions; row 2 = submodules as text tabs (no icons).
 */
export default function Topbar({ onOpenNav, onToggleCollapse, onOpenSearch, unread = [], counts }) {
  const active = useActiveModule();
  const { t, locale, setLocale } = useI18n();
  const quick = useQuickActions();
  const { user: me, role, realRole, setViewAs, signOut } = useSession();
  const pwa = usePwa();
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="topbar">
      <div className="topbar__row">
        <IconButton className="topbar__menu" icon={MenuIcon} label={t('nav.openMenu')} onClick={onOpenNav} />
        <IconButton className="topbar__expand" icon={PanelLeftOpen} label={t('nav.expand')} title={`${t('nav.expand')} (Ctrl/⌘ + B)`} aria-expanded="false" onClick={onToggleCollapse} />
        <NavLink to="/" end className="topbar__brand" aria-label="Greatstone CRM — Dashboard" tabIndex={-1}>G<span>.</span></NavLink>
        <p className="topbar__title" aria-hidden="true">{active ? t(active.labelKey) : ''}</p>
        <ModuleRow />
        <button type="button" className="search-trigger" onClick={onOpenSearch} aria-label={`${t('topbar.searchShort')} (${isMac ? '⌘' : 'Ctrl'}+K)`} title={`${t('topbar.searchShort')} (${isMac ? '⌘' : 'Ctrl'}+K)`}>
          <Search aria-hidden="true" />
          <span className="label">{t('topbar.searchShort')}</span>
          <kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>
        <div className="topbar__actions">
          {!pwa.online && <span className="offline-pill" role="status" title={t('pwa.offlineHint')}><WifiOff aria-hidden="true" /><span className="hide-mobile">{t('pwa.offline')}</span><span className="sr-only">{t('pwa.offlineHint')}</span></span>}
          <Menu
            label={t('topbar.new')}
            trigger={(p) => <Button variant="primary" className="topbar__new" icon={Plus} aria-label={t('topbar.new')} {...p}><span className="btn-label">{t('topbar.new')}</span></Button>}
          >
            {(close) => (
              <>
                <div className="menu__label">{t('common.create')}</div>
                <button role="menuitem" type="button" className="menu__item" onClick={() => { close(); quick.open('task'); }}><CheckSquare />{t('quick.task')}</button>
                <button role="menuitem" type="button" className="menu__item" onClick={() => { close(); quick.open('appointment'); }}><CalendarPlus />{t('quick.appointment')}</button>
                <button role="menuitem" type="button" className="menu__item" onClick={() => { close(); quick.open('note'); }}><StickyNote />{t('quick.note')}</button>
                <button role="menuitem" type="button" className="menu__item" onClick={() => { close(); quick.open('contact'); }}><User />{t('quick.contact')}</button>
                <div className="menu__sep" />
                <Link role="menuitem" className="menu__item" to="/crm/leads/new" onClick={close}><UserPlus />{t('quick.lead')}</Link>
                <Link role="menuitem" className="menu__item" to="/projects/new" onClick={close}><Building2 />{t('quick.project')}</Link>
                <Link role="menuitem" className="menu__item" to="/finance/estimates/new" onClick={close}><FileText />{t('quick.estimate')}</Link>
                <Link role="menuitem" className="menu__item" to="/finance/invoices/new" onClick={close}><Receipt />{t('quick.invoice')}</Link>
              </>
            )}
          </Menu>
          <Menu
            label={t('topbar.notifications')}
            trigger={(p) => <IconButton icon={Bell} label={t('topbar.notifications')} dot={unread.length > 0} {...p} />}
          >
            {(close) => (
              <>
                <div className="menu__label">{t('topbar.notifications')}</div>
                {unread.length === 0 && <p className="menu__item muted">{t('topbar.noNotifications')}</p>}
                {unread.slice(0, 5).map((n) => (
                  <Link key={n.id} role="menuitem" className="menu__item" to={`/crm/communications/${n.channel}?c=${n.id}`} onClick={close}>
                    <Avatar name={n.contactName} size="sm" title="" />
                    <span className="grow" style={{ minWidth: 0 }}>
                      <span className="truncate" style={{ display: 'block', fontWeight: 500 }}>{n.contactName}</span>
                      <span className="truncate muted" style={{ display: 'block', fontSize: 12 }}>{n.lastMessage}</span>
                    </span>
                  </Link>
                ))}
              </>
            )}
          </Menu>
          <Menu
            label={t('topbar.userMenu')}
            trigger={(p) => (
              <button type="button" className="user-btn" aria-label={t('topbar.userMenu')} {...p}>
                <Avatar name={me?.name} dark title="" />
                <ChevronDown size={14} className="hide-mobile" aria-hidden="true" />
              </button>
            )}
          >
            {(close) => (
              <>
                <div className="menu__label">{me?.name} · {me?.title}</div>
                <Link role="menuitem" className="menu__item" to="/settings/profile" onClick={close}><User />{t('topbar.profile')}</Link>
                <Link role="menuitem" className="menu__item" to="/settings/organization" onClick={close}><SlidersHorizontal />{t('topbar.preferences')}</Link>
                {!pwa.installed && (pwa.canInstall
                  ? <button role="menuitem" type="button" className="menu__item" onClick={() => { close(); pwa.install(); }}><Download />{t('pwa.install')}</button>
                  : <Link role="menuitem" className="menu__item" to="/settings/profile#device" onClick={close}><Download />{t('pwa.install')}</Link>)}
                <button role="menuitem" type="button" className="menu__item" onClick={() => { setLocale(locale === 'en' ? 'es' : 'en'); close(); }}>
                  <Languages />{locale === 'en' ? 'Español' : 'English'}
                </button>
                <div className="menu__sep" />
                <div className="menu__label">{t('settings.viewAs.menu')}</div>
                {SETTINGS_META.roles.map((r) => (
                  <button key={r} role="menuitemradio" aria-checked={role === r} type="button" className="menu__item" onClick={() => { setViewAs(r); close(); }}>
                    <Eye aria-hidden="true" style={{ opacity: role === r ? 1 : 0 }} />
                    {t(`roles.${r}`)}{r === realRole && <span className="subtle" style={{ marginLeft: 'auto', fontSize: 12 }}>{t('settings.viewAs.you')}</span>}
                  </button>
                ))}
                <div className="menu__sep" />
                <button role="menuitem" type="button" className="menu__item" onClick={() => { close(); signOut(); }}><LogOut />{t('topbar.signOut')}</button>
              </>
            )}
          </Menu>
        </div>
      </div>
      <SubmoduleRow counts={counts} />
    </header>
  );
}
