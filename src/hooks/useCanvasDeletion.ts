
import { useCallback } from 'react';
import { Node } from '@xyflow/react';
import { deleteEntityFromChart } from '@/services/capTableSync';
import { dataStore } from '@/services/dataStore';

export const useCanvasDeletion = (
  selectedNode: Node | null,
  setIsDeleting: (value: boolean) => void,
  setSidebarOpen: (value: boolean) => void,
  setSelectedNode: (node: Node | null) => void
) => {
  // Centralized deletion function that both trash icon and backspace will use
  const deleteSelectedNode = useCallback(async () => {
    if (!selectedNode) return;
    
    console.log('🗑️ useCanvasDeletion: Starting deletion process for:', selectedNode.id, 'type:', selectedNode.type);
    
    // Set deletion flag to prevent interference
    setIsDeleting(true);
    
    // Close sidebar immediately to prevent UI issues
    setSidebarOpen(false);
    setSelectedNode(null);
    
    try {
      // Handle different node types
      if (selectedNode.type === 'entity') {
        // Delete entity
        console.log('🗑️ Deleting entity node:', selectedNode.id);
        deleteEntityFromChart(selectedNode.id);
      } else if (selectedNode.type === 'shareholder') {
        // Delete stakeholder - extract entity ID and stakeholder ID from the node ID
        console.log('🗑️ Deleting stakeholder node:', selectedNode.id);
        
        // Stakeholder node IDs are in format: stakeholder-{investmentId}-of-{entityId}
        const match = selectedNode.id.match(/^stakeholder-(.+)-of-(.+)$/);
        if (match) {
          const [, stakeholderId, entityId] = match;
          console.log('🗑️ Extracted stakeholder ID:', stakeholderId, 'entity ID:', entityId);
          
          // Use the data store's deleteStakeholder method
          dataStore.deleteStakeholder(entityId, stakeholderId);
        } else {
          console.error('❌ Could not parse stakeholder node ID:', selectedNode.id);
        }
      }
      
      // Wait a short moment for the deletion to persist to localStorage
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('✅ useCanvasDeletion: Deletion completed, allowing data store notifications');
    } finally {
      // Clear deletion flag to allow normal operations
      setIsDeleting(false);
    }
  }, [selectedNode, setIsDeleting, setSidebarOpen, setSelectedNode]);

  return { deleteSelectedNode };
};
