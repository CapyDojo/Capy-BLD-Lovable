import React, { useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Building2, Shield, Users, Briefcase, User } from 'lucide-react';

// Clean entity node component with proper typing
interface EntityNodeData {
  name: string;
  type: string;
  jurisdiction: string;
}

interface EntityNodeProps {
  data: EntityNodeData;
  selected?: boolean;
}

const CleanEntityNode: React.FC<EntityNodeProps> = ({ data, selected }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'Corporation': return Building2;
      case 'LLC': return Shield;
      case 'Partnership': return Users;
      case 'Trust': return Briefcase;
      case 'Individual': return User;
      default: return Building2;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'Corporation': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'LLC': return 'bg-green-50 border-green-200 text-green-700';
      case 'Partnership': return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'Trust': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'Individual': return 'bg-gray-50 border-gray-200 text-gray-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const Icon = getIcon(data.type);
  const colorClass = getColor(data.type);

  return (
    <div className={`
      relative min-w-[200px] px-4 py-3 rounded-lg border-2 shadow-sm transition-all duration-200
      ${colorClass}
      ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      hover:shadow-md cursor-pointer
    `}>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 !bg-blue-600 !border-2 !border-white"
      />
      
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5 mt-0.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">
            {data.name}
          </h3>
          <p className="text-xs opacity-75 mt-1">
            {data.type} {data.jurisdiction !== 'Individual' ? `• ${data.jurisdiction}` : ''}
          </p>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-blue-600 !border-2 !border-white"
      />
    </div>
  );
};

const nodeTypes = {
  entity: CleanEntityNode as any,
};

// Test data with clean structure
const initialNodes: Node[] = [
  {
    id: 'sarah',
    type: 'entity',
    position: { x: 100, y: 100 },
    data: { name: 'Sarah Williams', type: 'Individual', jurisdiction: 'Individual' },
  },
  {
    id: 'mike',
    type: 'entity',
    position: { x: 300, y: 100 },
    data: { name: 'Mike Rodriguez', type: 'Individual', jurisdiction: 'Individual' },
  },
  {
    id: 'nexus',
    type: 'entity',
    position: { x: 200, y: 300 },
    data: { name: 'NexusCorp Inc', type: 'Corporation', jurisdiction: 'Delaware' },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'sarah-nexus',
    source: 'sarah',
    target: 'nexus',
    type: 'default',
    label: '44.4%',
  },
];

// Main clean structure chart component
const CleanStructureChartInner: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      console.log('🔗 Clean edge connection:', params);
      const newEdge = {
        ...params,
        type: 'default',
        label: '100%',
      };
      setEdges((eds) => addEdge(newEdge, eds));
      console.log('✅ Edge created immediately');
    },
    [setEdges]
  );

  return (
    <div className="w-full h-screen bg-gray-50">
      <div className="h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
};

export const CleanStructureChart: React.FC = () => {
  return (
    <ReactFlowProvider>
      <CleanStructureChartInner />
    </ReactFlowProvider>
  );
};