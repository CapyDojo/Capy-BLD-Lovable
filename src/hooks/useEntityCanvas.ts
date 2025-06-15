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
import { Shareholder } from '@/types/capTable';
import { getAllEntities, getCapTableByEntityId } from '@/data/mockData';

type DraggableNodeType = EntityTypes | 'Individual';

const generateInitialState = () => {
  const allEntities = getAllEntities();
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeIds = new Set<string>();

  // Pass 1: Create all entity nodes with initial positions
  allEntities.forEach((entity, index) => {
    const position = { 
      x: 250 + (index % 3) * 400, 
      y: 100 + Math.floor(index / 3) * 300
    };
    const entityNode: Node = {
      id: entity.id,
      type: 'entity',
      position,
      data: {
        name: entity.name,
        type: entity.type,
        jurisdiction: entity.jurisdiction,
        basePosition: position, // Store for shareholder layout
      },
    };
    nodes.push(entityNode);
    nodeIds.add(entity.id);
  });

  // Pass 2: Create edges and shareholder nodes from cap tables
  allEntities.forEach((entity) => {
    const capTable = getCapTableByEntityId(entity.id);
    if (!capTable) return;

    const parentNode = nodes.find(n => n.id === entity.id);
    if (!parentNode) return;

    const totalShares = capTable.investments.reduce((sum, inv) => sum + inv.sharesOwned, 0);
    if (totalShares === 0) return;

    const shareholdersById = capTable.investments.reduce((acc, investment) => {
      const shareholder = capTable.shareholders.find(s => s.id === investment.shareholderId);
      if (shareholder) {
        if (!acc[shareholder.id]) {
          acc[shareholder.id] = {
            ...shareholder,
            totalSharesOwned: 0,
          };
        }
        acc[shareholder.id].totalSharesOwned += investment.sharesOwned;
      }
      return acc;
    }, {} as Record<string, Shareholder & { totalSharesOwned: number }>);
    
    const individualShareholders = Object.values(shareholdersById).filter(sh => sh.type === 'Individual' || sh.type === 'Pool');
    const totalIndividuals = individualShareholders.length;

    Object.values(shareholdersById).forEach((shareholder) => {
      const ownershipPercentage = (shareholder.totalSharesOwned / totalShares) * 100;

      if (shareholder.type === 'Entity' && shareholder.entityId) {
        edges.push({
          id: `e-${shareholder.entityId}-${entity.id}`,
          source: shareholder.entityId,
          target: entity.id,
          label: `${ownershipPercentage.toFixed(1)}%`,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
          labelStyle: { fill: '#3b82f6', fontWeight: 600 },
        });
      } else if (shareholder.type === 'Individual' || shareholder.type === 'Pool') {
        const shareholderNodeId = `shareholder-${shareholder.id}-of-${entity.id}`;
        if (nodeIds.has(shareholderNodeId)) return;

        const parentPosition = parentNode.data.basePosition as { x: number; y: number };
        const individualIndex = individualShareholders.findIndex(sh => sh.id === shareholder.id);
        const offset = (individualIndex - (totalIndividuals - 1) / 2) * 220;
        
        const shareholderPosition = {
          x: parentPosition.x + offset,
          y: parentPosition.y - 150, // Positioned above the parent entity
        };
        
        nodes.push({
          id: shareholderNodeId,
          type: 'shareholder',
          position: shareholderPosition,
          data: { name: shareholder.name, ownershipPercentage },
        });
        nodeIds.add(shareholderNodeId);
        
        edges.push({
          id: `e-${shareholderNodeId}-${entity.id}`,
          source: shareholderNodeId, // from shareholder (bottom handle)
          target: entity.id, // to entity (top handle)
          label: `${ownershipPercentage.toFixed(1)}%`,
          style: { stroke: '#8b5cf6', strokeWidth: 1.5 },
          labelStyle: { fill: '#8b5cf6', fontWeight: 500 },
        });
      }
    });
  });

  return { initialNodes: nodes, initialEdges: edges };
};

export const useEntityCanvas = () => {
  const { initialNodes, initialEdges } = useMemo(() => generateInitialState(), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesState] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection | { source: string; target: string; label: string }) => {
      const edge = {
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
