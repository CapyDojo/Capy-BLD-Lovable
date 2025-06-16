
import { useState, useCallback, useRef, useMemo } from 'react';
import { 
  Node, 
  Edge, 
  Connection, 
  useNodesState, 
  useEdgesState,
  addEdge
} from '@xyflow/react';
import { EntityTypes } from '@/types/entity';
import { generateSyncedCanvasStructure } from '@/services/capTableSync';

type DraggableNodeType = EntityTypes | 'Individual';

const generateInitialState = () => {
  return generateSyncedCanvasStructure();
};

export const useEntityCanvas = () => {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => generateInitialState(), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection | { source: string; target: string; label: string }) => {
      const edge: Edge = {
        id: `e-${params.source}-${params.target}`,
        source: params.source,
        target: params.target,
        label: 'label' in params ? params.label : 'Connection',
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        labelStyle: { fill: '#3b82f6', fontWeight: 600 },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges],
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
       const newNode: Node = {
        id,
        type: 'shareholder',
        position,
        data: {
          name: `New Individual`,
          ownershipPercentage: 0,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    } else {
      const newNode: Node = {
        id,
        type: 'entity',
        position,
        data: {
          name: `New ${type}`,
          type,
          jurisdiction: 'Delaware',
          basePosition: position,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    }
  }, [setNodes]);

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
    
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
    setSelectedNode((current) => current ? { ...current, data: { ...current.data, ...updates } } : null);
  }, [selectedNode, setNodes]);

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
  };
};
