
import { useCallback, useRef } from 'react';
import { Node, Connection, useReactFlow } from '@xyflow/react';
import { getUnifiedRepository } from '@/services/repositories/unified';
import { EntityTypes } from '@/types/entity';

type DraggableNodeType = EntityTypes;

export const useCanvasEvents = (
  selectedNode: Node | null,
  setSelectedNode: (node: Node | null) => void,
  setSidebarOpen: (value: boolean) => void
) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    async (params: Connection | { source: string; target: string; label: string }) => {
      console.log('🔗 Creating ownership connection:', params);
      
      try {
        const repository = await getUnifiedRepository('ENTERPRISE');
        
        // Extract ownership percentage from label
        const percentageMatch = 'label' in params ? params.label.match(/(\d+(?:\.\d+)?)%/) : null;
        const shares = percentageMatch ? parseFloat(percentageMatch[1]) * 100 : 1000; // Convert percentage to shares

        console.log('🔗 Creating ownership with shares:', shares);

        // Get the target entity to find its share classes
        const targetEntity = await repository.getEntity(params.target);
        if (!targetEntity) {
          throw new Error(`Target entity ${params.target} not found`);
        }

        // Get share classes for the target entity
        const shareClasses = await repository.getShareClassesByEntity(params.target);
        let shareClassId = shareClasses.length > 0 ? shareClasses[0].id : null;

        // If no share class exists, create a default one
        if (!shareClassId) {
          const defaultShareClass = await repository.createShareClass({
            entityId: params.target,
            name: 'Common Stock',
            type: 'Common Stock' as const,
            totalAuthorizedShares: 10000,
            votingRights: true
          }, 'user');
          shareClassId = defaultShareClass.id;
        }

        // Create ownership in unified repository
        await repository.createOwnership({
          ownerEntityId: params.source,
          ownedEntityId: params.target,
          shares,
          shareClassId: shareClassId!,
          effectiveDate: new Date(),
          createdBy: 'user',
          updatedBy: 'user'
        }, 'user');

        console.log('✅ Ownership created successfully via unified repository');
      } catch (error) {
        console.error('❌ Error creating ownership via unified repository:', error);
      }
    },
    [],
  );

  const onNodeClick = useCallback(async (event: React.MouseEvent, node: Node) => {
    console.log('🎯 Node clicked:', node.id, node.type);
    
    if (node.type === 'entity') {
      console.log('🎯 Entity node clicked:', node.id);
      
      try {
        const repository = await getUnifiedRepository('ENTERPRISE');
        // Verify the entity still exists in the unified repository
        const entity = await repository.getEntity(node.id);
        if (!entity) {
          console.warn('⚠️ Clicked entity no longer exists in repository:', node.id);
          return;
        }
        
        setSelectedNode(node);
        setSidebarOpen(true);
      } catch (error) {
        console.error('❌ Error checking entity existence:', error);
      }
    }
  }, [setSelectedNode, setSidebarOpen]);

  const createNode = useCallback(async (type: DraggableNodeType, position: { x: number; y: number }) => {
    const id = `new-${Date.now().toString()}`;
    console.log('➕ Creating new node:', type, 'at position:', position, 'with id:', id);

    try {
      const repository = await getUnifiedRepository('ENTERPRISE');
      
      const newEntity = {
        name: `New ${type}`,
        type,
        jurisdiction: type === 'Individual' ? undefined : 'Delaware',
        registrationNumber: type === 'Individual' ? undefined : `REG-${Date.now()}`,
        incorporationDate: type === 'Individual' ? undefined : new Date(),
        address: 'TBD',
        position, // Store the exact drop position
        metadata: { position }
      };
      
      console.log('➕ Creating new entity in unified repository:', newEntity);
      await repository.createEntity(newEntity, 'user', `Created ${type} entity from canvas`);
      console.log('✅ Entity added to unified repository with position:', position);
    } catch (error) {
      console.error('❌ Error creating entity via unified repository:', error);
    }
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    console.log('🎯 Drag over event received');
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      console.log('🎯 Drop event received');
      event.preventDefault();

      const reactFlowWrapperCurrent = reactFlowWrapper.current;
      if (!reactFlowWrapperCurrent) {
        console.warn('⚠️ ReactFlow wrapper not found');
        return;
      }

      const reactFlowBounds = reactFlowWrapperCurrent.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow') as DraggableNodeType;

      console.log('🎯 Drop data:', {
        type,
        clientX: event.clientX,
        clientY: event.clientY,
        bounds: reactFlowBounds
      });

      if (typeof type === 'undefined' || !type) {
        console.warn('⚠️ No valid type found in drop data');
        return;
      }

      // Calculate exact drop position accounting for node center offset
      const position = {
        x: event.clientX - reactFlowBounds.left - 100, // Center the node horizontally
        y: event.clientY - reactFlowBounds.top - 34,   // Center the node vertically (half of node height)
      };

      console.log('🎯 Calculated drop position:', position);
      createNode(type, position);
    },
    [createNode],
  );

  const updateSelectedNode = useCallback(async (updates: Partial<Node['data']>) => {
    if (!selectedNode) return;
    
    try {
      const repository = await getUnifiedRepository('ENTERPRISE');
      
      // Verify the entity still exists before updating
      const entity = await repository.getEntity(selectedNode.id);
      if (!entity) {
        console.warn('⚠️ Cannot update node - entity no longer exists:', selectedNode.id);
        setSelectedNode(null);
        setSidebarOpen(false);
        return;
      }
      
      console.log('📝 Updating selected node via unified repository:', selectedNode.id, updates);
      
      // Update in unified repository
      await repository.updateEntity(selectedNode.id, updates, 'user', 'Updated entity from canvas');
      
      // Update local selected node state
      const updatedNode = { 
        ...selectedNode, 
        data: { ...selectedNode.data, ...updates } 
      };
      setSelectedNode(updatedNode);
      
      console.log('✅ Entity updated successfully via unified repository');
    } catch (error) {
      console.error('❌ Error updating entity via unified repository:', error);
    }
  }, [selectedNode, setSelectedNode, setSidebarOpen]);

  return {
    reactFlowWrapper,
    onConnect,
    onNodeClick,
    createNode,
    onDragOver,
    onDrop,
    updateSelectedNode
  };
};
