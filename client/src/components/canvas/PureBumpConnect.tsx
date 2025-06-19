import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, Node, Edge } from '@xyflow/react';
import { unifiedEntityService } from '../../services/UnifiedEntityService';

// Clean Entity Node for Bump Connect
const EntityNode = ({ data, selected }: any) => {
  return (
    <div className={`
      px-4 py-2 rounded-lg border-2 bg-white shadow-lg transition-all duration-200
      ${selected ? 'border-blue-500 shadow-blue-200' : 'border-gray-300'}
      ${data.isMagnetic ? 'shadow-blue-400 shadow-lg' : ''}
      hover:shadow-xl cursor-move
    `}>
      <div className="font-semibold text-gray-800">{data.name}</div>
      <div className="text-xs text-gray-500">{data.type}</div>
      {data.jurisdiction && (
        <div className="text-xs text-gray-400">{data.jurisdiction}</div>
      )}
    </div>
  );
};

// Clean proximity detection interface
interface ProximityZone {
  distance: number;
  color: string;
  opacity: number;
  size: number;
}

const PROXIMITY_ZONES: ProximityZone[] = [
  { distance: 90, color: '#ff6b35', opacity: 0.2, size: 90 },  // Orange - Awareness
  { distance: 60, color: '#8b5cf6', opacity: 0.3, size: 60 },  // Purple - Interest  
  { distance: 30, color: '#10b981', opacity: 0.4, size: 30 },  // Green - Connection
];

const nodeTypes = {
  entity: EntityNode,
};

