import { useCallback, useEffect, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { ModalShell } from '../../../components/shells/index.js';
import { Badge, Button, Card, EmptyState, IconButton, SegmentedControl } from '../../../components/ui/index.js';
import { useT } from '../../../i18n/index.jsx';
import { date } from '../../../lib/format.js';

const KINDS = ['all', 'before', 'progress', 'after'];

/** Placeholder photo tile (no real images in the demo) — colored by tone, labeled with room + kind. */
function Tile({ photo, large }) {
  return (
    <span className={`photo-tile${large ? ' photo-tile--large' : ''}`} style={{ '--h': photo.tone }} aria-hidden="true">
      <Camera />
    </span>
  );
}

export default function PhotosTab({ d }) {
  const t = useT();
  const [kind, setKind] = useState('all');
  const [index, setIndex] = useState(null);
  const photos = d.photos.filter((p) => kind === 'all' || p.kind === kind);
  const current = index != null ? photos[index] : null;
  const go = useCallback((dir) => setIndex((i) => (i + dir + photos.length) % photos.length), [photos.length]);

  useEffect(() => {
    if (index == null) return undefined;
    const onKey = (e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, go]);

  return (
    <Card
      title={t('projects.tabs.photos')}
      subtitle={t('projects.photosHint')}
      actions={<SegmentedControl label={t('list.type')} value={kind} onChange={(v) => { setKind(v); setIndex(null); }} options={KINDS.map((k) => ({ value: k, label: t(`photoKinds.${k}`) }))} />}
    >
      {photos.length ? (
        <ul className="photo-grid">
          {photos.map((p, i) => (
            <li key={p.id}>
              <button type="button" className="photo" onClick={() => setIndex(i)} aria-label={`${p.caption} · ${t(`photoKinds.${p.kind}`)}`}>
                <Tile photo={p} />
                <span className="photo__meta">
                  <Badge tone={p.kind === 'before' ? 'neutral' : p.kind === 'after' ? 'success' : 'info'}>{t(`photoKinds.${p.kind}`)}</Badge>
                  <span className="truncate">{p.caption}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : <EmptyState icon={Camera} title={t('projects.noPhotos')} />}

      <ModalShell open={current != null} onClose={() => setIndex(null)} size="lg">
        {({ titleId, requestClose }) => current && (
          <div className="form-shell">
            <header className="form-header">
              <div className="form-header__titles">
                <h2 className="form-title" id={titleId}>{current.caption}</h2>
                <p className="form-subtitle">{t(`photoKinds.${current.kind}`)} · {date(current.takenAt)} · {index + 1}/{photos.length}</p>
              </div>
              <Button size="sm" onClick={requestClose}>{t('common.close')}</Button>
            </header>
            <div className="form-body lightbox">
              <IconButton icon={ChevronLeft} label={t('agenda.prev')} onClick={() => go(-1)} className="lightbox__nav" />
              <Tile photo={current} large />
              <IconButton icon={ChevronRight} label={t('agenda.next')} onClick={() => go(1)} className="lightbox__nav" />
            </div>
          </div>
        )}
      </ModalShell>
    </Card>
  );
}
