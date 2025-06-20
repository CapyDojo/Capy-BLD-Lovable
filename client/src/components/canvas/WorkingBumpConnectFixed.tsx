import React, { useState, useEffect, useCallback } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  Handle,
  Position,
  Node,
  Edge,
  Connection,
  addEdge,
  ReactFlowProvider
} from '@xyflow/react';
import { unifiedEntityService } from '../../services/UnifiedEntityService';
import { EntityTypes } from '../../types/entity';

// Enhanced Entity Node with Connection Handles
const EntityNode = ({ data, selected }: any) => {
  const { isMagnetic, proximityLevel } = data;
  
  // Dynamic styling based on proximity
  const getNodeStyle = () => {
    if (proximityLevel === 'CONNECTION') {
      return 'border-green-500 bg-green-50 shadow-green-500 shadow-lg animate-pulse';
    } else if (proximityLevel === 'INTEREST') {
      return 'border-orange-500 bg-orange-50 shadow-orange-300 shadow-md animate-pulse';
    } else if (isMagnetic) {
      return 'border-blue-500 bg-blue-50 shadow-blue-300 shadow-lg';
    }
    return 'border-gray-300 bg-white';
  };

  return (
    <div className={`
      px-4 py-3 rounded-lg border-2 shadow-lg transition-all duration-300 min-w-[120px]
      ${getNodeStyle()}
      hover:shadow-xl cursor-move relative
    `}>
      {/* Connection Handles - Only vertical connections for entities */}
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      <Handle
        id="top-target"
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-red-500 border-2 border-white"
      />
      <Handle
        id="bottom-target"
        type="target"
        position={Position.Bottom}
        className="w-3 h-3 bg-red-500 border-2 border-white"
      />

      <div className="font-semibold text-gray-800 text-center">{data.name}</div>
      <div className="text-xs text-gray-500 text-center">{data.type}</div>
      {data.jurisdiction && (
        <div className="text-xs text-gray-400 text-center">{data.jurisdiction}</div>
      )}
      
      {/* Proximity Indicator */}
      {data.proximityLevel && (
        <div className="absolute -top-2 -right-2 px-2 py-1 text-xs font-bold rounded-full bg-white border shadow-sm">
          {data.proximityLevel}
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  entity: EntityNode,
};

interface WorkingBumpConnectProps {
  sensitivity?: {
    approachZone: number;
    connectionZone: number;
    dwellTime: number;
  };
}

export default function WorkingBumpConnect({ sensitivity }: WorkingBumpConnectProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [draggingNode, setDraggingNode] = useState<Node | null>(null);
  const [previousProximityStates, setPreviousProximityStates] = useState<Record<string, string | null>>({});
  const [recentEdges, setRecentEdges] = useState<string[]>([]);
  const [greenZoneTimer, setGreenZoneTimer] = useState<Record<string, NodeJS.Timeout | null>>({});
  
  // Use sensitivity from props or defaults
  const currentSensitivity = sensitivity || {
    approachZone: 280,
    connectionZone: 160,
    dwellTime: 300
  };
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading Working Bump Connect data...');
        const entities = await unifiedEntityService.getAllEntities();
        console.log(`Loaded ${entities.length} entities`);
        
        const initialNodes = entities.map((entity, index) => ({
          id: entity.id,
          type: 'entity',
          position: { 
            x: 150 + (index % 3) * 250, 
            y: 150 + Math.floor(index / 3) * 200 
          },
          data: {
            name: entity.name,
            type: entity.type,
            jurisdiction: entity.jurisdiction,
            isMagnetic: false,
            proximityLevel: null
          }
        }));
        
        setNodes(initialNodes as any);
        
        const initialEdges: any[] = [];
        setEdges(initialEdges);
        
        setLoading(false);
        console.log('Working Bump Connect initialized');
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Calculate distance between two nodes
  const calculateDistance = (node1: Node, node2: Node) => {
    const dx = node1.position.x - node2.position.x;
    const dy = node1.position.y - node2.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  // Get proximity level based on distance and current sensitivity settings
  const getProximityLevel = (distance: number) => {
    if (distance <= currentSensitivity.connectionZone) return 'CONNECTION';
    if (distance <= currentSensitivity.approachZone) return 'INTEREST';
    return null;
  };
  
  // Handle drag start
  const onNodeDragStart = useCallback((event: any, node: Node) => {
    console.log(`🎯 Seeker activated: ${node.data.name}`);
    setDraggingNode(node);
    
    // Activate magnetic state for dragging node
    setNodes((currentNodes: any) => 
      currentNodes.map((n: any) => ({
        ...n,
        data: { 
          ...n.data, 
          isMagnetic: n.id === node.id,
          proximityLevel: null
        }
      }))
    );
  }, [setNodes]);

  // Handle drag
  const onNodeDrag = useCallback((event: any, node: Node) => {
    if (!draggingNode) return;
    
    setNodes((currentNodes: any) => {
      return currentNodes.map((n: any) => {
        if (n.id === node.id) {
          return { ...n, position: node.position };
        }
        
        if (n.id !== node.id) {
          const distance = calculateDistance(node, n);
          const proximityLevel = getProximityLevel(distance);
          const previousLevel = previousProximityStates[n.id];
          
          // Handle green zone timer
          if (proximityLevel === 'CONNECTION' && previousLevel !== 'CONNECTION') {
            // Entered green zone - start timer
            const timerId = setTimeout(() => {
              console.log(`✨ Auto-connecting ${node.data.name} → ${n.data.name}`);
              
              // Create the connection
              setEdges((currentEdges: any) => {
                const newEdge = {
                  id: `edge-${node.id}-${n.id}`,
                  source: node.id,
                  target: n.id,
                  sourceHandle: node.position.y < n.position.y ? 'bottom' : 'top',
                  targetHandle: node.position.y < n.position.y ? 'top-target' : 'bottom-target',
                  type: 'default',
                  animated: true,
                  label: '25%',
                  style: { strokeWidth: 2, stroke: '#3b82f6' },
                  labelStyle: { fontSize: 12, fontWeight: 'bold', fill: '#1f2937' }
                };
                
                return [...currentEdges.filter((e: any) => e.id !== newEdge.id), newEdge];
              });
              
              setRecentEdges((prev: any) => [...prev, `edge-${node.id}-${n.id}`]);
            }, currentSensitivity.dwellTime);
            
            setGreenZoneTimer(prev => ({ ...prev, [n.id]: timerId }));
          } else if (proximityLevel !== 'CONNECTION' && greenZoneTimer[n.id]) {
            // Left green zone - clear timer
            clearTimeout(greenZoneTimer[n.id] as NodeJS.Timeout);
            setGreenZoneTimer(prev => ({ ...prev, [n.id]: null }));
          }
          
          setPreviousProximityStates(prev => ({ ...prev, [n.id]: proximityLevel }));
          
          return {
            ...n,
            data: { ...n.data, proximityLevel }
          };
        }
        
        return n;
      });
    });
  }, [draggingNode, previousProximityStates, greenZoneTimer, currentSensitivity.dwellTime, setNodes, setEdges]);

  // Handle drag stop
  const onNodeDragStop = useCallback((event: any, node: Node) => {
    console.log(`🛑 Seeker deactivated: ${node.data.name}`);
    setDraggingNode(null);
    
    // Clear all timers
    Object.values(greenZoneTimer).forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    setGreenZoneTimer({});
    
    // Deactivate all magnetic states and proximity levels
    setNodes((currentNodes: any) => 
      currentNodes.map((n: any) => ({
        ...n,
        data: { 
          ...n.data, 
          isMagnetic: false,
          proximityLevel: null
        }
      }))
    );
    
    setPreviousProximityStates({});
  }, [greenZoneTimer, setNodes]);

  // Handle connection
  const onConnect = useCallback((params: Connection) => {
    console.log('Manual connection created:', params);
  }, []);

  // Clear recent edges when they get old
  useEffect(() => {
    const timer = setTimeout(() => {
      setRecentEdges([]);
    }, 5000);
    return () => clearTimeout(timer);
  }, [recentEdges]);

  // ESC key handler for undoing recent connections
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && recentEdges.length > 0) {
        event.preventDefault();
        const lastEdgeId = recentEdges[recentEdges.length - 1];
        
        setEdges((currentEdges: any) => currentEdges.filter((edge: any) => edge.id !== lastEdgeId));
        setRecentEdges(currentRecent => currentRecent.slice(0, -1));
        
        console.log(`🔙 Undid connection: ${lastEdgeId}`);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [recentEdges, setEdges]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading Working Bump Connect...</div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        fitView
        className="bg-gray-50"
      >
        <Controls />
        <Background gap={20} size={1} color="#e5e7eb" />
      </ReactFlow>
      
      {/* Status Display */}
      {draggingNode && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg z-50 border">
          <div className="font-semibold text-gray-800 mb-1">
            🎯 Seeker: {draggingNode.data.name}
          </div>
          <div className="text-sm text-gray-600 mb-1">
            Active Zones: {nodes.filter((n: any) => n.data.proximityLevel).length}
          </div>
          <div className="text-sm">
            Connection Ready: <span className={nodes.some((n: any) => n.data.proximityLevel === 'CONNECTION') ? 'text-green-600 font-bold' : 'text-gray-400'}>
              {nodes.some((n: any) => n.data.proximityLevel === 'CONNECTION') ? `YES (Hold ${currentSensitivity.dwellTime}ms)` : 'NO'}
            </span>
          </div>
        </div>
      )}

      {/* Connection Stats Overlay */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 min-w-[200px] border">
        <div className="text-sm font-semibold text-gray-800 mb-2">Connection Statistics</div>
        <div className="space-y-1 text-xs text-gray-600">
          <div>Total Entities: {nodes.filter((n: any) => n.data.type !== 'Individual').length}</div>
          <div>Active Connections: {edges.length}</div>
          <div>Recent Connections: {recentEdges.length}</div>
          <div>Magnetic Range: {currentSensitivity.approachZone}px</div>
          <div>Connect Zone: {currentSensitivity.connectionZone}px</div>
          <div>Dwell Time: {currentSensitivity.dwellTime}ms</div>
        </div>
      </div>

      {/* Undo Hint */}
      {recentEdges.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-80 text-white px-3 py-2 rounded-lg text-sm z-50">
          Press ESC to undo ({recentEdges.length} available)
        </div>
      )}
    </div>
  );
}