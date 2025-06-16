
import { useState, useCallback } from 'react';
import { updateOwnershipFromChart } from '@/services/capTableSync';

interface PendingConnection {
  source: string;
  target: string;
}

export const useOwnershipModal = (onConnect: (connection: { source: string; target: string; label: string }) => void) => {
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);

  const openOwnershipModal = useCallback((connection: PendingConnection) => {
    setPendingConnection(connection);
    setShowOwnershipModal(true);
  }, []);

  const handleOwnershipConfirm = useCallback((percentage: number) => {
    if (pendingConnection) {
      console.log('🎯 Confirming ownership connection with auto-sync:', pendingConnection, percentage);
      
      // Use the chart mutation function which auto-saves
      updateOwnershipFromChart(pendingConnection.source, pendingConnection.target, percentage);
      
      // Also call the original onConnect for immediate UI feedback
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
