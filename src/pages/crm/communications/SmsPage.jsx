import MessagingPage from './MessagingPage.jsx';

/** SMS / MMS inbox (consent, STOP opt-out, quiet hours, segment counter). Shared UI lives in MessagingPage. */
export default function SmsPage() {
  return <MessagingPage key="sms" channel="sms" />;
}
