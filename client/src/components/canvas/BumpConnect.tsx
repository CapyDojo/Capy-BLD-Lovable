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
  level: 'outer' | 'middle' | 'inner';
  radius: number;
  color: string;
  animation: string;
}

const DETECTION_ZONES: DetectionZone[] = [
  { level: 'outer', radius: 90, color: 'orange', animation: 'animate-pulse' },
  { level: 'middle', radius: 60, color: 'amber', animation: 'animate-pulse' },
  { level: 'inner', radius: 30, color: 'green', animation: 'animate-bounce' }
];

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
      {/* Magnetic field visualization when awakened */}
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

const nodeTypes = {
  entity: MagneticEntityNode,
};

export default function BumpConnect() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [draggingNode, setDraggingNode] = useState<Node | null>(null);
  const [detectionZones, setDetectionZones] = useState<Map<string, DetectionZone>>(new Map());
  
  // Percentage modal state
  const [showPercentageModal, setShowPercentageModal] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<{
    source: string;
    target: string;
    defaultPercentage: number;
    sourceEntity: any;
    targetEntity: any;
  } | null>(null);

  // Load data from unified repository
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading repository data for Bump Connect system...');
        const repository = await getUnifiedRepository('ENTERPRISE');
        
        const entities = await repository.getAllEntities();
        console.log('Loaded entities:', entities?.length || 0);
        
        // Get all share classes
        const allShareClasses = [];
        for (const entity of entities || []) {
          try {
            const entityShareClasses = await repository.getShareClassesByEntity(entity.id);
            allShareClasses.push(...(entityShareClasses || []));
          } catch (err) {
            console.log('Error loading share classes for entity:', entity.id);
          }
        }
        console.log('Loaded share classes:', allShareClasses.length);
        
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
        console.log('Loaded ownerships:', allOwnerships.length);
        
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

        const flowEdges = allOwnerships.map((ownership) => {
          const shareClass = allShareClasses.find(sc => sc.id === ownership.shareClassId);
          
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
            style: { strokeWidth: 2, stroke: '#3b82f6' },
            label: percentage,
            labelStyle: { fontSize: 12, fontWeight: 'bold' },
            labelBgStyle: { fill: '#ffffff', fillOpacity: 0.8 },
          };
        });
        
        setNodes(flowNodes);
        setEdges(flowEdges);
        setLoading(false);
        
        console.log('Bump Connect system initialized');
      } catch (error) {
        console.error('Repository loading failed:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate distance between two points
  const getDistance = (pos1: { x: number; y: number }, pos2: { x: number; y: number }): number => {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
  };

  // Get handle positions
  const getHandlePositions = (node: Node) => {
    return {
      top: { x: node.position.x + 90, y: node.position.y },
      bottom: { x: node.position.x + 90, y: node.position.y + 80 }
    };
  };

  // Get detection zone based on distance
  const getDetectionZone = (distance: number): DetectionZone | null => {
    for (const zone of DETECTION_ZONES) {
      if (distance <= zone.radius) {
        return zone;
      }
    }
    return null;
  };

  // Handle auto-connect when reaching inner zone
  const handleAutoConnect = useCallback(async (sourceId: string, targetId: string) => {
    const sourceNode = nodes.find(n => n.id === sourceId);
    const targetNode = nodes.find(n => n.id === targetId);
    
    if (!sourceNode || !targetNode) return;

    // Create dotted edge immediately
    const magneticEdge: Edge = {
      id: `magnetic-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      source: sourceId,
      target: targetId,
      type: 'default',
      style: { strokeWidth: 3, stroke: '#10b981', strokeDasharray: '5,5' },
      label: '50%',
      labelStyle: { fontSize: 12, fontWeight: 'bold', color: '#10b981' },
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
    };
    
    setEdges((eds) => addEdge(magneticEdge, eds));
    
    // Store pending connection for percentage modal
    setPendingConnection({
      source: sourceId,
      target: targetId,
      defaultPercentage: 50,
      sourceEntity: sourceNode,
      targetEntity: targetNode
    });

    console.log('Auto-connected:', sourceNode.data.name, '→', targetNode.data.name);
  }, [nodes, setEdges]);

  // Revolutionary Bump Connect Detection System
  useEffect(() => {
    if (!draggingNode) {
      setDetectionZones(new Map());
      return;
    }

    const seekerHandles = getHandlePositions(draggingNode);
    const newDetections = new Map<string, DetectionZone>();

    nodes.forEach(targetNode => {
      if (targetNode.id === draggingNode.id) return;

      const targetHandles = getHandlePositions(targetNode);

      // Check Seeker TH → Target BH (orange connection)
      const thToBhDistance = getDistance(seekerHandles.top, targetHandles.bottom);
      const thToBhZone = getDetectionZone(thToBhDistance);
      
      if (thToBhZone) {
        const detectionKey = `${draggingNode.id}-TH-${targetNode.id}-BH`;
        newDetections.set(detectionKey, thToBhZone);

        // Auto-connect at inner zone
        if (thToBhZone.level === 'inner') {
          handleAutoConnect(draggingNode.id, targetNode.id);
        }
      }

      // Check Seeker BH → Target TH (purple connection)
      const bhToThDistance = getDistance(seekerHandles.bottom, targetHandles.top);
      const bhToThZone = getDetectionZone(bhToThDistance);
      
      if (bhToThZone) {
        const detectionKey = `${draggingNode.id}-BH-${targetNode.id}-TH`;
        newDetections.set(detectionKey, bhToThZone);

        // Auto-connect at inner zone
        if (bhToThZone.level === 'inner') {
          handleAutoConnect(draggingNode.id, targetNode.id);
        }
      }
    });

    setDetectionZones(newDetections);
  }, [draggingNode, nodes, handleAutoConnect]);

  // Handle drag events
  const onNodeDragStart: NodeMouseHandler = useCallback((event, node) => {
    setDraggingNode(node);
    
    // Activate magnetic field (step 1: Initial hover effect)
    setNodes((nodes) =>
      nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isMagnetic: n.id === node.id,
        },
      }))
    );

    console.log('Started dragging node (Seeker activated):', node.data.name);
  }, [setNodes]);

  const onNodeDragStop: NodeMouseHandler = useCallback((event, node) => {
    setDraggingNode(null);
    
    // Show percentage modal if there's a pending connection (step 3)
    if (pendingConnection) {
      setShowPercentageModal(true);
    }
    
    // Reset magnetic fields
    setNodes((nodes) =>
      nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isMagnetic: false,
        },
      }))
    );

    console.log('Stopped dragging node:', node.data.name);
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

      // Update edge to solid with final percentage (step 3A & 3B)
      setEdges((edges) => 
        edges.map((edge) => {
          if (edge.source === pendingConnection.source && edge.target === pendingConnection.target && edge.style?.strokeDasharray) {
            return {
              ...edge,
              style: { strokeWidth: 3, stroke: '#10b981' }, // Remove dash - make solid
              label: `${percentage}%`,
            };
          }
          return edge;
        })
      );

      console.log('Ownership relationship created:', percentage + '%');
    } catch (error) {
      console.error('Failed to create ownership relationship:', error);
    }

    setPendingConnection(null);
  }, [pendingConnection, setEdges]);

  const handlePercentageCancel = useCallback(() => {
    // Remove the dotted edge
    if (pendingConnection) {
      setEdges((edges) => 
        edges.filter((edge) => 
          !(edge.source === pendingConnection.source && 
            edge.target === pendingConnection.target && 
            edge.style?.strokeDasharray)
        )
      );
    }
    setPendingConnection(null);
  }, [pendingConnection, setEdges]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-lg font-medium">Loading revolutionary Bump Connect system...</div>
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
          onNodeDragStop={onNodeDragStop}
          fitView
          className="bg-gray-50"
        >
          <Controls />
          <Background variant="cross" gap={20} size={1} color="#e5e7eb" />
          
          {/* Revolutionary 3-Zone Detection System */}
          {draggingNode && (
            <div className="absolute inset-0 pointer-events-none z-10">
              {Array.from(detectionZones.entries()).map(([detectionKey, zone]) => {
                const [seekerInfo, targetInfo] = detectionKey.split('-').slice(1);
                const isOrangeConnection = seekerInfo === 'TH' && targetInfo.endsWith('BH');
                
                const seekerHandles = getHandlePositions(draggingNode);
                const handlePos = seekerInfo === 'TH' ? seekerHandles.top : seekerHandles.bottom;
                
                const baseColor = isOrangeConnection ? 'orange' : 'purple';
                
                return (
                  <div
                    key={detectionKey}
                    className={`absolute rounded-full border-4 border-${baseColor}-400 bg-${baseColor}-200/30 ${zone.animation}`}
                    style={{
                      left: handlePos.x - zone.radius,
                      top: handlePos.y - zone.radius,
                      width: zone.radius * 2,
                      height: zone.radius * 2,
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

      {/* Ownership Percentage Modal (Step 3B & 3C) */}
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