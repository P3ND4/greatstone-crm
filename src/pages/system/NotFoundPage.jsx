import { Compass } from 'lucide-react';
import { Button, Card, EmptyState } from '../../components/ui/index.js';
import { useT } from '../../i18n/index.jsx';

export default function NotFoundPage() {
  const t = useT();
  return (
    <Card>
      <EmptyState icon={Compass} title={t('states.notFoundTitle')} body={t('states.notFoundBody')} action={<Button variant="primary" to="/">{t('states.goHome')}</Button>} />
    </Card>
  );
}
