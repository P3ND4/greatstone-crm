import { differenceInCalendarDays, eachWeekOfInterval, format, max as maxDate, min as minDate } from 'date-fns';
import { Card } from '../../../components/ui/index.js';
import { useT } from '../../../i18n/index.jsx';
import { date, percent } from '../../../lib/format.js';

/** Simple Gantt: one bar per phase (planned dates) with its completed share, plus a "today" line. */
export default function TimelineTab({ d }) {
  const t = useT();
  const phases = d.phases;
  if (!phases.length) return <Card><p className="muted">{t('projects.noPhases')}</p></Card>;
  const start = minDate(phases.map((p) => new Date(p.start)));
  const end = maxDate(phases.map((p) => new Date(p.end)));
  const total = Math.max(differenceInCalendarDays(end, start), 1);
  const pos = (d0) => (differenceInCalendarDays(new Date(d0), start) / total) * 100;
  const weeks = eachWeekOfInterval({ start, end });
  const step = Math.max(1, Math.ceil(weeks.length / 12));
  const todayPct = pos(new Date());

  return (
    <Card title={t('projects.tabs.timeline')} subtitle={`${date(start)} – ${date(end)}`}>
      <div className="gantt-scroll">
        <div className="gantt" role="table" aria-label={t('projects.tabs.timeline')}>
          <div className="gantt__head" role="row">
            <span role="columnheader" className="gantt__label">{t('projects.phase')}</span>
            <div className="gantt__scale" role="columnheader" aria-label={t('projects.weeks')}>
              {weeks.map((w, i) => (i % step === 0 && pos(w) >= 0 && pos(w) <= 92 ? <span key={w.toISOString()} style={{ left: `${pos(w)}%` }}>{format(w, 'MMM d')}</span> : null))}
            </div>
          </div>
          {phases.map((ph) => {
            const left = Math.max(pos(ph.start), 0);
            const width = Math.max(pos(ph.end) - left, 1.5);
            const state = ph.progress >= 1 ? 'done' : ph.progress > 0 ? 'active' : 'upcoming';
            return (
              <div key={ph.id} className="gantt__row" role="row">
                <span role="cell" className="gantt__label">
                  <strong>{t(`phases.${ph.key}`)}</strong>
                  <span className="subtle tnum">{date(ph.start, 'MMM d')} – {date(ph.end, 'MMM d')}</span>
                </span>
                <div role="cell" className="gantt__track">
                  {weeks.map((w, i) => (i % step === 0 && pos(w) > 0 ? <span key={i} className="gantt__grid" style={{ left: `${pos(w)}%` }} aria-hidden="true" /> : null))}
                  {todayPct >= 0 && todayPct <= 100 && <span className="gantt__today" style={{ left: `${todayPct}%` }} aria-hidden="true" />}
                  <span className={`gantt__bar is-${state}`} style={{ left: `${left}%`, width: `${width}%` }} title={`${t(`phases.${ph.key}`)} · ${percent(ph.progress)}`}>
                    <span className="gantt__fill" style={{ width: `${ph.progress * 100}%` }} />
                  </span>
                  <span className="sr-only">{t('projects.phaseProgress', { pct: percent(ph.progress) })}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="chart-legend" style={{ marginTop: 12 }}>
        <span><i style={{ background: 'var(--chart-1)' }} aria-hidden="true" />{t('projects.completed')}</span>
        <span><i style={{ background: 'var(--surface-3)', border: '1px solid var(--border-strong)' }} aria-hidden="true" />{t('projects.planned')}</span>
        <span><i style={{ background: 'var(--danger)', width: 2 }} aria-hidden="true" />{t('common.today')}</span>
      </div>
    </Card>
  );
}
