import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const UIContext = createContext(null);

/**
 * Holds UI that any page can open — today that's the global transaction
 * composer used by the sidebar, the mobile tab bar and page headers.
 */
export function UIProvider({ children }) {
  const [transactionModal, setTransactionModal] = useState({
    open: false,
    transaction: null,
    defaults: null,
  });

  const openTransactionModal = useCallback((transaction = null, defaults = null) => {
    setTransactionModal({ open: true, transaction, defaults });
  }, []);

  const closeTransactionModal = useCallback(() => {
    setTransactionModal((previous) => ({ ...previous, open: false }));
  }, []);

  const value = useMemo(() => ({
    transactionModal,
    openTransactionModal,
    closeTransactionModal,
  }), [transactionModal, openTransactionModal, closeTransactionModal]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider.');
  return context;
}
