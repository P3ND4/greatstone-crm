import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/work-sans/500.css';
import '@fontsource/work-sans/600.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import { I18nProvider } from './i18n/index.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import { router } from './app/router.jsx';
import { SessionProvider } from './app/SessionProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <SessionProvider>
        <ToastProvider>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </ToastProvider>
      </SessionProvider>
    </I18nProvider>
  </StrictMode>,
);
