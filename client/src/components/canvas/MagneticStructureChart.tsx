import React, { useCallback, useEffect, useState, useRef } from 'react';
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
  NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Building2, Shield, Users, Briefcase, User } from 'lucide-react';
import { getUnifiedRepository } from '@/services/repositories/unified';
import { BumpConnectSystem } from './BumpConnectSystem';
import { OwnershipPercentageModal } from './OwnershipPercentageModal';

// Enhanced entity node with magnetic field visualization
interface EntityNodeData {
  name: string;
  type: string;
  jurisdiction: string;
  isMagnetic?: boolean;
  magneticStrength?: number;
}

interface EntityNodeProps {
  data: EntityNodeData;
  selected?: boolean;
}

const MagneticEntityNode: React.FC<EntityNodeProps> = ({ data, selected }) => {
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

  const magneticGlow = data.isMagnetic ? 'shadow-2xl shadow-blue-400/50' : 'shadow-lg';
  const magneticBorder = data.isMagnetic ? 'border-blue-400 border-4' : 'border-gray-200 border-2';
  const magneticScale = data.isMagnetic ? 'transform scale-105' : '';

  return (
    <div
      className={`px-4 py-3 rounded-lg bg-white min-w-[180px] transition-all duration-300 ${magneticGlow} ${magneticBorder} ${magneticScale} ${
        selected ? 'border-blue-500' : ''
      }`}
    >
      {/* Magnetic field visualization */}
      {data.isMagnetic && (
        <div className="absolute -inset-4 bg-blue-400/20 rounded-full pointer-events-none animate-ping" />
      )}
      {data.isMagnetic && (
        <div className="absolute -inset-2 bg-blue-400/30 rounded-full pointer-events-none animate-pulse" />
      )}
      
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 transition-all duration-200 ${
          data.isMagnetic ? '!bg-blue-500 !w-4 !h-4 shadow-lg shadow-blue-400/50' : '!bg-blue-500'
        }`}
      />
      
      <div className="flex items-center space-x-3 relative z-10">
        {getIcon()}
        <div>
          <div className="font-semibold text-gray-900 text-sm">{data.name}</div>
          <div className="text-xs text-gray-500">{data.type}</div>
          <div className="text-xs text-gray-400">{data.jurisdiction}</div>
          {data.isMagnetic && (
            <div className="text-xs text-blue-500 font-medium">⚡ Magnetic</div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 transition-all duration-200 ${
          data.isMagnetic ? '!bg-green-500 !w-4 !h-4 shadow-lg shadow-green-400/50' : '!bg-green-500'
        }`}
      />
    </div>
  );
};

const nodeTypes = {
  entity: MagneticEntityNode as any,
};

// Enhanced edge with magnetic connection animation
const createMagneticEdge = (connection: Connection, percentage: string): Edge => ({
  id: `${connection.source}-${connection.target}`,
  source: connection.source!,
  target: connection.target!,
  type: 'default',
  label: percentage,
  animated: true,
  style: {
    stroke: '#3b82f6',
    strokeWidth: 2,
    filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.4))',
  },
});

// Magnetic field detection system
class MagneticFieldDetector {
  private magneticNodes: Set<string> = new Set();
  private magneticConnections: Map<string, string[]> = new Map();

  activateNode(nodeId: string) {
    this.magneticNodes.add(nodeId);
    console.log('🧲 Magnetic field activated for node:', nodeId);
  }

  deactivateNode(nodeId: string) {
    this.magneticNodes.delete(nodeId);
    console.log('🔌 Magnetic field deactivated for node:', nodeId);
  }

  isNodeMagnetic(nodeId: string): boolean {
    return this.magneticNodes.has(nodeId);
  }

  findNearbyNodes(currentNode: string, allNodes: Node[], maxDistance: number = 200): string[] {
    const current = allNodes.find(n => n.id === currentNode);
    if (!current) return [];

    return allNodes
      .filter(node => {
        if (node.id === currentNode) return false;
        const distance = Math.sqrt(
          Math.pow(node.position.x - current.position.x, 2) +
          Math.pow(node.position.y - current.position.y, 2)
        );
        return distance <= maxDistance;
      })
      .map(node => node.id);
  }

  getMagneticConnections(nodeId: string): string[] {
    return this.magneticConnections.get(nodeId) || [];
  }

  setMagneticConnections(nodeId: string, connections: string[]) {
    this.magneticConnections.set(nodeId, connections);
  }
}

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
      isMagnetic: false,
      magneticStrength: 0,
    },
  }));
};