export default function PureBumpConnect() {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [loading, setLoading] = useState(true);
  const [draggingNode, setDraggingNode] = useState<Node | null>(null);
  const [proximityZones, setProximityZones] = useState<any[]>([]);
  
  // Load data from repository
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🚀 Loading Pure Bump Connect data...');
        
        const entities = await unifiedEntityService.getAllEntities();
        const hierarchy = await unifiedEntityService.getOwnershipHierarchy();
        
        console.log(`📊 Loaded ${entities?.length || 0} entities`);
        console.log(`🔗 Loaded ${hierarchy?.length || 0} hierarchy nodes`);
        
        // Create clean nodes
        const nodeData = (entities || []).map((entity: any, index: number) => ({
          id: entity.id,
          type: 'entity',
          position: entity.position || { 
            x: (index % 3) * 250 + 50, 
            y: Math.floor(index / 3) * 150 + 50 
          },
          data: {
            name: entity.name,
            type: entity.type,
            jurisdiction: entity.jurisdiction,
            isMagnetic: false,
          }
        }));
        
        // Create clean edges from hierarchy data
        const edgeData: any[] = [];
        (hierarchy || []).forEach((node: any) => {
          if (node.ownerships && node.ownerships.length > 0) {
            node.ownerships.forEach((ownership: any) => {
              edgeData.push({
                id: `edge-${node.id}-${ownership.ownerEntityId}`,
                source: ownership.ownerEntityId,
                target: node.id,
                type: 'default',
                label: `${ownership.shares || 0}%`,
                style: { strokeWidth: 2, stroke: '#6b7280' },
                labelStyle: { fontSize: 12, fontWeight: 'bold' },
                labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
              });
            });
          }
        });
        
        setNodes(nodeData);
        setEdges(edgeData);
        setLoading(false);
        
        console.log('✅ Pure Bump Connect initialized successfully');
        
      } catch (error) {
        console.error('❌ Pure Bump Connect loading error:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Calculate distance between two points
  const calculateDistance = (pos1: any, pos2: any) => {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  // Update proximity zones during drag
  const updateProximityDetection = useCallback((draggedNode: Node) => {
    if (!draggedNode) return;
    
    const zones: any[] = [];
    
    nodes.forEach(targetNode => {
      if (targetNode.id === draggedNode.id) return;
      
      const distance = calculateDistance(draggedNode.position, targetNode.position);
      
      // Check each proximity zone
      PROXIMITY_ZONES.forEach(zone => {
        if (distance <= zone.distance) {
          zones.push({
            id: `zone-${draggedNode.id}-${targetNode.id}-${zone.distance}`,
            seekerPos: draggedNode.position,
            targetPos: targetNode.position,
            distance: distance,
            zone: zone,
            isConnectable: distance <= 30, // Green zone = ready to connect
          });
        }
      });
    });
    
    setProximityZones(zones);
    
    // Activate magnetic state for dragged node
    setNodes(currentNodes => 
      currentNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          isMagnetic: node.id === draggedNode.id
        }
      }))
    );
    
    // Log proximity detection
    if (zones.length > 0) {
      console.log(`🎯 Proximity detected: ${zones.length} zones active`);
    }
    
  }, [nodes]);
  
  // Handle drag start
  const onNodeDragStart = useCallback((event: any, node: Node) => {
    console.log(`🎯 Seeker activated: ${node.data.name}`);
    setDraggingNode(node);
  }, []);
  
  // Handle drag
  const onNodeDrag = useCallback((event: any, node: Node) => {
    if (draggingNode && draggingNode.id === node.id) {
      updateProximityDetection(node);
    }
  }, [draggingNode, updateProximityDetection]);
  
  // Handle drag stop
  const onNodeDragStop = useCallback((event: any, node: Node) => {
    console.log(`🎯 Seeker deactivated: ${node.data.name}`);
    
    // Check for automatic connections in green zone
    const connectableZones = proximityZones.filter(zone => zone.isConnectable);
    
    if (connectableZones.length > 0) {
      console.log(`🔗 Auto-connecting ${connectableZones.length} relationships`);
      
      connectableZones.forEach(zone => {
        const targetNode = nodes.find(n => 
          Math.abs(n.position.x - zone.targetPos.x) < 10 && 
          Math.abs(n.position.y - zone.targetPos.y) < 10
        );
        
        if (targetNode && targetNode.id !== node.id) {
          // Create new ownership relationship with proper edge structure
          const newEdge = {
            id: `auto-${Date.now()}-${Math.random()}`,
            source: node.id,
            target: targetNode.id,
            type: 'smoothstep',
            animated: true,
            label: '25%',
            style: { 
              strokeWidth: 3, 
              stroke: '#10b981'
            },
            labelStyle: { 
              fontSize: 12, 
              fontWeight: 'bold', 
              fill: '#10b981' 
            },
            labelBgStyle: { 
              fill: 'white', 
              fillOpacity: 0.9 
            },
          };
          
          setEdges(currentEdges => [...currentEdges, newEdge]);
          console.log(`✨ Auto-created connection: ${node.data.name} → ${targetNode.data.name}`);
        }
      });
    }
    
    // Reset states
    setDraggingNode(null);
    setProximityZones([]);
    
    // Remove magnetic state
    setNodes(currentNodes => 
      currentNodes.map(n => ({
        ...n,
        data: { ...n.data, isMagnetic: false }
      }))
    );
  }, [proximityZones, nodes]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">🚀 Loading Pure Bump Connect...</div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-screen bg-gray-50">
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
        
        {/* Revolutionary 3-Zone Proximity Detection - Fixed Positioning */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
          {proximityZones.map(zone => (
            <div
              key={zone.id}
              className="absolute"
              style={{
                left: zone.targetPos.x,
                top: zone.targetPos.y,
                width: zone.zone.size * 2,
                height: zone.zone.size * 2,
                borderRadius: '50%',
                backgroundColor: zone.zone.color,
                opacity: zone.zone.opacity,
                border: zone.isConnectable ? '4px solid #10b981' : '2px solid rgba(255,255,255,0.7)',
                transform: 'translate(-50%, -50%)',
                animation: zone.isConnectable ? 'pulse 1.5s infinite' : 'none',
                boxShadow: zone.isConnectable ? '0 0 20px rgba(16, 185, 129, 0.5)' : 'none',
              }}
            />
          ))}
        </div>
        
        {/* Connection Preview Lines */}
        {proximityZones
          .filter(zone => zone.isConnectable)
          .map(zone => (
            <svg
              key={`line-${zone.id}`}
              className="absolute pointer-events-none"
              style={{ 
                left: 0, 
                top: 0, 
                width: '100%', 
                height: '100%',
                zIndex: 5 
              }}
            >
              <line
                x1={zone.seekerPos.x}
                y1={zone.seekerPos.y}
                x2={zone.targetPos.x}
                y2={zone.targetPos.y}
                stroke="#10b981"
                strokeWidth="3"
                strokeDasharray="10,5"
                opacity="0.7"
              />
            </svg>
          ))
        }
      </ReactFlow>
      
      {/* Status Display */}
      {draggingNode && (
        <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg z-50">
          <div className="font-semibold text-gray-800">
            🎯 Seeker: {draggingNode.data.name}
          </div>
          <div className="text-sm text-gray-600">
            Active Zones: {proximityZones.length}
          </div>
          <div className="text-sm text-green-600">
            Ready to Connect: {proximityZones.filter(z => z.isConnectable).length}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>
    </div>
  );
}