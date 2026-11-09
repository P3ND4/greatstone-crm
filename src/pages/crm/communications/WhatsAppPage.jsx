import MessagingPage from './MessagingPage.jsx';

/** WhatsApp inbox (24-hour window + approved templates). Shared UI lives in MessagingPage. */
export default function WhatsAppPage() {
  return <MessagingPage key="whatsapp" channel="whatsapp" />;
}
