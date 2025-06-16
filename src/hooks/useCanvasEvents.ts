
import { useCallback, useRef } from 'react';
import { Node, Connection } from '@xyflow/react';
import { updateOwnershipFromChart, addEntityFromChart, updateEntityFromChart } from '@/services/capTableSync';
import { dataStore } from '@/services/dataStore';
import { EntityTypes } from '@/types/entity';

type DraggableNodeType = EntityTypes | 'Individual';

export const useCanvasEvents = (
  selectedNode: Node | null,
  setSelectedNode: (node: Node | null) => void,
  setSidebarOpen: (value: boolean) => void
) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection | { source: string; target: string; label: string }) => {
      console.log('🔗 Creating ownership connection:', params);
      
      // Extract ownership percentage from label
      const percentageMatch = 'label' in params ? params.label.match(/(\d+(?:\.\d+)?)%/) : null;
      const ownershipPercentage = percentageMatch ? parseFloat(percentageMatch[1]) : 10;

      console.log('🔗 Extracted ownership percentage:', ownershipPercentage);

      // Update ownership in data store (this will auto-save and sync)
      updateOwnershipFromChart(params.source, params.target, ownershipPercentage);

      // The edge will be recreated automatically when the data store updates
    },
    [],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('🎯 Node clicked:', node.id, node.type);
    
    if (node.type === 'entity') {
      console.log('🎯 Entity node clicked:', node.id);
      
      // Verify the entity still exists in the data store
      const entity = dataStore.getEntityById(node.id);
      if (!entity) {
        console.warn('⚠️ Clicked entity no longer exists in data store:', node.id);
        return;
      }
      
      setSelectedNode(node);
      setSidebarOpen(true);
    } else if (node.type === 'shareholder') {
      console.log('🎯 Stakeholder node clicked:', node.id);
      setSelectedNode(node);
      setSidebarOpen(false); // Don't open sidebar for stakeholder nodes
    }
  }, [setSelectedNode, setSidebarOpen]);

  const createNode = useCallback((type: DraggableNodeType, position: { x: number; y: number }) => {
    const id = `new-${Date.now().toString()}`;
    console.log('➕ Creating new node:', type, 'at position:', position, 'with id:', id);

    if (type === 'Individual') {
      // For individuals, we don't create entities, just stakeholder nodes
      // This would be handled differently - perhaps through the stakeholder panel
      console.log('Individual stakeholder creation should be handled through the cap table panel');
    } else {
      const newEntity = {
        id,
        name: `New ${type}`,
        type,
        jurisdiction: 'Delaware',
        ownership: 0,
        registrationNumber: `REG-${Date.now()}`,
        incorporationDate: new Date(),
        address: 'TBD'
      };
      
      console.log('➕ Creating new entity in data store:', newEntity);
      // Add to data store (this will auto-save and sync)
      addEntityFromChart(newEntity);
      console.log('✅ Entity added to data store, should trigger refresh');
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

      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      console.log('🎯 Calculated position:', position);
      console.log('🎯 About to call createNode...');
      createNode(type, position);
      console.log('🎯 createNode called, waiting for data store update...');
    },
    [createNode],
  );

  const updateSelectedNode = useCallback((updates: Partial<Node['data']>) => {
    if (!selectedNode) return;
    
    // Verify the entity still exists before updating
    const entity = dataStore.getEntityById(selectedNode.id);
    if (!entity) {
      console.warn('⚠️ Cannot update node - entity no longer exists:', selectedNode.id);
      setSelectedNode(null);
      setSidebarOpen(false);
      return;
    }
    
    console.log('📝 Updating selected node:', selectedNode.id, updates);
    // Update in data store (this will auto-save and sync)
    updateEntityFromChart(selectedNode.id, updates);
    
    // Update local selected node state - create updated node directly
    const updatedNode = { 
      ...selectedNode, 
      data: { ...selectedNode.data, ...updates } 
    };
    setSelectedNode(updatedNode);
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
