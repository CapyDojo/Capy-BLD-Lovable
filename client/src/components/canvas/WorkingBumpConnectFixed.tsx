import React, { useState, useEffect, useCallback, useRef } from 'react';
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

// Hover Info Card Component
const HoverInfoCard = ({ data, position, visible }: any) => {
  if (!visible) return null;

  const getEntityTypeIcon = (type: EntityTypes) => {
    switch (type) {
      case 'Corporation': return '🏢';
      case 'LLC': return '🏬';
      case 'Partnership': return '🤝';
      case 'Trust': return '🏛️';
      case 'Individual': return '👤';
      default: return '📋';
    }
  };

  const getStatusBadge = (proximityLevel: string) => {
    if (proximityLevel === 'CONNECTION') {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Ready to Connect</span>;
    } else if (proximityLevel === 'INTEREST') {
      return <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">In Range</span>;
    } else if (data.isSeeker) {
      return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Active Seeker</span>;
    }
    return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Available</span>;
  };

  return (
    <div 
      className="absolute z-50 pointer-events-none"
      style={{
        left: position.x + 20,
        top: position.y - 10,
        transform: 'translateY(-100%)'
      }}
    >
      <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[280px] max-w-[320px]">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="text-2xl flex-shrink-0">{getEntityTypeIcon(data.type)}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{data.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{data.type}</p>
          </div>
          {getStatusBadge(data.proximityLevel)}
        </div>

        {/* Details */}
        <div className="space-y-2 text-xs">
          {data.jurisdiction && (
            <div className="flex justify-between">
              <span className="text-gray-600">Jurisdiction:</span>
              <span className="text-gray-900 font-medium">{data.jurisdiction}</span>
            </div>
          )}
          
          {data.type !== 'Individual' && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Entity Type:</span>
                <span className="text-gray-900 font-medium">{data.type}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
            </>
          )}

          {data.type === 'Individual' && (
            <div className="flex justify-between">
              <span className="text-gray-600">Role:</span>
              <span className="text-gray-900 font-medium">Stakeholder</span>
            </div>
          )}
        </div>

        {/* Connection Info */}
        {(data.proximityLevel || data.isMagnetic) && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-600">
              {data.proximityLevel === 'CONNECTION' && (
                <div className="text-green-700">💚 Hold to create connection</div>
              )}
              {data.proximityLevel === 'INTEREST' && (
                <div className="text-orange-700">🟡 Move closer to connect</div>
              )}
              {data.isSeeker && !data.proximityLevel && (
                <div className="text-blue-700">🔍 Seeking connections...</div>
              )}
            </div>
          </div>
        )}

        {/* Arrow pointing to node */}
        <div className="absolute bottom-0 left-8 transform translate-y-full">
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-200"></div>
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white absolute top-0 left-0 transform -translate-y-px"></div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Entity Node with Connection Handles
const EntityNode = ({ data, selected, onNodeHover }: any) => {
  const { isMagnetic, proximityLevel, isSeeker, handleStates } = data;
  const [isHovered, setIsHovered] = useState(false);
  
  // Dynamic styling based on proximity and seeker status
  const getNodeStyle = () => {
    // Proximity colors always take precedence over seeker state
    if (proximityLevel === 'CONNECTION') {
      return 'border-green-500 bg-green-50 shadow-green-500 shadow-lg animate-pulse';
    } else if (proximityLevel === 'INTEREST') {
      return 'border-orange-500 bg-orange-50 shadow-orange-300 shadow-md animate-pulse';
    } else if (isSeeker) {
      // Seeker node gets a blue glow when not in proximity to other nodes
      return 'border-blue-500 bg-blue-50 shadow-blue-500 shadow-lg animate-pulse';
    } else if (isMagnetic) {
      return 'border-blue-500 bg-blue-50 shadow-blue-300 shadow-lg';
    }
    return 'border-gray-300 bg-white';
  };

  // Get handle styling based on proximity state
  const getHandleStyle = (handleId: string) => {
    const handleState = handleStates?.[handleId];
    let baseClasses = 'react-flow__handle';
    
    if (handleState === 'CONNECTION') {
      return `${baseClasses} handle-connection`;
    } else if (handleState === 'INTEREST') {
      return `${baseClasses} handle-interest`;
    }
    
    return baseClasses;
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsHovered(true);
    // Only show hover cards when not dragging
    if (onNodeHover && !isSeeker) {
      const rect = e.currentTarget.getBoundingClientRect();
      onNodeHover(data, { x: rect.left, y: rect.top }, true);
    }
  };

  const handleMouseLeave = () => {
    console.log('Mouse leaving node:', data.name);
    setIsHovered(false);
    if (onNodeHover) {
      onNodeHover(null, null, false);
    }
  };

  return (
    <div 
      className={`
        px-4 py-3 rounded-lg border-2 shadow-lg transition-all duration-300 min-w-[120px]
        ${getNodeStyle()}
        hover:shadow-xl cursor-move relative
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerLeave={handleMouseLeave}
    >
      {/* Connection Handles - Only vertical connections for entities */}
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        className={getHandleStyle('top')}
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className={getHandleStyle('bottom')}
      />
      <Handle
        id="top-target"
        type="target"
        position={Position.Top}
        className={getHandleStyle('top-target')}
      />
      <Handle
        id="bottom-target"
        type="target"
        position={Position.Bottom}
        className={getHandleStyle('bottom-target')}
      />

      <div className="font-semibold text-gray-800 text-center">{data.name}</div>
      <div className="text-xs text-gray-500 text-center">{data.type}</div>
      {data.jurisdiction && (
        <div className="text-xs text-gray-400 text-center">{data.jurisdiction}</div>
      )}
      
      {/* In-Node Connection Guidance */}
      {isSeeker && (
        <div className="mt-2 text-center">
          <div className="text-xs font-medium text-blue-700">🔍 Seeking connections...</div>
        </div>
      )}
      
      {proximityLevel === 'CONNECTION' && !isSeeker && (
        <div className="mt-2 text-center">
          <div className="text-xs font-medium text-green-700 animate-pulse">💚 Ready to connect</div>
        </div>
      )}
      
      {proximityLevel === 'INTEREST' && !isSeeker && (
        <div className="mt-2 text-center">
          <div className="text-xs font-medium text-orange-700">🟡 Move closer</div>
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
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [showHoverCard, setShowHoverCard] = useState(false);
  
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
            proximityLevel: null,
            isSeeker: false,
            handleStates: {}
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

  // Calculate handle-specific proximity states
  const calculateHandleProximity = (seekerNode: Node, targetNode: Node, sensitivity: any) => {
    const handleStates: Record<string, string | null> = {};
    
    // Handle positions relative to node centers
    const handleOffsets: Record<string, {x: number, y: number}> = {
      'top': { x: 0, y: -30 },
      'bottom': { x: 0, y: 30 },
      'top-target': { x: 0, y: -30 },
      'bottom-target': { x: 0, y: 30 }
    };

    // Check each seeker handle against compatible target handles
    const compatiblePairs = [
      { seeker: 'bottom', target: 'top-target' },
      { seeker: 'top', target: 'bottom-target' }
    ];

    compatiblePairs.forEach(pair => {
      const seekerHandlePos = {
        x: seekerNode.position.x + handleOffsets[pair.seeker].x,
        y: seekerNode.position.y + handleOffsets[pair.seeker].y
      };
      
      const targetHandlePos = {
        x: targetNode.position.x + handleOffsets[pair.target].x,
        y: targetNode.position.y + handleOffsets[pair.target].y
      };

      const distance = Math.sqrt(
        Math.pow(seekerHandlePos.x - targetHandlePos.x, 2) + 
        Math.pow(seekerHandlePos.y - targetHandlePos.y, 2)
      );

      if (distance <= sensitivity.connectionZone) {
        handleStates[pair.seeker] = 'CONNECTION';
      } else if (distance <= sensitivity.approachZone) {
        handleStates[pair.seeker] = 'INTEREST';
      }
    });

    return handleStates;
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
    
    // Clear hover cards when dragging starts
    setShowHoverCard(false);
    setHoveredNode(null);
    setHoverPosition(null);
    
    // Activate magnetic state for dragging node and mark it as seeker
    setNodes((currentNodes: any) => 
      currentNodes.map((n: any) => ({
        ...n,
        data: { 
          ...n.data, 
          isMagnetic: n.id === node.id,
          proximityLevel: null,
          isSeeker: n.id === node.id
        }
      }))
    );
  }, [setNodes]);

  // Handle drag
  const onNodeDrag = useCallback((event: any, node: Node) => {
    if (!draggingNode) return;
    
    setNodes((currentNodes: any) => {
      // Find the closest node to determine seeker's proximity level
      let seekerProximityLevel = null;
      let minDistance = Infinity;
      
      currentNodes.forEach((n: any) => {
        if (n.id !== node.id) {
          const distance = calculateDistance(node, n);
          if (distance < minDistance) {
            minDistance = distance;
            seekerProximityLevel = getProximityLevel(distance);
          }
        }
      });
      
      return currentNodes.map((n: any) => {
        if (n.id === node.id) {
          // Calculate seeker handle states for all potential targets
          const seekerHandleStates: Record<string, string | null> = {};
          
          currentNodes.forEach((targetNode: any) => {
            if (targetNode.id !== node.id) {
              const handleProximity = calculateHandleProximity(node, targetNode, currentSensitivity);
              Object.entries(handleProximity).forEach(([handleId, state]) => {
                if (state && (!seekerHandleStates[handleId] || state === 'CONNECTION')) {
                  seekerHandleStates[handleId] = state;
                }
              });
            }
          });

          // Update the dragging node with its position and proximity level
          return { 
            ...n, 
            position: node.position,
            data: {
              ...n.data,
              proximityLevel: seekerProximityLevel,
              isSeeker: true,
              handleStates: seekerHandleStates
            }
          };
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
          
          // Calculate target handle states for this specific target
          const targetHandleStates: Record<string, string | null> = {};
          const handleProximity = calculateHandleProximity(node, n, currentSensitivity);
          
          // Map seeker handle states to corresponding target handles
          if (handleProximity['bottom']) {
            targetHandleStates['top-target'] = handleProximity['bottom'];
          }
          if (handleProximity['top']) {
            targetHandleStates['bottom-target'] = handleProximity['top'];
          }

          return {
            ...n,
            data: { 
              ...n.data, 
              proximityLevel,
              handleStates: targetHandleStates
            }
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
    
    // Deactivate all magnetic states and proximity levels, clear seeker flag
    setNodes((currentNodes: any) => 
      currentNodes.map((n: any) => ({
        ...n,
        data: { 
          ...n.data, 
          isMagnetic: false,
          proximityLevel: null,
          isSeeker: false,
          handleStates: {}
        }
      }))
    );
    
    setPreviousProximityStates({});
  }, [greenZoneTimer, setNodes]);

  // Handle connection
  const onConnect = useCallback((params: Connection) => {
    console.log('Manual connection created:', params);
  }, []);

  // Hover callback handler
  const handleNodeHover = useCallback((data: any, position: { x: number; y: number } | null, visible: boolean) => {
    if (visible && !draggingNode) {
      setHoveredNode(data);
      setHoverPosition(position);
      setShowHoverCard(true);
    } else {
      setShowHoverCard(false);
      setHoveredNode(null);
      setHoverPosition(null);
    }
  }, [draggingNode]);

  // Node types configuration with hover support
  const nodeTypes = {
    entity: (props: any) => <EntityNode {...props} onNodeHover={handleNodeHover} />,
  };

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

  // Global mouse move handler to clear hover cards when mouse moves away from canvas
  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      // If not dragging and hover card is visible, check if mouse is still over a node
      if (!draggingNode && showHoverCard) {
        const canvasElement = document.querySelector('.react-flow');
        if (canvasElement) {
          const rect = canvasElement.getBoundingClientRect();
          const isOverCanvas = event.clientX >= rect.left && 
                              event.clientX <= rect.right && 
                              event.clientY >= rect.top && 
                              event.clientY <= rect.bottom;
          
          // If mouse is not over canvas, clear hover card
          if (!isOverCanvas) {
            setShowHoverCard(false);
            setHoveredNode(null);
            setHoverPosition(null);
          }
        }
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    return () => document.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [draggingNode, showHoverCard]);

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

      {/* Hover Info Cards */}
      {showHoverCard && hoveredNode && hoverPosition && (
        <HoverInfoCard
          data={hoveredNode}
          position={hoverPosition}
          visible={showHoverCard}
        />
      )}
    </div>
  );
}