import { Bot, Sparkles } from 'lucide-react';
import AssistantChat from '../../components/ai/AssistantChat.jsx';
import { useT } from '../../i18n/index.jsx';

export default function AssistantPage() {
  const t = useT();
  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-head__eyebrow"><Sparkles size={12} style={{ display: 'inline', verticalAlign: -1 }} aria-hidden="true" /> {t('nav.ai')}</p>
          <h1 className="page-title"><Bot size={26} style={{ display: 'inline', verticalAlign: -3, marginRight: 8 }} aria-hidden="true" />{t('ai.nav.assistant')}</h1>
          <p className="page-subtitle">{t('ai.desc.assistant')}</p>
        </div>
      </div>
      <div className="assistant-page"><AssistantChat /></div>
    </>
  );
}
