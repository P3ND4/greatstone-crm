import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Archive, ArrowLeft, Expand, File, Inbox, Mail, MailOpen, Paperclip, PenSquare, Reply, Send, Star, Tag, Trash2,
} from 'lucide-react';
import { Attachment } from '../../../components/comms/Bubbles.jsx';
import ChannelHeader from '../../../components/comms/ChannelHeader.jsx';
import { LABEL_COLORS, shortTime } from '../../../components/comms/util.js';
import { SearchInput } from '../../../components/list/ListToolbar.jsx';
import { Avatar, Badge, Button, DataState, EmptyState, IconButton, Menu, SkeletonList, Textarea, useToast } from '../../../components/ui/index.js';
import useResource from '../../../hooks/useResource.js';
import { useT } from '../../../i18n/index.jsx';
import { date, time } from '../../../lib/format.js';
import { communicationsService, lookupService } from '../../../services/index.js';
import { signature } from '../../../services/communicationsService.js';
import cx from '../../../lib/cx.js';

const FOLDERS = [['inbox', Inbox], ['starred', Star], ['sent', Send], ['drafts', File], ['archive', Archive], ['trash', Trash2]];
const LABELS = ['Clients', 'Vendors', 'Permits', 'Billing'];

/** Stacked email messages; older ones collapse to one line (click to expand). */
export function EmailThread({ id, expanded, onChanged }) {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useResource(() => communicationsService.thread(id), [id]);
  const [open, setOpen] = useState({});
  const [reply, setReply] = useState('');
  const [msgs, setMsgs] = useState([]);
  useEffect(() => {
    if (data) {
      setMsgs(data.messages);
      if (data.conversation.unread) communicationsService.markRead(id).then(() => onChanged?.());
    }
  }, [data, id]); // eslint-disable-line react-hooks/exhaustive-deps
  const conv = data?.conversation;

  const act = async (patch, message) => { await communicationsService.update([id], patch); toast.show(message); onChanged?.(); };
  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    const msg = await communicationsService.send(id, { body: reply.trim() + signature() });
    setMsgs((m) => [...m, msg]);
    setReply('');
    toast.show(t('comms.replySent'));
    onChanged?.();
  };

  return (
    <DataState loading={loading && !data} error={error} onRetry={refetch} skeleton={<div className="mail-read"><SkeletonList rows={4} /></div>}>
      {conv && (
        <section className="mail-read" aria-label={conv.subject}>
          <header className="mail-read__head">
            {!expanded && <Link to="/crm/communications/email" className="icon-btn show-mobile-inline" aria-label={t('common.back')}><ArrowLeft /></Link>}
            <div style={{ minWidth: 0, flex: 1 }}>
              <h2 className="mail-read__subject">{conv.subject}</h2>
              <div className="row wrap-row" style={{ marginTop: 6 }}>
                {conv.labels.map((l) => <Badge key={l}><i className="label-dot" style={{ background: LABEL_COLORS[l] }} aria-hidden="true" />{l}</Badge>)}
                {conv.contact && <Link to={`/crm/contacts/${conv.contact.id}`} className="badge badge--accent">{conv.contact.name}</Link>}
                {conv.project && <Link to={`/projects/${conv.project.id}`} className="badge">{conv.project.name}</Link>}
              </div>
            </div>
            <div className="row">
              <IconButton icon={Archive} label={t('comms.archive')} onClick={() => act({ folder: 'archive' }, t('comms.archived'))} />
              <IconButton icon={Trash2} label={t('common.delete')} onClick={() => act({ folder: 'trash' }, t('comms.trashed'))} />
              {!expanded && <IconButton icon={Expand} label={t('comms.expand')} onClick={() => navigate(`/crm/communications/email/${id}`)} className="hide-mobile" />}
            </div>
          </header>
          <ol className="mail-stack">
            {msgs.map((m, i) => {
              const last = i === msgs.length - 1;
              const isOpen = open[m.id] ?? last;
              const sender = m.direction === 'in' ? conv.contact?.name ?? t('comms.unknownContact') : lookupService.user(m.authorId)?.name ?? t('comms.you');
              return (
                <li key={m.id} className={cx('mail-msg', !isOpen && 'is-collapsed')}>
                  <button type="button" className="mail-msg__head" onClick={() => setOpen((o) => ({ ...o, [m.id]: !isOpen }))} aria-expanded={isOpen}>
                    <Avatar name={sender} size="sm" dark={m.direction === 'out'} />
                    <span className="mail-msg__from">{sender}</span>
                    {!isOpen && <span className="mail-msg__snip truncate">{m.body.replace(/\n+/g, ' ')}</span>}
                    {m.attachments.length > 0 && <Paperclip size={14} className="subtle" aria-hidden="true" />}
                    <span className="mail-msg__time">{date(m.sentAt, 'MMM d')} · {time(m.sentAt)}</span>
                  </button>
                  {isOpen && (
                    <div className="mail-msg__body">
                      <p className="prose">{m.body}</p>
                      {m.attachments.length > 0 && <div className="row wrap-row" style={{ marginTop: 12 }}>{m.attachments.map((a) => <Attachment key={a.name} file={a} />)}</div>}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          <form className="mail-reply" onSubmit={sendReply}>
            <label className="field__label" htmlFor={`reply-${id}`}><Reply size={14} style={{ display: 'inline', verticalAlign: -2 }} aria-hidden="true" /> {t('comms.quickReply')}</label>
            <Textarea id={`reply-${id}`} value={reply} onChange={(e) => setReply(e.target.value)} minRows={2} maxRows={8} placeholder={t('comms.replyPlaceholder', { name: conv.contact?.firstName ?? '' })}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendReply(e); }} />
            <div className="row-between">
              <Link to={`/crm/communications/email/compose?reply=${id}`} className="caps">{t('comms.openComposer')}</Link>
              <Button type="submit" variant="primary" size="sm" icon={Send}>{t('comms.send')}</Button>
            </div>
          </form>
        </section>
      )}
    </DataState>
  );
}

export default function EmailPage() {
  const t = useT();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const folder = params.get('folder') || (params.get('label') ? '' : 'inbox');
  const label = params.get('label') || '';
  const q = params.get('q') || '';
  const active = params.get('c');
  const [selected, setSelected] = useState([]);
  const setMany = (changes) => setParams((p) => {
    const n = new URLSearchParams(p);
    Object.entries(changes).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    return n;
  }, { replace: true });

  const { data, loading, error, refetch } = useResource(() => communicationsService.list({ channel: 'email', folder: folder || undefined, label: label || undefined, q }), [folder, label, q]);
  const { data: counts, refetch: refetchCounts } = useResource(() => Promise.all([communicationsService.counts('email'), communicationsService.counts('whatsapp')]), []);
  useEffect(() => { setSelected([]); }, [folder, label, q]);
  const items = data?.items || [];
  const allSelected = items.length > 0 && selected.length === items.length;

  const href = (id) => { const n = new URLSearchParams(params); n.set('c', id); return `?${n.toString()}`; };
  const bulk = async (patch, message) => {
    await communicationsService.update(selected, patch);
    toast.show(t(message, { n: selected.length }));
    setSelected([]);
    refetch(); refetchCounts();
  };
  const toggleStar = async (c, e) => { e.preventDefault(); e.stopPropagation(); await communicationsService.update([c.id], { starred: !c.starred }); refetch(); };
  const refreshAll = () => { refetch(); refetchCounts(); };
  const heading = useMemo(() => (label || t(`comms.folders.${folder}`)), [label, folder, t]);

  return (
    <>
      <ChannelHeader
        unread={{ email: counts?.[0].unread, whatsapp: counts?.[1].unread }}
        actions={<Button variant="primary" icon={PenSquare} to="/crm/communications/email/compose">{t('comms.compose')}</Button>}
      />
      <div className={cx('mail', active && 'has-active')}>
        <nav className="mail-nav" aria-label={t('comms.folders.title')}>
          <ul>
            {FOLDERS.map(([f, Icon]) => {
              const n = f === 'starred' ? counts?.[0].starred : counts?.[0].folders[f];
              return (
                <li key={f}>
                  <button type="button" className={cx('mail-nav__item', folder === f && !label && 'is-active')} onClick={() => setMany({ folder: f === 'inbox' ? '' : f, label: '', c: '' })} aria-current={folder === f && !label ? 'page' : undefined}>
                    <Icon aria-hidden="true" /><span>{t(`comms.folders.${f}`)}</span>{n > 0 && <span className="mail-nav__count">{n}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mail-nav__label">{t('comms.labels')}</p>
          <ul>
            {LABELS.map((l) => (
              <li key={l}>
                <button type="button" className={cx('mail-nav__item', label === l && 'is-active')} onClick={() => setMany({ label: l, folder: '', c: '' })}>
                  <i className="label-dot" style={{ background: LABEL_COLORS[l] }} aria-hidden="true" /><span>{l}</span>
                  {counts?.[0].labels[l] > 0 && <span className="mail-nav__count">{counts[0].labels[l]}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section className="mail-list" aria-label={heading}>
          <div className="mail-list__top">
            <input
              type="checkbox"
              className="checkbox"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = selected.length > 0 && !allSelected; }}
              onChange={() => setSelected(allSelected ? [] : items.map((c) => c.id))}
              aria-label={t('comms.selectAll')}
            />
            {selected.length > 0 ? (
              <div className="row" role="toolbar" aria-label={t('comms.bulkActions')}>
                <span className="muted" style={{ fontSize: 13, marginRight: 4 }}>{t('comms.selected', { n: selected.length })}</span>
                <IconButton size="sm" icon={Archive} label={t('comms.archive')} onClick={() => bulk({ folder: 'archive' }, 'comms.bulkArchived')} />
                <IconButton size="sm" icon={MailOpen} label={t('comms.markRead')} onClick={() => bulk({ unread: 0 }, 'comms.bulkRead')} />
                <IconButton size="sm" icon={Mail} label={t('comms.markUnread')} onClick={() => bulk({ unread: 1 }, 'comms.bulkUnread')} />
                <IconButton size="sm" icon={Star} label={t('comms.star')} onClick={() => bulk({ starred: true }, 'comms.bulkStarred')} />
                <Menu label={t('comms.applyLabel')} trigger={(p) => <IconButton size="sm" icon={Tag} label={t('comms.applyLabel')} {...p} />}>
                  {(close) => LABELS.map((l) => (
                    <button key={l} role="menuitem" type="button" className="menu__item" onClick={() => { close(); bulk((c) => ({ labels: c.labels.includes(l) ? c.labels : [...c.labels, l] }), 'comms.bulkLabeled'); }}>
                      <i className="label-dot" style={{ background: LABEL_COLORS[l] }} aria-hidden="true" />{l}
                    </button>
                  ))}
                </Menu>
                <IconButton size="sm" icon={Trash2} label={t('common.delete')} onClick={() => bulk({ folder: 'trash' }, 'comms.bulkTrashed')} />
              </div>
            ) : (
              <SearchInput value={q} onChange={(v) => setMany({ q: v })} placeholder={t('comms.searchMail')} />
            )}
          </div>
          <DataState loading={loading && !data} error={error} onRetry={refetch} skeleton={<SkeletonList rows={8} />} empty={data && !items.length} emptyIcon={Inbox} emptyTitle={t('comms.emptyFolder')} emptyBody="" compact>
            <ul className="mail-rows">
              {items.map((c) => (
                <li key={c.id} className={cx('mail-row', c.unread > 0 && 'is-unread', c.id === active && 'is-active', selected.includes(c.id) && 'is-selected')}>
                  <input type="checkbox" className="checkbox" checked={selected.includes(c.id)} onChange={() => setSelected((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]))} aria-label={t('comms.selectThread', { subject: c.subject })} />
                  <button type="button" className={cx('star', c.starred && 'is-on')} onClick={(e) => toggleStar(c, e)} aria-pressed={c.starred} aria-label={t('comms.star')}><Star aria-hidden="true" /></button>
                  <Link to={href(c.id)} className="mail-row__link">
                    <span className="mail-row__top">
                      <span className="mail-row__from truncate">{c.contact?.name ?? c.to ?? t('comms.unknownContact')}</span>
                      <span className="mail-row__time">{shortTime(c.lastMessageAt)}</span>
                    </span>
                    <span className="mail-row__subject truncate">{c.subject}</span>
                    <span className="mail-row__snip truncate">{c.lastMessage}</span>
                    {c.labels.length > 0 && <span className="row" style={{ gap: 4, marginTop: 4 }}>{c.labels.map((l) => <span key={l} className="mini-label"><i className="label-dot" style={{ background: LABEL_COLORS[l] }} aria-hidden="true" />{l}</span>)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </DataState>
        </section>

        {active ? <EmailThread key={active} id={active} onChanged={refreshAll} /> : (
          <div className="mail-read mail-read--empty"><EmptyState icon={Mail} title={t('comms.pickEmail')} body={t('comms.pickEmailBody')} /></div>
        )}
      </div>
    </>
  );
}
