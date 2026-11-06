import { useState } from 'react';
import { Check, CheckSquare, Plus } from 'lucide-react';
import { useQuickActions } from '../../../components/quick/QuickActionsProvider.jsx';
import { Avatar, Button, Card, EmptyState, SegmentedControl } from '../../../components/ui/index.js';
import { useT } from '../../../i18n/index.jsx';
import { dayLabel } from '../../../lib/format.js';
import { lookupService, tasksService } from '../../../services/index.js';
import cx from '../../../lib/cx.js';

export default function TasksTab({ d, projectId, onChanged }) {
  const t = useT();
  const quick = useQuickActions();
  const [filter, setFilter] = useState('open');
  const [done, setDone] = useState({});
  const isDone = (task) => done[task.id] ?? task.done;
  const rows = d.tasks.filter((task) => (filter === 'all' ? true : filter === 'done' ? isDone(task) : !isDone(task)));
  const toggle = (task) => { const next = !isDone(task); setDone((s) => ({ ...s, [task.id]: next })); tasksService.update(task.id, { done: next }); };
  const today = new Date(new Date().toDateString());
  return (
    <Card
      flush
      title={t('projects.tabs.tasks')}
      actions={(
        <>
          <SegmentedControl label={t('common.filters')} value={filter} onChange={setFilter} options={['open', 'done', 'all'].map((f) => ({ value: f, label: t(`projects.taskFilter.${f}`) }))} />
          <Button size="sm" variant="primary" icon={Plus} onClick={() => quick.open('task', { projectId, onSaved: onChanged })}>{t('quick.task')}</Button>
        </>
      )}
    >
      {rows.length ? (
        <ul className="list">
          {rows.map((task) => {
            const late = !isDone(task) && new Date(task.dueAt) < today;
            const user = lookupService.user(task.assigneeId);
            return (
              <li key={task.id}>
                <button type="button" className={cx('list-item', isDone(task) && 'is-done')} onClick={() => toggle(task)} aria-pressed={isDone(task)}>
                  <span className={cx('check', isDone(task) && 'is-on')} aria-hidden="true">{isDone(task) && <Check />}</span>
                  <span className={`prio prio--${task.priority}`} title={t(`task.priorities.${task.priority}`)} aria-label={t(`task.priorities.${task.priority}`)} />
                  <div className="list-item__main">
                    <p className="list-item__title">{task.title}</p>
                    <p className="list-item__meta" style={late ? { color: 'var(--danger)' } : undefined}>{dayLabel(task.dueAt)}{late ? ` · ${t('projects.overdue')}` : ''}</p>
                  </div>
                  <Avatar name={user?.name} size="sm" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : <EmptyState icon={CheckSquare} title={t('projects.noTasks')} />}
    </Card>
  );
}
