
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
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
import { OwnershipPercentageModal } from './OwnershipPercentageModal';

interface EntityNodeData {
  name: string;
  type: string;
  jurisdiction: string;
  isMagnetic?: boolean;
}

interface EntityNodeProps {
  data: EntityNodeData;
  selected?: boolean;
}

interface DetectionZone {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  distance: number;
  level: 'outer' | 'middle' | 'inner';
  sourceHandle: 'top' | 'bottom';
  targetHandle: 'top' | 'bottom';
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

  const magneticGlow = data.isMagnetic 
    ? 'shadow-2xl shadow-blue-400/50' 
    : 'shadow-lg';
  
  const magneticBorder = data.isMagnetic 
    ? 'border-2 border-blue-400' 
    : 'border border-gray-300';
    
  const magneticScale = data.isMagnetic 
    ? 'scale-105' 
    : 'scale-100';

  return (
    <div
      className={`px-4 py-3 rounded-lg bg-white min-w-[180px] transition-all duration-300 ${magneticGlow} ${magneticBorder} ${magneticScale} ${
        selected ? 'border-blue-500' : ''
      }`}
    >
      {/* Magnetic field visualization */}
      {data.isMagnetic && (
        <>
          <div className="absolute -inset-4 bg-blue-400/20 rounded-full pointer-events-none animate-ping" />
          <div className="absolute -inset-2 bg-blue-400/30 rounded-full pointer-events-none animate-pulse" />
        </>
      )}
      
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500 border-2 border-white" />
      
      <div className="flex items-center space-x-3">
        {getIcon()}
        <div>
          <div className="font-medium text-gray-900">{data.name}</div>
          <div className="text-sm text-gray-500">{data.jurisdiction}</div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-2 border-white" />
    </div>
  );
};

const nodeTypes: any = {
  entity: MagneticEntityNode,
};

