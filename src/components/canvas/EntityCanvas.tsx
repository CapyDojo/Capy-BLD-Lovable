import React, { useState, useCallback, useRef } from 'react';
import { 
  ReactFlow, 
  Node, 
  Edge, 
  addEdge, 
  Connection, 
  useNodesState, 
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { EntityNode } from './EntityNode';
import { EntitySidebar } from './EntitySidebar';
import { EntityTypes } from '@/types/entity';
import { useNavigate } from 'react-router-dom';
import { getAllEntities } from '@/data/mockData';

const nodeTypes = {
  entity: EntityNode,
};

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

export const EntityCanvas: React.FC = () => {
  const navigate = useNavigate();
  
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

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Navigate to cap table for this entity
    navigate(`/cap-table?entityId=${node.id}`);
  }, [navigate]);

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

  return (
    <div className="h-full flex">
      <div className="w-64 bg-white border-r border-gray-200">
        <EntitySidebar onCreateEntity={createEntity} />
      </div>
      
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
          <p className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> Double-click an entity to view its cap table
          </p>
        </div>
        
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50"
          >
            <Controls />
            <MiniMap 
              nodeStrokeColor="#3b82f6"
              nodeColor="#dbeafe"
              nodeBorderRadius={8}
            />
            <Background color="#e5e7eb" gap={20} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {sidebarOpen && selectedNode && (
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Entity Details</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate(`/cap-table?entityId=${selectedNode.id}`)}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                View Cap Table
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity Name
              </label>
              <input
                type="text"
                value={String(selectedNode.data.name || '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={(e) => {
                  const updatedNodes = nodes.map((node) =>
                    node.id === selectedNode.id
                      ? { ...node, data: { ...node.data, name: e.target.value } }
                      : node
                  );
                  setNodes(updatedNodes);
                  setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, name: e.target.value } });
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity Type
              </label>
              <select
                value={String(selectedNode.data.type || '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={(e) => {
                  const updatedNodes = nodes.map((node) =>
                    node.id === selectedNode.id
                      ? { ...node, data: { ...node.data, type: e.target.value } }
                      : node
                  );
                  setNodes(updatedNodes);
                  setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, type: e.target.value } });
                }}
              >
                <option value="Corporation">Corporation</option>
                <option value="LLC">LLC</option>
                <option value="Partnership">Partnership</option>
                <option value="Trust">Trust</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jurisdiction
              </label>
              <select
                value={String(selectedNode.data.jurisdiction || '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={(e) => {
                  const updatedNodes = nodes.map((node) =>
                    node.id === selectedNode.id
                      ? { ...node, data: { ...node.data, jurisdiction: e.target.value } }
                      : node
                  );
                  setNodes(updatedNodes);
                  setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, jurisdiction: e.target.value } });
                }}
              >
                <option value="Delaware">Delaware</option>
                <option value="California">California</option>
                <option value="New York">New York</option>
                <option value="Nevada">Nevada</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
