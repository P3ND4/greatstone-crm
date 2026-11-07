import { Eye, Bell, CalendarPlus, CheckSquare, ChevronDown, FileText, LogOut, Menu as MenuIcon, Plus, Receipt, Search, SlidersHorizontal, StickyNote, User, UserPlus, Building2, Languages } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/index.jsx';
import { useQuickActions } from '../quick/QuickActionsProvider.jsx';
import Avatar from '../ui/Avatar.jsx';
import Button, { IconButton } from '../ui/Button.jsx';
import Menu from '../ui/Menu.jsx';
import { ModuleRow, SubmoduleRow } from './ModuleNav.jsx';
import { useSession } from '../../app/SessionProvider.jsx';
import { SETTINGS_META } from '../../services/index.js';

/**
 * Two-row topbar.
 * Row 1: menu (mobile) · modules (same as sidebar) · search · + New · notifications · user.
 * Row 2: submodules of the active module (only when it has submodules).
 * Both rows scroll horizontally on narrow screens instead of wrapping or overflowing.
 */
export default function Topbar({ onOpenNav, onOpenSearch, unread = [], counts }) {
  const { t, locale, setLocale } = useI18n();
  const quick = useQuickActions();
  const { user: me, role, realRole, setViewAs } = useSession();
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="topbar">
      <div className="topbar__row">
        <IconButton className="topbar__menu" icon={MenuIcon} label={t('nav.openMenu')} onClick={onOpenNav} />
        <ModuleRow />
        <div className="topbar__actions">
          <button type="button" className="search-trigger" onClick={onOpenSearch} aria-label={`${t('topbar.searchShort')} (${isMac ? '⌘' : 'Ctrl'}+K)`} title={`${t('topbar.searchShort')} (${isMac ? '⌘' : 'Ctrl'}+K)`}>
            <Search aria-hidden="true" />
            <span className="label">{t('topbar.searchShort')}</span>
            <kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd>
          </button>
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
                <button role="menuitem" type="button" className="menu__item" onClick={close}><LogOut />{t('topbar.signOut')}</button>
              </>
            )}
          </Menu>
        </div>
      </div>
      <SubmoduleRow counts={counts} />
    </header>
  );
}
