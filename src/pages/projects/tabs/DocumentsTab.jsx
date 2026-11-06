import { useState } from 'react';
import { Eye, FileText, FolderOpen, Image as ImageIcon, Upload } from 'lucide-react';
import { ModalShell } from '../../../components/shells/index.js';
import { Badge, Button, Card, IconButton, Select, useToast } from '../../../components/ui/index.js';
import { useT } from '../../../i18n/index.jsx';
import { date } from '../../../lib/format.js';
import { lookupService, projectsService } from '../../../services/index.js';

const TYPES = ['plans', 'renders', 'contracts', 'permits'];
const STATUS_TONE = { approved: 'success', pending: 'warning', submitted: 'info', signed: 'success' };

/** Documents grouped by type. Upload is mocked (adds the file names); preview opens a quick modal. */
export default function DocumentsTab({ d, projectId }) {
  const t = useT();
  const toast = useToast();
  const [docs, setDocs] = useState(d.documents);
  const [type, setType] = useState('plans');
  const [preview, setPreview] = useState(null);

  const upload = async (files) => {
    if (!files.length) return;
    const added = await projectsService.addDocuments(projectId, [...files], type);
    setDocs((list) => [...added, ...list]);
    toast.show(t('projects.docsUploaded', { n: added.length }));
  };

  return (
    <div className="stack">
      <Card>
        <div className="row wrap-row" style={{ gap: 12 }}>
          <Upload size={18} className="subtle" aria-hidden="true" />
          <span className="grow muted">{t('projects.uploadHint')}</span>
          <Select className="select--sm" value={type} onChange={(e) => setType(e.target.value)} aria-label={t('list.type')} options={TYPES.map((x) => ({ value: x, label: t(`docTypes.${x}`) }))} />
          <label className="btn btn--primary btn--sm">
            <Upload aria-hidden="true" />{t('projects.upload')}
            <input type="file" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
          </label>
        </div>
      </Card>
      <div className="grid grid-2">
        {TYPES.map((tp) => {
          const list = docs.filter((x) => x.type === tp);
          return (
            <Card key={tp} title={t(`docTypes.${tp}`)} actions={<Badge>{list.length}</Badge>} flush>
              {list.length ? (
                <ul className="list">
                  {list.map((doc) => {
                    const Icon = /\.(jpe?g|png|webp)$/i.test(doc.name) ? ImageIcon : FileText;
                    return (
                      <li key={doc.id} className="list-item">
                        <Icon size={18} className="subtle" aria-hidden="true" />
                        <div className="list-item__main">
                          <p className="list-item__title">{doc.name}</p>
                          <p className="list-item__meta">{doc.size} · {date(doc.uploadedAt, 'MMM d, yyyy')} · {lookupService.user(doc.uploadedBy)?.name}</p>
                        </div>
                        {doc.status && <Badge tone={STATUS_TONE[doc.status]} dot>{t(`docStatus.${doc.status}`)}</Badge>}
                        <IconButton icon={Eye} size="sm" label={`${t('projects.preview')}: ${doc.name}`} onClick={() => setPreview(doc)} />
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="muted" style={{ padding: '8px 20px 16px' }}><FolderOpen size={14} style={{ display: 'inline', verticalAlign: -2 }} aria-hidden="true" /> {t('projects.noDocs')}</p>}
            </Card>
          );
        })}
      </div>
      <ModalShell open={Boolean(preview)} onClose={() => setPreview(null)} size="lg">
        {({ titleId, requestClose }) => preview && (
          <div className="form-shell">
            <header className="form-header">
              <div className="form-header__titles"><h2 className="form-title" id={titleId}>{preview.name}</h2><p className="form-subtitle">{t(`docTypes.${preview.type}`)} · {preview.size}</p></div>
              <Button size="sm" onClick={requestClose}>{t('common.close')}</Button>
            </header>
            <div className="form-body"><div className="doc-preview" aria-hidden="true"><FileText /><span>{t('projects.previewDemo')}</span></div></div>
          </div>
        )}
      </ModalShell>
    </div>
  );
}
