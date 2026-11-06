import { Link } from 'react-router-dom';
import { CalendarDays, CircleDollarSign, Gauge, HandCoins, PiggyBank, TrendingUp, Wallet } from 'lucide-react';
import ProgressBar from '../../../components/crm/ProgressBar.jsx';
import { CONTACT_TYPE_TONE } from '../../../components/crm/bits.jsx';
import { Avatar, Badge, Card, EmptyState, Kpi } from '../../../components/ui/index.js';
import { useT } from '../../../i18n/index.jsx';
import { date, dayLabel, money, percent, time } from '../../../lib/format.js';
import { MarginValue } from '../ProjectsPage.jsx';
import BudgetBreakdown from './BudgetBreakdown.jsx';

export default function OverviewTab({ d }) {
  const t = useT();
  const p = d.project;
  const upcoming = d.appointments.filter((a) => new Date(a.start) >= new Date(new Date().toDateString())).slice(0, 4);
  return (
    <div className="stack">
      <div className="kpi-grid-6">
        <Kpi icon={HandCoins} label={t('projects.form.contract')} value={money(p.contractValue)} />
        <Kpi icon={Wallet} label={t('projects.form.budget')} value={money(p.budget)} />
        <Kpi icon={CircleDollarSign} label={t('projects.columns.spent')} value={money(p.spent)} meta={t('projects.ofBudget', { pct: percent(p.budgetUsed) })} metaTone={p.budgetUsed > 1 ? 'alert' : undefined} />
        <Kpi icon={PiggyBank} label={t('projects.remaining')} value={money(p.remaining)} metaTone={p.remaining < 0 ? 'alert' : undefined} meta={p.remaining < 0 ? t('projects.overBudget') : null} />
        <Kpi icon={Gauge} label={t('dashboard.health.progress')} value={percent(p.progress)} />
        <Kpi icon={TrendingUp} label={t('projects.columns.margin')} value={<MarginValue value={p.projectedMargin} />} meta={t('projects.marginHint')} />
      </div>
      <div className="detail-grid">
        <div className="stack">
          <Card title={t('projects.health')} subtitle={t('projects.healthSub')}>
            <div className="stack-sm">
              <div className="project-card__bar"><span>{t('dashboard.health.progress')}</span><ProgressBar value={p.progress} /></div>
              <div className="project-card__bar"><span>{t('dashboard.health.budgetUsed')}</span><ProgressBar value={p.budgetUsed} tone="budget" /></div>
              {p.atRisk && <p className="notice" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', marginTop: 8 }}>{t('projects.riskNotice')}</p>}
            </div>
          </Card>
          <Card title={t('projects.budgetByCategory')} subtitle={t('projects.budgetByCategorySub')}>
            <BudgetBreakdown lines={d.budgetLines} />
          </Card>
          {p.description && <Card title={t('leads.fields.description')}><p className="prose">{p.description}</p></Card>}
        </div>
        <div className="stack">
          <Card title={t('projects.columns.client')}>
            {p.client ? (
              <Link to={`/crm/contacts/${p.client.id}`} className="row" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Avatar name={p.client.name} />
                <span style={{ minWidth: 0 }}><strong style={{ display: 'block', fontWeight: 600 }}>{p.client.name}</strong><span className="muted truncate" style={{ display: 'block', fontSize: 12 }}>{p.client.email}</span></span>
              </Link>
            ) : '—'}
            <dl className="dl" style={{ marginTop: 16 }}>
              <div><dt>{t('projects.columns.manager')}</dt><dd>{p.manager?.name}</dd></div>
              <div><dt>{t('projects.columns.dates')}</dt><dd className="tnum">{date(p.startDate)} – {date(p.endDate)}</dd></div>
              <div><dt>{t('contacts.address')}</dt><dd>{p.address || p.neighborhood}</dd></div>
            </dl>
          </Card>
          <Card title={t('projects.partners')} flush>
            {d.partners.length ? (
              <ul className="list">
                {d.partners.map((c) => (
                  <li key={c.id}>
                    <Link className="list-item" to={`/crm/contacts/${c.id}`}>
                      <Avatar name={c.name} size="sm" dark />
                      <div className="list-item__main"><p className="list-item__title">{c.company || c.name}</p><p className="list-item__meta">{c.specialty || c.name}</p></div>
                      <Badge tone={CONTACT_TYPE_TONE[c.type]}>{t(`contactTypes.${c.type}`)}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <EmptyState compact title={t('projects.noPartners')} />}
          </Card>
          <Card title={t('contacts.upcoming')} flush>
            {upcoming.length ? (
              <ul className="list">
                {upcoming.map((a) => (
                  <li key={a.id}>
                    <Link className="list-item" to={`/crm/agenda/${a.id}`}>
                      <span className="date-chip" aria-hidden="true"><span className="date-chip__m">{date(a.start, 'MMM')}</span><span className="date-chip__d">{date(a.start, 'd')}</span></span>
                      <div className="list-item__main"><p className="list-item__title">{a.title}</p><p className="list-item__meta">{dayLabel(a.start)} · {time(a.start)}</p></div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <EmptyState compact icon={CalendarDays} title={t('dashboard.lists.noAppointments')} />}
          </Card>
        </div>
      </div>
    </div>
  );
}
