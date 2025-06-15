
import { useState, useCallback, useRef } from 'react';
import { 
  Node, 
  Edge, 
  Connection, 
  useNodesState, 
  useEdgesState,
  addEdge
} from '@xyflow/react';
import { EntityTypes } from '@/types/entity';
import { getAllEntities } from '@/data/mockData';

const initialNodes: Node[] = getAllEntities().map((entity, index) => ({
  id: entity.id,
  type: 'entity',
  position: { 
    x: 250 + (index % 2) * 300, 
    y: 100 + Math.floor(index / 2) * 200 
  },
  data: {
    name: entity.name,
    type: entity.type,
    jurisdiction: entity.jurisdiction,
    ownership: entity.ownership,
  },
}));

const initialEdges: Edge[] = getAllEntities()
  .filter(entity => entity.parentId)
  .map(entity => ({
    id: `e-${entity.parentId}-${entity.id}`,
    source: entity.parentId!,
    target: entity.id,
    label: `${entity.ownership}%`,
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    labelStyle: { fill: '#3b82f6', fontWeight: 600 },
  }));

export const useEntityCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        label: '100%',
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        labelStyle: { fill: '#3b82f6', fontWeight: 600 },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSidebarOpen(true);
  }, []);

  const createEntity = useCallback((type: EntityTypes, position: { x: number; y: number }) => {
    const newNode: Node = {
      id: Date.now().toString(),
      type: 'entity',
      position,
      data: {
        name: `New ${type}`,
        type,
        jurisdiction: 'Delaware',
        ownership: 100,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow') as EntityTypes;

      if (typeof type === 'undefined' || !type || !reactFlowBounds) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      createEntity(type, position);
    },
    [createEntity],
  );

  const updateSelectedNode = useCallback((updates: Partial<Node['data']>) => {
    if (!selectedNode) return;

    const updatedNodes = nodes.map((node) =>
      node.id === selectedNode.id
        ? { ...node, data: { ...node.data, ...updates } }
        : node
    );
    setNodes(updatedNodes);
    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, ...updates } });
  }, [selectedNode, nodes, setNodes]);

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
    createEntity,
    onDragOver,
    onDrop,
    updateSelectedNode,
  };
};
