import { Link, useParams } from 'react-router-dom';
import { CalendarPlus, CheckSquare, MapPin, Pencil, StickyNote } from 'lucide-react';
import { PROJECT_TONE } from '../../components/crm/bits.jsx';
import { useQuickActions } from '../../components/quick/QuickActionsProvider.jsx';
import { PageShell } from '../../components/shells/index.js';
import { Badge, Button, DataState, Skeleton, Tabs } from '../../components/ui/index.js';
import useResource from '../../hooks/useResource.js';
import useUrlState from '../../hooks/useUrlState.js';
import { useT } from '../../i18n/index.jsx';
import { date } from '../../lib/format.js';
import { projectsService } from '../../services/index.js';
import { ProjectCover } from './ProjectsPage.jsx';
import BudgetTab from './tabs/BudgetTab.jsx';
import CommsTab from './tabs/CommsTab.jsx';
import DocumentsTab from './tabs/DocumentsTab.jsx';
import FinanceTab from './tabs/FinanceTab.jsx';
import NotesTab from './tabs/NotesTab.jsx';
import OverviewTab from './tabs/OverviewTab.jsx';
import PhotosTab from './tabs/PhotosTab.jsx';
import ScopeTab from './tabs/ScopeTab.jsx';
import SelectionsTab from './tabs/SelectionsTab.jsx';
import TasksTab from './tabs/TasksTab.jsx';
import TimelineTab from './tabs/TimelineTab.jsx';

const TABS = ['overview', 'scope', 'tasks', 'timeline', 'selections', 'budget', 'documents', 'photos', 'communications', 'finance', 'notes'];
const PANELS = {
  overview: OverviewTab, scope: ScopeTab, tasks: TasksTab, timeline: TimelineTab, selections: SelectionsTab, budget: BudgetTab,
  documents: DocumentsTab, photos: PhotosTab, communications: CommsTab, finance: FinanceTab, notes: NotesTab,
};

/** Project detail — PAGE with tabs (tab kept in the URL so Back returns to the same tab). */
export default function ProjectDetailPage() {
  const t = useT();
  const { id } = useParams();
  const quick = useQuickActions();
  const [tab, setTab] = useUrlState('tab', 'overview');
  const { data, loading, error, refetch } = useResource(() => projectsService.get(id), [id]);
  const p = data?.project;
  const Panel = PANELS[tab] || OverviewTab;
  const counts = data && {
    tasks: data.tasks.filter((x) => !x.done).length, selections: data.selections.length, documents: data.documents.length,
    photos: data.photos.length, communications: data.conversations.length, finance: data.invoices.length + data.estimates.length, notes: data.notes.length, scope: data.rooms.length,
  };

  return (
    <PageShell fallback="/projects" breadcrumbs={[{ label: t('nav.projects'), to: '/projects' }, { label: p?.name ?? '…' }]}>
      <DataState loading={loading && !data} error={error} onRetry={refetch} skeleton={<div className="stack"><Skeleton height={56} width="50%" /><Skeleton height={40} /><Skeleton height={320} /></div>}>
        {p && (
          <>
            <div className="detail-head">
              <div className="detail-head__main">
                <ProjectCover project={p} small />
                <div style={{ minWidth: 0 }}>
                  <h1 className="detail-head__title">{p.name}</h1>
                  <div className="detail-head__meta">
                    <Badge tone={PROJECT_TONE[p.status]} dot>{t(`projectStatus.${p.status}`)}</Badge>
                    {p.client && <Link to={`/crm/contacts/${p.client.id}`}>{p.client.name}</Link>}
                    <span><MapPin size={13} style={{ display: 'inline', verticalAlign: -2 }} aria-hidden="true" /> {p.address || p.neighborhood}</span>
                    <span className="tnum">· {date(p.startDate, 'MMM d')} – {date(p.endDate, 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
              <div className="page-head__actions">
                <Button icon={CheckSquare} onClick={() => quick.open('task', { projectId: p.id, onSaved: refetch })}>{t('quick.task')}</Button>
                <Button icon={CalendarPlus} onClick={() => quick.open('appointment', { projectId: p.id, contactId: p.clientId })}>{t('quick.appointment')}</Button>
                <Button icon={StickyNote} onClick={() => setTab('notes')}>{t('quick.note')}</Button>
                <Button variant="primary" icon={Pencil} to={`/projects/${p.id}/edit`}>{t('common.edit')}</Button>
              </div>
            </div>
            <Tabs label={p.name} value={tab} onChange={setTab} tabs={TABS.map((x) => ({ id: x, label: t(`projects.tabs.${x}`), count: counts?.[x] }))} />
            <div className="tab-panel" role="tabpanel" aria-label={t(`projects.tabs.${tab}`)}>
              <Panel key={tab} d={data} projectId={p.id} onChanged={refetch} />
            </div>
          </>
        )}
      </DataState>
    </PageShell>
  );
}
