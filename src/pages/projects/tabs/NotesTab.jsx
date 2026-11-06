import { useState } from 'react';
import { StickyNote } from 'lucide-react';
import { Avatar, Button, Card, EmptyState, Textarea, useToast } from '../../../components/ui/index.js';
import { useT } from '../../../i18n/index.jsx';
import { date, time } from '../../../lib/format.js';
import { lookupService, projectsService } from '../../../services/index.js';

export default function NotesTab({ d, projectId }) {
  const t = useT();
  const toast = useToast();
  const [notes, setNotes] = useState(d.notes);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const add = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    const note = await projectsService.addNote(projectId, body.trim());
    setNotes((n) => [note, ...n]);
    setBody('');
    setSaving(false);
    toast.show(t('note.created'));
  };
  return (
    <div className="detail-grid">
      <Card flush title={t('projects.tabs.notes')}>
        {notes.length ? (
          <ul className="list">
            {notes.map((n) => {
              const u = lookupService.user(n.authorId);
              return (
                <li key={n.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                  <Avatar name={u?.name} size="sm" />
                  <div className="list-item__main">
                    <p className="list-item__meta">{u?.name} · {date(n.createdAt, 'MMM d, yyyy')} {time(n.createdAt)}</p>
                    <p className="prose" style={{ marginTop: 2 }}>{n.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <EmptyState icon={StickyNote} title={t('projects.noNotes')} />}
      </Card>
      <Card title={t('note.newTitle')}>
        <form className="stack-sm" onSubmit={add}>
          <label className="sr-only" htmlFor="project-note">{t('note.body')}</label>
          <Textarea id="project-note" value={body} onChange={(e) => setBody(e.target.value)} minRows={4} maxRows={12} placeholder={t('projects.notePlaceholder')}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) add(e); }} />
          <Button type="submit" variant="primary" size="sm" disabled={saving || !body.trim()}>{saving ? t('common.saving') : t('projects.addNote')}</Button>
        </form>
      </Card>
    </div>
  );
}
