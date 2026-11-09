import { useSession } from '../../../app/SessionProvider.jsx';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Clock, Expand, MessageCircle, MessageSquareText, PanelRightClose, PanelRightOpen } from 'lucide-react';
import Bubbles from '../../../components/comms/Bubbles.jsx';
import ChannelHeader from '../../../components/comms/ChannelHeader.jsx';
import ContactPanel from '../../../components/comms/ContactPanel.jsx';
import ConsentBadge from '../../../components/comms/ConsentBadge.jsx';
import ConversationList from '../../../components/comms/ConversationList.jsx';
import WaComposer from '../../../components/comms/WaComposer.jsx';
import { SearchInput } from '../../../components/list/ListToolbar.jsx';
import { Avatar, Badge, DataState, EmptyState, IconButton, SkeletonList, useToast } from '../../../components/ui/index.js';
import useResource from '../../../hooks/useResource.js';
import { useT } from '../../../i18n/index.jsx';
import { communicationsService } from '../../../services/index.js';
import { time } from '../../../lib/format.js';
import cx from '../../../lib/cx.js';

const FILTERS = ['all', 'unread', 'mine'];
const ICON = { whatsapp: MessageCircle, sms: MessageSquareText };
/** One chat thread (WhatsApp or SMS): header with channel rules, bubbles, composer, optional contact panel. */
export function ThreadView({ id, channel = 'whatsapp', showPanel, onTogglePanel, expanded, onSent }) {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useResource(() => communicationsService.thread(id), [id]);
  const [messages, setMessages] = useState([]);
  const end = useRef(null);
  useEffect(() => {
    if (data) {
      setMessages(data.messages);
      if (data.conversation.unread) communicationsService.markRead(id).then(() => onSent?.());
    }
  }, [data, id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [messages]);

  const send = async (payload) => {
    try {
      const msg = await communicationsService.send(id, payload);
      setMessages((m) => [...m, msg]);
      if (payload.isNote) toast.show(t('comms.noteAdded'));
      else if (msg.status === 'scheduled') toast.show(t('comms.sms.scheduledToast', { time: time(msg.scheduledFor) }));
      onSent?.();
      if (channel === 'sms' && !payload.isNote) refetch(); // first-message footer / quiet hours state may change
      return true;
    } catch (e) {
      toast.show(t(e.code === 'opted_out' ? 'comms.sms.optedOutError' : 'states.errorTitle'), { tone: 'danger' });
      return false;
    }
  };

  const conv = data?.conversation;
  return (
    <DataState loading={loading && !data} error={error} onRetry={refetch} skeleton={<div className="comms-thread"><SkeletonList rows={6} /></div>}>
      {conv && (
        <>
          <section className="comms-thread" aria-label={conv.contact?.name}>
            <header className="thread-head">
              <Link to={`/crm/communications/${channel}`} className="icon-btn show-mobile-inline" aria-label={t('common.back')}><ArrowLeft /></Link>
              <Avatar name={conv.contact?.name} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p className="thread-head__name truncate">{conv.contact?.name}</p>
                <p className="thread-head__sub truncate">{conv.contact?.phone}{conv.project ? ` · ${conv.project.name}` : ''}</p>
              </div>
              {channel === 'whatsapp' && <Badge tone={data.windowOpen ? 'success' : 'warning'} icon={Clock}>{data.windowOpen ? t('comms.windowOpen') : t('comms.windowClosed')}</Badge>}
              {channel === 'sms' && data.sms && <ConsentBadge consent={data.sms.consent} />}
              {!expanded && <IconButton icon={Expand} label={t('comms.expand')} onClick={() => navigate(`/crm/communications/${channel}/${id}`)} className="hide-mobile" />}
              {onTogglePanel && <IconButton icon={showPanel ? PanelRightClose : PanelRightOpen} label={t('comms.contactPanel')} onClick={onTogglePanel} className="hide-mobile" />}
            </header>
            <div className="thread-scroll">
              <Bubbles messages={messages} />
              <div ref={end} />
            </div>
            <WaComposer channel={channel} windowOpen={data.windowOpen} sms={data.sms} firstName={conv.contact?.firstName} onSend={send} />
          </section>
          {showPanel && <ContactPanel conversation={conv} channel={channel} sms={data.sms} onConsentChange={refetch} />}
        </>
      )}
    </DataState>
  );
}

/** Chat inbox shared by WhatsApp and SMS: list (search, filters) · thread · contact panel. */
export default function MessagingPage({ channel = 'whatsapp' }) {
  const t = useT();
  const session = useSession();
  const [params, setParams] = useSearchParams();
  const active = params.get('c');
  const filter = params.get('f') || 'all';
  const q = params.get('q') || '';
  const [showPanel, setShowPanel] = useState(true);
  const set = (k, v) => setParams((p) => { const n = new URLSearchParams(p); if (v) n.set(k, v); else n.delete(k); return n; }, { replace: true });

  const { data, loading, error, refetch } = useResource(
    () => communicationsService.list({ channel, q, unread: filter === 'unread', assigneeId: filter === 'mine' ? session.user.id : undefined }),
    [channel, q, filter],
  );
  const { data: unread } = useResource(() => communicationsService.unreadByChannel(), [active, channel]);
  const Icon = ICON[channel];

  const href = (id) => { const n = new URLSearchParams(params); n.set('c', id); return `?${n.toString()}`; };

  return (
    <>
      <ChannelHeader unread={unread} />
      <div className={cx('comms', active && 'has-active', showPanel && active && 'has-panel')}>
        <aside className="comms-list" aria-label={t('comms.conversations')}>
          <div className="comms-list__top">
            <SearchInput value={q} onChange={(v) => set('q', v)} placeholder={t('comms.searchChats')} />
            <div className="chips" role="radiogroup" aria-label={t('common.filters')}>
              {FILTERS.map((f) => (
                <button key={f} type="button" role="radio" aria-checked={filter === f} className="chip" onClick={() => set('f', f === 'all' ? '' : f)}>{t(`comms.filters.${f}`)}</button>
              ))}
            </div>
          </div>
          <DataState loading={loading && !data} error={error} onRetry={refetch} skeleton={<SkeletonList rows={8} />} empty={data && !data.items.length} emptyIcon={Icon} emptyTitle={t('list.noResults')} emptyBody="" compact>
            <ConversationList items={data?.items || []} activeId={active} buildHref={href} />
          </DataState>
        </aside>
        {active ? (
          <ThreadView key={active} id={active} channel={channel} showPanel={showPanel} onTogglePanel={() => setShowPanel((s) => !s)} onSent={refetch} />
        ) : (
          <div className="comms-thread comms-thread--empty">
            <EmptyState icon={Icon} title={t('comms.pickChat')} body={t(channel === 'sms' ? 'comms.sms.pickBody' : 'comms.pickChatBody')} />
          </div>
        )}
      </div>
    </>
  );
}