const ownershipsToEdges = (ownerships: any[], entities: any[], shareClasses: any[]): Edge[] => {
  return ownerships.map((ownership) => {
    const shareClass = shareClasses.find(sc => sc.id === ownership.shareClassId);
    
    let percentage = '10.0%';
    if (shareClass && shareClass.totalAuthorizedShares > 0) {
      const percent = (ownership.shares / shareClass.totalAuthorizedShares) * 100;
      percentage = `${percent.toFixed(1)}%`;
    }

    return {
      id: ownership.id,
      source: ownership.ownerEntityId,
      target: ownership.ownedEntityId,
      type: 'default',
      label: percentage,
      style: {
        stroke: '#6b7280',
        strokeWidth: 1.5,
      },
    };
  });
};

// Main magnetic structure chart component
const MagneticStructureChartInner: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  const [loading, setLoading] = useState(true);
  
  const magneticDetector = useRef(new MagneticFieldDetector());
  const draggedNodeRef = useRef<string | null>(null);

  // Load repository data
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Loading unified repository data for magnetic system...');
        const repository = await getUnifiedRepository('ENTERPRISE');
        
        const entities = await repository.getAllEntities();
        console.log('📊 Loaded entities:', entities?.length || 0);
        
        // Get all share classes
        const allShareClasses = [];
        for (const entity of entities || []) {
          try {
            const entityShareClasses = await repository.getShareClassesByEntity(entity.id);
            allShareClasses.push(...(entityShareClasses || []));
          } catch (err) {
            console.log('⚠️ Error loading share classes for entity:', entity.id);
          }
        }
        console.log('📊 Loaded share classes:', allShareClasses.length);
        
        // Get ownerships
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
        const flowEdges = ownershipsToEdges(allOwnerships, entities || [], allShareClasses);
        
        setNodes(flowNodes);
        setEdges(flowEdges);
        setLoading(false);
        
        console.log('✅ Magnetic system initialized with repository data');
      } catch (error) {
        console.error('❌ Repository loading failed:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Magnetic node interaction handlers
  const onNodeMouseEnter: NodeMouseHandler = useCallback((event, node) => {
    // Activate magnetic field
    magneticDetector.current.activateNode(node.id);
    
    // Find nearby nodes for magnetic attraction
    const nearbyNodes = magneticDetector.current.findNearbyNodes(node.id, nodes);
    
    // Update node states to show magnetic fields
    setNodes((nodes) =>
      nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isMagnetic: n.id === node.id || nearbyNodes.includes(n.id),
          magneticStrength: n.id === node.id ? 100 : nearbyNodes.includes(n.id) ? 50 : 0,
        },
      }))
    );

    console.log('🧲 Magnetic field activated around:', node.data.name);
  }, [nodes, setNodes]);

  const onNodeMouseLeave: NodeMouseHandler = useCallback((event, node) => {
    // Only deactivate if not dragging
    if (!draggedNodeRef.current) {
      magneticDetector.current.deactivateNode(node.id);
      
      // Reset magnetic fields
      setNodes((nodes) =>
        nodes.map((n) => ({
          ...n,
          data: {
            ...n.data,
            isMagnetic: false,
            magneticStrength: 0,
          },
        }))
      );

      console.log('🔌 Magnetic field deactivated');
    }
  }, [setNodes]);

  const onNodeDragStart: NodeMouseHandler = useCallback((event, node) => {
    draggedNodeRef.current = node.id;
    magneticDetector.current.activateNode(node.id);
    console.log('🎯 Started dragging node:', node.data.name);
  }, []);

  const onNodeDragStop: NodeMouseHandler = useCallback((event, node) => {
    draggedNodeRef.current = null;
    magneticDetector.current.deactivateNode(node.id);
    
    // Reset magnetic fields after drag
    setNodes((nodes) =>
      nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isMagnetic: false,
          magneticStrength: 0,
        },
      }))
    );

    console.log('🎯 Stopped dragging node:', node.data.name);
  }, [setNodes]);

  const onConnect = useCallback(
    async (params: Connection) => {
      console.log('🔗 Creating magnetic ownership connection:', params);
      
      // Add visual edge immediately for instant feedback
      const magneticEdge = createMagneticEdge(params, '10.0%');
      setEdges((eds) => addEdge(magneticEdge, eds));
      console.log('⚡ Magnetic connection established visually');
      
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

        console.log('✅ Repository ownership connection created');
      } catch (error) {
        console.log('⚠️ Repository creation failed, visual connection maintained:', error);
      }
    },
    [setEdges]
  );

  if (loading) {
    return (
      <div className="w-full h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Initializing magnetic field system...</div>
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
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
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
export const MagneticStructureChart: React.FC = () => {
  return (
    <ReactFlowProvider>
      <MagneticStructureChartInner />
    </ReactFlowProvider>
  );
};

export default MagneticStructureChart;