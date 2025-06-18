
import { useState, useCallback } from 'react';

interface PendingConnection {
  source: string;
  target: string;
}

export const useOwnershipModal = (onConnect: (connection: { source: string; target: string; label: string }) => void) => {
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);

  const openOwnershipModal = useCallback((connection: PendingConnection) => {
    console.log('🎯 Opening ownership modal for connection:', connection);
    setPendingConnection(connection);
    setShowOwnershipModal(true);
  }, []);

  const handleOwnershipConfirm = useCallback((percentage: number) => {
    if (pendingConnection) {
      console.log('🎯 Confirming ownership connection:', pendingConnection, percentage + '%');
      
      // Call the onConnect directly with the percentage
      onConnect({
        source: pendingConnection.source,
        target: pendingConnection.target,
        label: `${percentage}%`
      });
    }
    setShowOwnershipModal(false);
    setPendingConnection(null);
  }, [pendingConnection, onConnect]);

  const closeOwnershipModal = useCallback(() => {
    console.log('🎯 Closing ownership modal');
    setShowOwnershipModal(false);
    setPendingConnection(null);
  }, []);

  return {
    showOwnershipModal,
    openOwnershipModal,
    handleOwnershipConfirm,
    closeOwnershipModal
  };
};
