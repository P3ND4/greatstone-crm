import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  addDays, addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday,
  parseISO, setHours, setMinutes, startOfDay, startOfMonth, startOfWeek, subDays, subMonths, subWeeks,
} from 'date-fns';
import { DndContext, PointerSensor, KeyboardSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Plus } from 'lucide-react';
import { FilterSelect } from '../../../components/list/ListToolbar.jsx';
import { useQuickActions } from '../../../components/quick/QuickActionsProvider.jsx';
import { Avatar, Button, Card, DataState, EmptyState, IconButton, SegmentedControl, Skeleton, useToast } from '../../../components/ui/index.js';
import useResource from '../../../hooks/useResource.js';
import useUrlState from '../../../hooks/useUrlState.js';
import { useT } from '../../../i18n/index.jsx';
import { time } from '../../../lib/format.js';
import { appointmentsService, lookupService } from '../../../services/index.js';
import cx from '../../../lib/cx.js';

export const APPT_TYPES = ['consultation', 'siteVisit', 'showroom', 'virtual', 'install'];
const VIEWS = ['month', 'week', 'day', 'list'];
const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i); // 8:00 – 19:00
const HOUR_PX = 52;
const fmtKey = (d) => format(d, 'yyyy-MM-dd');

function EventChip({ appt, compact, onOpen }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: appt.id, data: appt });
  return (
    <button
      ref={setNodeRef}
      type="button"
      className={cx('evt', `evt--${appt.type}`, compact && 'evt--compact', isDragging && 'is-dragging')}
      onClick={(e) => { e.stopPropagation(); onOpen(appt); }}
      title={`${time(appt.start)} · ${appt.title}`}
      {...listeners}
      {...attributes}
    >
      <span className="evt__time">{time(appt.start)}</span>
      <span className="evt__title">{appt.title}</span>
    </button>
  );
}

function DayCell({ day, month, items, onOpen, onCreate, onMore, t }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${fmtKey(day)}` });
  const shown = items.slice(0, 3);
  return (
    <div
      ref={setNodeRef}
      className={cx('cal-cell', !isSameMonth(day, month) && 'is-outside', isToday(day) && 'is-today', isOver && 'is-over')}
      onClick={() => onCreate(day)}
      role="gridcell"
      aria-label={format(day, 'EEEE, MMMM d')}
    >
      <span className="cal-cell__num">{format(day, 'd')}</span>
      <div className="cal-cell__events">
        {shown.map((a) => <EventChip key={a.id} appt={a} compact onOpen={onOpen} />)}
        {items.length > 3 && (
          <button type="button" className="cal-more" onClick={(e) => { e.stopPropagation(); onMore(day); }}>{t('agenda.more', { n: items.length - 3 })}</button>
        )}
      </div>
    </div>
  );
}

function HourSlot({ day, hour, onCreate }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot:${fmtKey(day)}:${hour}` });
  return <div ref={setNodeRef} className={cx('tg-slot', isOver && 'is-over')} onClick={() => onCreate(day, hour)} aria-hidden="true" />;
}

