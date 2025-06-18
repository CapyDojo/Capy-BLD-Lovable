import React, { useCallback, useEffect, useState } from 'react';
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
import { getUnifiedRepository } from '@/services/repositories/unified';

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
  const getIcon = () => {
    switch (data.type) {
      case 'Corporation':
        return <Building2 className="w-5 h-5 text-blue-600" />;
      case 'LLC':
        return <Shield className="w-5 h-5 text-green-600" />;
      case 'Partnership':
        return <Users className="w-5 h-5 text-purple-600" />;
      case 'Trust':
        return <Briefcase className="w-5 h-5 text-orange-600" />;
      case 'Individual':
        return <User className="w-5 h-5 text-gray-600" />;
      default:
        return <Building2 className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 ${
        selected ? 'border-blue-500' : 'border-gray-200'
      } min-w-[180px]`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500"
      />
      
      <div className="flex items-center space-x-3">
        {getIcon()}
        <div>
          <div className="font-semibold text-gray-900 text-sm">{data.name}</div>
          <div className="text-xs text-gray-500">{data.type}</div>
          <div className="text-xs text-gray-400">{data.jurisdiction}</div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-green-500"
      />
    </div>
  );
};

const nodeTypes = {
  entity: CleanEntityNode as any,
};

// Helper functions
const entitiesToNodes = (entities: any[]): Node[] => {
  return entities.map((entity, index) => ({
    id: entity.id,
    type: 'entity',
    position: entity.position || { 
      x: 100 + (index % 3) * 300, 
      y: 100 + Math.floor(index / 3) * 200 
    },
    data: {
      name: entity.name,
      type: entity.type,
      jurisdiction: entity.jurisdiction || entity.type,
    },
  }));
};

const ownershipsToEdges = (ownerships: any[]): Edge[] => {
  return ownerships.map((ownership) => ({
    id: ownership.id,
    source: ownership.ownerEntityId,
    target: ownership.ownedEntityId,
    type: 'default',
    label: `${(ownership.shares / 10).toFixed(1)}%`,
  }));
};

// Main component
const CleanStructureChartInner: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  const [loading, setLoading] = useState(true);

  // Load repository data
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Loading unified repository data...');
        const repository = await getUnifiedRepository('ENTERPRISE');
        
        const entities = await repository.getAllEntities();
        console.log('📊 Loaded entities:', entities?.length || 0);
        
        // Get ownerships for each entity
        const allOwnerships = [];
        for (const entity of entities || []) {
          try {
            const entityOwnerships = await repository.getOwnershipsByEntity(entity.id);
            allOwnerships.push(...(entityOwnerships || []));
          } catch (err) {
            console.log('⚠️ Error loading ownerships for entity:', entity.id);
          }
        }
        console.log('📊 Loaded ownerships:', allOwnerships.length);
        
        // Convert to ReactFlow format
        const flowNodes = entitiesToNodes(entities || []);
        const flowEdges = ownershipsToEdges(allOwnerships);
        
        setNodes(flowNodes);
        setEdges(flowEdges);
        setLoading(false);
        
        console.log('✅ Repository integration complete');
      } catch (error) {
        console.error('❌ Repository loading failed:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const onConnect = useCallback(
    async (params: Connection) => {
      console.log('🔗 Creating ownership:', params);
      
      try {
        const repository = await getUnifiedRepository('ENTERPRISE');
        
        // Get or create share class for target entity
        let shareClasses = await repository.getShareClassesByEntity(params.target!);
        let shareClassId = shareClasses?.length > 0 ? shareClasses[0].id : null;

        if (!shareClassId) {
          const shareClass = await repository.createShareClass({
            entityId: params.target!,
            name: 'Common Stock',
            type: 'Common Stock' as const,
            totalAuthorizedShares: 10000,
            votingRights: true
          }, 'user');
          shareClassId = shareClass.id;
        }

        // Create ownership relationship
        await repository.createOwnership({
          ownerEntityId: params.source!,
          ownedEntityId: params.target!,
          shares: 1000,
          shareClassId: shareClassId!,
          effectiveDate: new Date(),
          createdBy: 'user',
          updatedBy: 'user'
        }, 'user');

        console.log('✅ Ownership created successfully');
      } catch (error) {
        console.log('⚠️ Ownership creation failed, adding visual edge:', error);
      }

      // Always add visual edge for immediate feedback
      const newEdge = {
        ...params,
        type: 'default',
        label: '10.0%',
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  if (loading) {
    return (
      <div className="w-full h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading repository data...</div>
      </div>
    );
  }

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
          fitViewOptions={{
            padding: 0.2,
          }}
        >
          <Controls />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
};

// Wrapped component with ReactFlowProvider
export const CleanStructureChart: React.FC = () => {
  return (
    <ReactFlowProvider>
      <CleanStructureChartInner />
    </ReactFlowProvider>
  );
};

export default CleanStructureChart;