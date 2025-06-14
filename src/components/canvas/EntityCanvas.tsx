
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

const nodeTypes = {
  entity: EntityNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'entity',
    position: { x: 250, y: 100 },
    data: {
      name: 'Parent Corporation',
      type: 'Corporation',
      jurisdiction: 'Delaware',
      ownership: 100,
    },
  },
  {
    id: '2',
    type: 'entity',
    position: { x: 100, y: 300 },
    data: {
      name: 'Subsidiary LLC',
      type: 'LLC',
      jurisdiction: 'California',
      ownership: 85,
    },
  },
  {
    id: '3',
    type: 'entity',
    position: { x: 400, y: 300 },
    data: {
      name: 'Tech Holdings Inc',
      type: 'Corporation',
      jurisdiction: 'Delaware',
      ownership: 100,
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    label: '85%',
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    labelStyle: { fill: '#3b82f6', fontWeight: 600 },
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    label: '100%',
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    labelStyle: { fill: '#3b82f6', fontWeight: 600 },
  },
];

export const EntityCanvas: React.FC = () => {
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

  return (
    <div className="h-full flex">
      <div className="w-64 bg-white border-r border-gray-200">
        <EntitySidebar onCreateEntity={createEntity} />
      </div>
      
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
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
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity Name
              </label>
              <input
                type="text"
                value={selectedNode.data.name}
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
                value={selectedNode.data.type}
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
                value={selectedNode.data.jurisdiction}
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
                <option value="Texas">Texas</option>
                <option value="Nevada">Nevada</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