export default function BumpConnect() {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [loading, setLoading] = useState(true);
  const [draggingNode, setDraggingNode] = useState<Node | null>(null);
  const [detectionZones, setDetectionZones] = useState<DetectionZone[]>([]);
  const [pendingConnections, setPendingConnections] = useState<Set<string>>(new Set());
  
  // Percentage modal state
  const [showPercentageModal, setShowPercentageModal] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<{
    source: string;
    target: string;
    defaultPercentage: number;
    sourceEntity: any;
    targetEntity: any;
  } | null>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🚀 Loading Bump Connect data...');
        const repository = await getUnifiedRepository('ENTERPRISE');
        
        const entities = await repository.getAllEntities();
        console.log('📊 Loaded entities:', entities?.length || 0);
        
        // Get ownerships
        const allOwnerships = [];
        for (const entity of entities || []) {
          try {
            const entityOwnerships = await repository.getOwnershipsByEntity(entity.id);
            allOwnerships.push(...(entityOwnerships || []));
          } catch (err) {
            console.log('Error loading ownerships for entity:', entity.id);
          }
        }
        console.log('📊 Loaded ownerships:', allOwnerships.length);
        
        // Convert to ReactFlow format
        const flowNodes = (entities || []).map((entity, index) => ({
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
          },
        }));

        const flowEdges = allOwnerships.map((ownership) => ({
          id: `ownership-${ownership.id}`,
          source: ownership.ownerEntityId,
          target: ownership.ownedEntityId,
          type: 'default',
          style: { strokeWidth: 2, stroke: '#3b82f6' },
          label: '50%', // Default for existing connections
          labelStyle: { fontSize: 12, fontWeight: 'bold' },
          labelBgStyle: { fill: '#ffffff', fillOpacity: 0.8 },
        }));
        
        setNodes(flowNodes);
        setEdges(flowEdges);
        setLoading(false);
        
        console.log('✅ Bump Connect system initialized');
      } catch (error) {
        console.error('❌ Bump Connect loading failed:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate distance between two points
  const getDistance = (pos1: { x: number; y: number }, pos2: { x: number; y: number }): number => {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
  };

  // Get handle positions for a node
  const getHandlePositions = (node: Node) => {
    return {
      top: { x: node.position.x + 90, y: node.position.y },
      bottom: { x: node.position.x + 90, y: node.position.y + 80 }
    };
  };

  // Update detection zones during drag
  const updateDetectionZones = useCallback((draggedNode: Node) => {
    if (!draggedNode) {
      setDetectionZones([]);
      return;
    }

    const seekerHandles = getHandlePositions(draggedNode);
    const newZones: DetectionZone[] = [];

    nodes.forEach(targetNode => {
      if (targetNode.id === draggedNode.id) return;

      const targetHandles = getHandlePositions(targetNode);

      // Check Seeker TH → Target BH (ownership flows down)
      const thToBhDistance = getDistance(seekerHandles.top, targetHandles.bottom);
      if (thToBhDistance <= 90) {
        const level = thToBhDistance <= 30 ? 'inner' : thToBhDistance <= 60 ? 'middle' : 'outer';
        newZones.push({
          id: `zone-${draggedNode.id}-th-${targetNode.id}-bh`,
          sourceNodeId: draggedNode.id,
          targetNodeId: targetNode.id,
          distance: thToBhDistance,
          level,
          sourceHandle: 'top',
          targetHandle: 'bottom'
        });
      }

      // Check Seeker BH → Target TH (ownership flows up)
      const bhToThDistance = getDistance(seekerHandles.bottom, targetHandles.top);
      if (bhToThDistance <= 90) {
        const level = bhToThDistance <= 30 ? 'inner' : bhToThDistance <= 60 ? 'middle' : 'outer';
        newZones.push({
          id: `zone-${draggedNode.id}-bh-${targetNode.id}-th`,
          sourceNodeId: draggedNode.id,
          targetNodeId: targetNode.id,
          distance: bhToThDistance,
          level,
          sourceHandle: 'bottom',
          targetHandle: 'top'
        });
      }
    });

    setDetectionZones(newZones);

    // Handle auto-connections in inner zones
    const innerZones = newZones.filter(zone => zone.level === 'inner');
    innerZones.forEach(zone => {
      const connectionKey = `${zone.sourceNodeId}-${zone.targetNodeId}`;
      if (!pendingConnections.has(connectionKey)) {
        console.log('🧲 Auto-connecting:', zone.sourceNodeId, '→', zone.targetNodeId);
        
        // Create magnetic edge immediately
        const magneticEdgeId = `magnetic-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const magneticEdge: Edge = {
          id: magneticEdgeId,
          source: zone.sourceNodeId,
          target: zone.targetNodeId,
          type: 'default',
          style: { strokeWidth: 3, stroke: '#10b981', strokeDasharray: '5,5' },
          label: '50%',
          labelStyle: { fontSize: 12, fontWeight: 'bold', color: '#10b981' },
          labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
        };
        
        setEdges(eds => addEdge(magneticEdge, eds));
        setPendingConnections(prev => new Set([...prev, connectionKey]));
        
        // Store for percentage modal
        const sourceNode = nodes.find(n => n.id === zone.sourceNodeId);
        const targetNode = nodes.find(n => n.id === zone.targetNodeId);
        
        if (sourceNode && targetNode) {
          setPendingConnection({
            source: zone.sourceNodeId,
            target: zone.targetNodeId,
            defaultPercentage: 50,
            sourceEntity: sourceNode,
            targetEntity: targetNode
          });
        }
      }
    });
  }, [nodes, pendingConnections, setEdges]);

  // Handle drag start
  const onNodeDragStart: NodeMouseHandler = useCallback((event, node) => {
    console.log('🧲 Magnetic field activated around:', node.data.name);
    setDraggingNode(node);
    
    // Activate magnetic field
    setNodes(nodes =>
      nodes.map(n => ({
        ...n,
        data: {
          ...n.data,
          isMagnetic: n.id === node.id,
        },
      }))
    );
  }, [setNodes]);

  // Handle drag
  const onNodeDrag: NodeMouseHandler = useCallback((event, node) => {
    if (draggingNode && draggingNode.id === node.id) {
      updateDetectionZones(node);
    }
  }, [draggingNode, updateDetectionZones]);

  // Handle drag stop
  const onNodeDragStop: NodeMouseHandler = useCallback((event, node) => {
    console.log('🔌 Magnetic field deactivated');
    setDraggingNode(null);
    setDetectionZones([]);
    
    // Show percentage modal if there's a pending connection
    if (pendingConnection) {
      setShowPercentageModal(true);
    }
    
    // Reset magnetic fields
    setNodes(nodes =>
      nodes.map(n => ({
        ...n,
        data: {
          ...n.data,
          isMagnetic: false,
        },
      }))
    );
  }, [setNodes, pendingConnection]);

  // Handle percentage modal confirmation
  const handlePercentageConfirm = useCallback(async (percentage: number) => {
    if (!pendingConnection) return;

    try {
      const repository = await getUnifiedRepository('ENTERPRISE');
      
      // Get or create share class for target entity
      let shareClasses = await repository.getShareClassesByEntity(pendingConnection.target);
      let shareClassId = shareClasses?.length > 0 ? shareClasses[0].id : null;

      if (!shareClassId) {
        const shareClass = await repository.createShareClass({
          entityId: pendingConnection.target,
          name: 'Common Stock',
          type: 'Common Stock' as const,
          totalAuthorizedShares: 10000,
          votingRights: true
        }, 'user');
        shareClassId = shareClass.id;
      }

      // Calculate shares based on percentage
      const shares = Math.round((percentage / 100) * 10000);

      // Create ownership relationship
      await repository.createOwnership({
        ownerEntityId: pendingConnection.source,
        ownedEntityId: pendingConnection.target,
        shares: shares,
        shareClassId: shareClassId!,
        effectiveDate: new Date(),
        createdBy: 'user',
        updatedBy: 'user'
      }, 'user');

      // Update edge to solid with final percentage
      setEdges(edges => 
        edges.map(edge => {
          if (edge.source === pendingConnection.source && 
              edge.target === pendingConnection.target && 
              edge.style?.strokeDasharray) {
            return {
              ...edge,
              id: `ownership-${pendingConnection.source}-${pendingConnection.target}-${Date.now()}`,
              style: { strokeWidth: 3, stroke: '#10b981' },
              label: `${percentage}%`,
            };
          }
          return edge;
        })
      );

      console.log('✅ Ownership relationship created:', percentage + '%');
    } catch (error) {
      console.error('❌ Failed to create ownership relationship:', error);
    }

    // Reset states
    const connectionKey = `${pendingConnection.source}-${pendingConnection.target}`;
    setPendingConnections(prev => {
      const newSet = new Set(prev);
      newSet.delete(connectionKey);
      return newSet;
    });
    setPendingConnection(null);
  }, [pendingConnection, setEdges]);

  const handlePercentageCancel = useCallback(() => {
    if (pendingConnection) {
      // Remove the dotted edge
      setEdges(edges => 
        edges.filter(edge => 
          !(edge.source === pendingConnection.source && 
            edge.target === pendingConnection.target && 
            edge.style?.strokeDasharray)
        )
      );
      
      // Reset states
      const connectionKey = `${pendingConnection.source}-${pendingConnection.target}`;
      setPendingConnections(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectionKey);
        return newSet;
      });
    }
    setPendingConnection(null);
  }, [pendingConnection, setEdges]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-lg font-medium">🚀 Loading Bump Connect system...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          fitView
          className="bg-gray-50"
        >
          <Controls />
          <Background gap={20} size={1} color="#e5e7eb" />
          
          {/* Detection Zones Visualization */}
          {draggingNode && detectionZones.length > 0 && (
            <div className="absolute inset-0 pointer-events-none z-10">
              {detectionZones.map(zone => {
                const seekerHandles = getHandlePositions(draggingNode);
                const handlePos = zone.sourceHandle === 'top' ? seekerHandles.top : seekerHandles.bottom;
                
                const radius = zone.level === 'inner' ? 30 : zone.level === 'middle' ? 60 : 90;
                const color = zone.sourceHandle === 'top' ? 'orange' : 'purple';
                const intensity = zone.level === 'inner' ? '500' : zone.level === 'middle' ? '400' : '300';
                
                return (
                  <div
                    key={zone.id}
                    className={`absolute rounded-full border-2 border-${color}-${intensity} bg-${color}-200/30 ${
                      zone.level === 'inner' ? 'animate-bounce' : 'animate-pulse'
                    }`}
                    style={{
                      left: handlePos.x - radius,
                      top: handlePos.y - radius,
                      width: radius * 2,
                      height: radius * 2,
                      zIndex: zone.level === 'inner' ? 30 : zone.level === 'middle' ? 20 : 10
                    }}
                  >
                    {zone.level === 'inner' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white text-xs font-bold bg-green-500 px-2 py-1 rounded shadow-lg">
                          🧲 CONNECT
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ReactFlow>
      </ReactFlowProvider>

      {/* Status Display */}
      {draggingNode && (
        <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg z-50">
          <div className="font-semibold text-gray-800">
            🎯 Seeker: {draggingNode.data.name}
          </div>
          <div className="text-sm text-gray-600">
            Active Zones: {detectionZones.length}
          </div>
          <div className="text-sm text-green-600">
            Ready to Connect: {detectionZones.filter(z => z.level === 'inner').length}
          </div>
        </div>
      )}

      {/* Ownership Percentage Modal */}
      {showPercentageModal && pendingConnection && (
        <OwnershipPercentageModal
          isOpen={showPercentageModal}
          onClose={() => {
            setShowPercentageModal(false);
            handlePercentageCancel();
          }}
          onConfirm={handlePercentageConfirm}
          defaultPercentage={pendingConnection.defaultPercentage}
          sourceEntityName={pendingConnection.sourceEntity.data.name}
          targetEntityName={pendingConnection.targetEntity.data.name}
        />
      )}
    </div>
  );
}