function TimeGrid({ days, items, onOpen, onCreate }) {
  return (
    <div className="tg" style={{ '--cols': days.length }}>
      <div className="tg-head">
        <span />
        {days.map((d) => (
          <div key={fmtKey(d)} className={cx('tg-head__day', isToday(d) && 'is-today')}>
            <span>{format(d, 'EEE')}</span><strong>{format(d, 'd')}</strong>
          </div>
        ))}
      </div>
      <div className="tg-body">
        <div className="tg-hours">{HOURS.map((h) => <span key={h} style={{ height: HOUR_PX }}>{format(setHours(new Date(), h), 'h a')}</span>)}</div>
        {days.map((d) => {
          const dayItems = items.filter((a) => isSameDay(parseISO(a.start), d));
          return (
            <div key={fmtKey(d)} className={cx('tg-col', isToday(d) && 'is-today')}>
              {HOURS.map((h) => <HourSlot key={h} day={d} hour={h} onCreate={onCreate} />)}
              {dayItems.map((a) => {
                const s = parseISO(a.start);
                const top = ((s.getHours() - HOURS[0]) + s.getMinutes() / 60) * HOUR_PX;
                const height = Math.max((a.durationMin / 60) * HOUR_PX - 2, 22);
                return (
                  <div key={a.id} className="tg-evt" style={{ top, height }}>
                    <EventChip appt={a} onOpen={onOpen} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AgendaPage() {
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const quick = useQuickActions();
  const [view, setView] = useUrlState('view', 'month');
  const [dateParam, setDateParam] = useUrlState('date', '');
  const [type, setType] = useUrlState('type', '');
  const [assignee, setAssignee] = useUrlState('assignee', '');
  const cursor = dateParam ? parseISO(dateParam) : startOfDay(new Date());
  const setCursor = (d) => setDateParam(isSameDay(d, new Date()) ? '' : fmtKey(d));

  const { data, loading, error, refetch } = useResource(() => appointmentsService.list({ pageSize: 1000 }), []);
  const [items, setItems] = useState([]);
  useEffect(() => { if (data) setItems(data.items); }, [data]);
  const filtered = useMemo(() => items.filter((a) => (!type || a.type === type) && (!assignee || a.assigneeId === assignee)), [items, type, assignee]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  const users = lookupService.users();

  const range = useMemo(() => {
    if (view === 'month') return { start: startOfWeek(startOfMonth(cursor)), end: endOfWeek(endOfMonth(cursor)) };
    if (view === 'week') return { start: startOfWeek(cursor), end: endOfWeek(cursor) };
    if (view === 'day') return { start: startOfDay(cursor), end: startOfDay(cursor) };
    return { start: startOfDay(cursor), end: addDays(cursor, 30) };
  }, [view, cursor]);
  const days = eachDayOfInterval(range);

  const title = view === 'month' ? format(cursor, 'MMMM yyyy')
    : view === 'week' ? `${format(range.start, 'MMM d')} – ${format(range.end, 'MMM d, yyyy')}`
      : view === 'day' ? format(cursor, 'EEEE, MMMM d, yyyy')
        : `${format(range.start, 'MMM d')} – ${format(range.end, 'MMM d, yyyy')}`;

  const step = (dir) => {
    const fn = {
      month: dir > 0 ? addMonths : subMonths, week: dir > 0 ? addWeeks : subWeeks, day: dir > 0 ? addDays : subDays, list: dir > 0 ? addWeeks : subWeeks,
    }[view];
    setCursor(fn(cursor, 1));
  };

  const openAppt = (a) => navigate(`/crm/agenda/${a.id}`);
  const create = (day, hour) => quick.open('appointment', { date: fmtKey(day), time: hour ? `${String(hour).padStart(2, '0')}:00` : undefined, onSaved: refetch });

  const onDragEnd = async ({ active, over }) => {
    if (!over) return;
    const appt = items.find((a) => a.id === active.id);
    const old = parseISO(appt.start);
    let next;
    if (over.id.startsWith('day:')) {
      const d = parseISO(over.id.slice(4));
      next = setMinutes(setHours(d, old.getHours()), old.getMinutes());
    } else {
      const [, dKey, hour] = over.id.split(':');
      next = setMinutes(setHours(parseISO(dKey), Number(hour)), 0);
    }
    if (next.getTime() === old.getTime()) return;
    setItems((list) => list.map((a) => (a.id === appt.id ? { ...a, start: next.toISOString() } : a)));
    await appointmentsService.update(appt.id, { start: next.toISOString() });
    toast.show(t('agenda.rescheduled', { title: appt.title, when: format(next, 'EEE MMM d, h:mm a') }));
  };

  const byDay = (d) => filtered.filter((a) => isSameDay(parseISO(a.start), d)).sort((a, b) => a.start.localeCompare(b.start));

  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-head__eyebrow">{t('nav.crm')}</p>
          <h1 className="page-title">{t('nav.agenda')}</h1>
          <p className="page-subtitle">{t('agenda.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <Button variant="primary" icon={Plus} onClick={() => create(cursor)}>{t('quick.appointment')}</Button>
        </div>
      </div>

      <Card flush className="list-card">
        <div className="toolbar cal-toolbar">
          <div className="row">
            <Button size="sm" onClick={() => setCursor(startOfDay(new Date()))}>{t('common.today')}</Button>
            <IconButton icon={ChevronLeft} size="sm" label={t('agenda.prev')} onClick={() => step(-1)} />
            <IconButton icon={ChevronRight} size="sm" label={t('agenda.next')} onClick={() => step(1)} />
            <h2 className="cal-title" aria-live="polite">{title}</h2>
          </div>
          <div className="toolbar__filters">
            <FilterSelect label={t('list.type')} value={type} onChange={setType} options={APPT_TYPES.map((x) => ({ value: x, label: t(`appointmentTypes.${x}`) }))} />
            <FilterSelect label={t('list.assignee')} value={assignee} onChange={setAssignee} options={users.map((u) => ({ value: u.id, label: u.name }))} />
          </div>
          <div className="toolbar__end">
            <SegmentedControl label={t('list.view')} value={view} onChange={setView} options={VIEWS.map((v) => ({ value: v, label: t(`agenda.views.${v}`) }))} />
          </div>
        </div>
        <div className="cal-legend" aria-label={t('list.type')}>
          {APPT_TYPES.map((x) => <span key={x}><i className={`evt-dot evt--${x}`} aria-hidden="true" />{t(`appointmentTypes.${x}`)}</span>)}
        </div>

        <DataState loading={loading && !data} error={error} onRetry={refetch} skeleton={<div style={{ padding: 16 }}><Skeleton height={520} /></div>}>
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            {view === 'month' && (
              <div className="cal-month" role="grid" aria-label={title}>
                {days.slice(0, 7).map((d) => <div key={`h-${d}`} className="cal-dow" role="columnheader">{format(d, 'EEE')}</div>)}
                {days.map((d) => (
                  <DayCell key={fmtKey(d)} day={d} month={cursor} items={byDay(d)} onOpen={openAppt} onCreate={(day) => create(day)} onMore={(day) => { setCursor(day); setView('day'); }} t={t} />
                ))}
              </div>
            )}
            {(view === 'week' || view === 'day') && <TimeGrid days={days} items={filtered} onOpen={openAppt} onCreate={create} />}
          </DndContext>
          {view === 'list' && (
            <div className="cal-list">
              {days.filter((d) => byDay(d).length).length === 0 && <EmptyState icon={CalendarDays} title={t('dashboard.lists.noAppointments')} />}
              {days.map((d) => {
                const list = byDay(d);
                if (!list.length) return null;
                return (
                  <section key={fmtKey(d)} className="cal-list__day">
                    <h3 className={cx('cal-list__date', isToday(d) && 'is-today')}>{format(d, 'EEEE, MMMM d')}</h3>
                    <ul className="list">
                      {list.map((a) => {
                        const contact = lookupService.contact(a.contactId);
                        const user = lookupService.user(a.assigneeId);
                        return (
                          <li key={a.id}>
                            <Link className="list-item" to={`/crm/agenda/${a.id}`}>
                              <span className={`evt-bar evt--${a.type}`} aria-hidden="true" />
                              <span className="tnum muted" style={{ width: 72, flex: 'none' }}>{time(a.start)}</span>
                              <div className="list-item__main">
                                <p className="list-item__title">{a.title}</p>
                                <p className="list-item__meta"><MapPin size={12} style={{ display: 'inline', verticalAlign: -2 }} aria-hidden="true" /> {a.location} · {contact?.name} · {t(`appointmentTypes.${a.type}`)}</p>
                              </div>
                              <Avatar name={user?.name} size="sm" />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </DataState>
      </Card>
    </>
  );
}
