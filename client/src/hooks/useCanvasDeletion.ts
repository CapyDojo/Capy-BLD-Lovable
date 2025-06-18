
import { useCallback } from 'react';
import { Node } from '@xyflow/react';
import { getUnifiedRepository } from '@/services/repositories/unified';

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
      const repository = await getUnifiedRepository('ENTERPRISE');
      
      // Handle different node types
      if (selectedNode.type === 'entity') {
        // Validate deletion first
        const validationResult = await repository.validateEntityDeletion(selectedNode.id);
        
        if (!validationResult.isValid) {
          console.warn('⚠️ Entity deletion validation failed:', validationResult.errors);
          // You might want to show a user-friendly error message here
          const errorMessages = validationResult.errors.map(e => e.message).join(', ');
          console.error('❌ Cannot delete entity:', errorMessages);
          return;
        }
        
        // Delete entity via unified repository
        console.log('🗑️ Deleting entity node via unified repository:', selectedNode.id);
        await repository.deleteEntity(selectedNode.id, 'user', 'Deleted entity from canvas');
        
      } else if (selectedNode.type === 'shareholder') {
        // Delete ownership relationship - extract entity ID and ownership ID from the node ID
        console.log('🗑️ Deleting stakeholder node:', selectedNode.id);
        
        // Stakeholder node IDs are in format: stakeholder-{ownershipId}-of-{entityId}
        const match = selectedNode.id.match(/^stakeholder-(.+)-of-(.+)$/);
        if (match) {
          const [, ownershipId, entityId] = match;
          console.log('🗑️ Extracted ownership ID:', ownershipId, 'entity ID:', entityId);
          
          // Delete ownership via unified repository
          await repository.deleteOwnership(ownershipId, 'user', 'Deleted ownership from canvas');
        } else {
          console.error('❌ Could not parse stakeholder node ID:', selectedNode.id);
        }
      }
      
      console.log('✅ useCanvasDeletion: Deletion completed via unified repository');
    } catch (error) {
      console.error('❌ useCanvasDeletion: Error during deletion:', error);
    } finally {
      // Clear deletion flag to allow normal operations
      setIsDeleting(false);
    }
  }, [selectedNode, setIsDeleting, setSidebarOpen, setSelectedNode]);

  return { deleteSelectedNode };
};
