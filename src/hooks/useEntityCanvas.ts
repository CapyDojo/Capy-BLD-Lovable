import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { 
  Node, 
  Edge, 
  Connection, 
  useNodesState, 
  useEdgesState,
  addEdge,
  useReactFlow
} from '@xyflow/react';
import { EntityTypes } from '@/types/entity';
import { generateSyncedCanvasStructure, updateOwnershipFromChart, addEntityFromChart, updateEntityFromChart, deleteEntityFromChart } from '@/services/capTableSync';
import { dataStore } from '@/services/dataStore';

type DraggableNodeType = EntityTypes | 'Individual';

const generateInitialState = () => {
  console.log('🔄 Generating initial canvas state');
  return generateSyncedCanvasStructure();
};

export const useEntityCanvas = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { getNodes } = useReactFlow();

  // Subscribe to data store changes for auto-sync
  useEffect(() => {
    console.log('🔗 Setting up data store subscription in useEntityCanvas');
    const unsubscribe = dataStore.subscribe(() => {
      // Skip refresh if we're in the middle of a deletion
      if (isDeleting) {
        console.log('⏳ Skipping refresh during deletion process');
        return;
      }
      
      console.log('📡 useEntityCanvas: Data store changed, triggering refresh');
      
      // Check if selected node's entity still exists
      if (selectedNode) {
        const entity = dataStore.getEntityById(selectedNode.id);
        if (!entity) {
          console.log('🚪 Selected node entity deleted, closing sidebar');
          setSelectedNode(null);
          setSidebarOpen(false);
        }
      }
      
      setRefreshKey(prev => {
        const newKey = prev + 1;
        console.log('🔄 useEntityCanvas: Refresh key updated from', prev, 'to', newKey);
        return newKey;
      });
    });
    return unsubscribe;
  }, [selectedNode, isDeleting]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    console.log('🔄 useEntityCanvas: Regenerating canvas structure due to refresh key:', refreshKey);
    const result = generateInitialState();
    console.log('📊 useEntityCanvas: Generated', result.nodes.length, 'nodes and', result.edges.length, 'edges');
    return result;
  }, [refreshKey]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Update nodes and edges when data changes - this is crucial for sync
  useEffect(() => {
    // Skip updates if we're in the middle of a deletion
    if (isDeleting) {
      console.log('⏳ Skipping nodes/edges update during deletion');
      return;
    }
    
    console.log('🔄 useEntityCanvas: Updating nodes and edges from data store changes');
    const { nodes: newNodes, edges: newEdges } = generateInitialState();
    console.log('📊 useEntityCanvas: Setting new nodes count:', newNodes.length, 'new edges count:', newEdges.length);
    
    // Check if selected node still exists in new nodes
    if (selectedNode && !newNodes.find(node => node.id === selectedNode.id)) {
      console.log('🚪 useEntityCanvas: Selected node was deleted, closing sidebar');
      setSelectedNode(null);
      setSidebarOpen(false);
    }
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [refreshKey, setNodes, setEdges, selectedNode, isDeleting]);

  // Centralized deletion function that both trash icon and backspace will use
  const deleteSelectedNode = useCallback(async () => {
    if (!selectedNode) return;
    
    console.log('🗑️ useEntityCanvas: Starting deletion process for:', selectedNode.id, 'type:', selectedNode.type);
    
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
      
      console.log('✅ useEntityCanvas: Deletion completed, allowing data store notifications');
    } finally {
      // Clear deletion flag to allow normal operations
      setIsDeleting(false);
    }
  }, [selectedNode]);

  // Handle keyboard events - make backspace use the same deletion workflow
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle backspace/delete when we have a selected node and no input is focused
      if ((event.key === 'Backspace' || event.key === 'Delete') && selectedNode) {
        // Check if any input/textarea is focused
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).contentEditable === 'true'
        );
        
        if (!isInputFocused) {
          event.preventDefault();
          console.log('⌨️ Backspace/Delete pressed, triggering deletion workflow');
          deleteSelectedNode();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNode, deleteSelectedNode]);

  const onConnect = useCallback(
    (params: Connection | { source: string; target: string; label: string }) => {
      console.log('🔗 Creating ownership connection:', params);
      
      // Extract ownership percentage from label
      const percentageMatch = 'label' in params ? params.label.match(/(\d+(?:\.\d+)?)%/) : null;
      const ownershipPercentage = percentageMatch ? parseFloat(percentageMatch[1]) : 10;

      // Update ownership in data store (this will auto-save and sync)
      updateOwnershipFromChart(params.source, params.target, ownershipPercentage);

      // The edge will be recreated automatically when the data store updates
    },
    [],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
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
  }, []);

  const createNode = useCallback((type: DraggableNodeType, position: { x: number; y: number }) => {
    const id = `new-${Date.now().toString()}`;

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
      
      console.log('➕ Creating new entity:', newEntity);
      // Add to data store (this will auto-save and sync)
      addEntityFromChart(newEntity);
    }
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowWrapperCurrent = reactFlowWrapper.current;
      if (!reactFlowWrapperCurrent) return;

      const reactFlowBounds = reactFlowWrapperCurrent.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow') as DraggableNodeType;

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      createNode(type, position);
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
    
    // Update local selected node state
    setSelectedNode((current) => current ? { ...current, data: { ...current.data, ...updates } } : null);
  }, [selectedNode]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    selectedNode,
    sidebarOpen,
    setSidebarOpen,
    reactFlowWrapper,
    createNode,
    onDragOver,
    onDrop,
    updateSelectedNode,
    deleteSelectedNode,
  };
};
