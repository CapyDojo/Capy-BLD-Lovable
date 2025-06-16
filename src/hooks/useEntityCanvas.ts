
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { 
  Node, 
  Edge, 
  Connection, 
  useNodesState, 
  useEdgesState,
  addEdge
} from '@xyflow/react';
import { EntityTypes } from '@/types/entity';
import { generateSyncedCanvasStructure, updateOwnershipFromChart, addEntityFromChart, updateEntityFromChart, deleteEntityFromChart } from '@/services/capTableSync';
import { dataStore } from '@/services/dataStore';

type DraggableNodeType = EntityTypes | 'Individual';

const generateInitialState = () => {
  return generateSyncedCanvasStructure();
};

export const useEntityCanvas = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to data store changes for auto-sync
  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setRefreshKey(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => generateInitialState(), [refreshKey]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Update nodes and edges when data changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = generateInitialState();
    setNodes(newNodes);
    setEdges(newEdges);
  }, [refreshKey, setNodes, setEdges]);

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
      setSelectedNode(node);
      setSidebarOpen(true);
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
    
    // Update in data store (this will auto-save and sync)
    updateEntityFromChart(selectedNode.id, updates);
    
    // Update local selected node state
    setSelectedNode((current) => current ? { ...current, data: { ...current.data, ...updates } } : null);
  }, [selectedNode]);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    
    // Delete from data store (this will auto-save and sync)
    deleteEntityFromChart(selectedNode.id);
    
    // Close sidebar
    setSidebarOpen(false);
    setSelectedNode(null);
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
