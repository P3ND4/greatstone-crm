import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import TaskModal from './TaskModal.jsx';
import AppointmentModal from './AppointmentModal.jsx';
import NoteModal from './NoteModal.jsx';
import ContactModal from './ContactModal.jsx';
import PaymentModal from './PaymentModal.jsx';

/** Opens quick-create modals from anywhere (topbar "+ New", command palette, lists). */
const QuickActionsContext = createContext(null);
const MODALS = { task: TaskModal, appointment: AppointmentModal, note: NoteModal, contact: ContactModal, payment: PaymentModal };

export function QuickActionsProvider({ children }) {
  const [active, setActive] = useState(null); // { type, props }
  const open = useCallback((type, props = {}) => setActive({ type, props }), []);
  const close = useCallback(() => setActive(null), []);
  const value = useMemo(() => ({ open, close }), [open, close]);
  const Modal = active ? MODALS[active.type] : null;
  return (
    <QuickActionsContext.Provider value={value}>
      {children}
      {Modal && <Modal key={active.type} open onClose={close} {...active.props} />}
    </QuickActionsContext.Provider>
  );
}

export function useQuickActions() {
  const ctx = useContext(QuickActionsContext);
  if (!ctx) throw new Error('useQuickActions must be used inside <QuickActionsProvider>');
  return ctx;
}
