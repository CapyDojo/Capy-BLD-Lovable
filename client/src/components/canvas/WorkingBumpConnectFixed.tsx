import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

// Professional Legal Entity Information Panel
const EntityInfoPanel = ({ data, position, visible }: any) => {
  if (!visible) return null;

  // Legal professional context with clear visual hierarchy
  const getEntityDetails = (type: EntityTypes) => {
    const entityMap = {
      'Corporation': { 
        icon: '🏢', 
        color: 'border-blue-500 bg-blue-50', 
        textColor: 'text-blue-900',
        category: 'Corporate Entity'
      },
      'LLC': { 
        icon: '🏪', 
        color: 'border-purple-500 bg-purple-50', 
        textColor: 'text-purple-900',
        category: 'Limited Liability'
      },
      'Partnership': { 
        icon: '🤝', 
        color: 'border-green-500 bg-green-50', 
        textColor: 'text-green-900',
        category: 'Partnership Entity'
      },
      'Trust': { 
        icon: '🛡️', 
        color: 'border-orange-500 bg-orange-50', 
        textColor: 'text-orange-900',
        category: 'Trust Entity'
      },
      'Individual': { 
        icon: '👤', 
        color: 'border-gray-500 bg-gray-50', 
        textColor: 'text-gray-900',
        category: 'Natural Person'
      }
    };
    return entityMap[type] || entityMap['Individual'];
  };

  const getConnectionStatus = (proximityLevel: string, isSeeker: boolean) => {
    if (proximityLevel === 'CONNECTION') {
      return {
        status: 'Ready to Connect',
        instruction: 'Release to create ownership relationship',
        badge: 'bg-green-100 text-green-800 border-green-300',
        priority: 'high'
      };
    }
    if (proximityLevel === 'INTEREST') {
      return {
        status: 'In Connection Range',
        instruction: 'Move closer to enable connection',
        badge: 'bg-orange-100 text-orange-800 border-orange-300',
        priority: 'medium'
      };
    }
    if (isSeeker) {
      return {
        status: 'Seeking Connections',
        instruction: 'Drag toward compatible entities',
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
        priority: 'active'
      };
    }
    return {
      status: 'Available',
      instruction: 'Click to select or drag to connect',
      badge: 'bg-gray-100 text-gray-700 border-gray-300',
      priority: 'default'
    };
  };

  // Professional positioning system for legal professionals
  const getProfessionalCardPosition = () => {
    const cardWidth = 340;
    const cardHeight = 200;
    const offset = 24;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Position near cursor with smart viewport handling
    let left = position.x + offset;
    let top = position.y - cardHeight/2;
    
    // Ensure card stays within viewport
    if (left + cardWidth > viewportWidth - 24) {
      left = position.x - cardWidth - offset;
    }
    if (left < 24) {
      left = 24;
    }
    if (top < 24) {
      top = 24;
    }
    if (top + cardHeight > viewportHeight - 24) {
      top = viewportHeight - cardHeight - 24;
    }
    
    return { left, top };
  };

  const cardPosition = getProfessionalCardPosition();
  const entityDetails = getEntityDetails(data.type);
  const connectionInfo = getConnectionStatus(data.proximityLevel, data.isSeeker);

  return (
    <div 
      className="fixed z-50 pointer-events-none"
      style={{
        left: cardPosition.left,
        top: cardPosition.top,
      }}
    >
      <div className="bg-white border border-slate-300 rounded-xl shadow-2xl overflow-hidden max-w-sm">
        {/* Professional header with entity branding */}
        <div className={`px-5 py-4 border-l-4 ${entityDetails.color}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-2xl ${entityDetails.textColor}`}>{entityDetails.icon}</span>
              <div>
                <h3 className="font-semibold text-slate-900 text-base leading-tight">{data.name}</h3>
                <p className="text-sm text-slate-600 font-medium">{entityDetails.category}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Entity information grid */}
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Entity Type</label>
              <p className="text-sm font-medium text-slate-900 mt-1">{data.type}</p>
            </div>
            {data.jurisdiction && (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jurisdiction</label>
                <p className="text-sm font-medium text-slate-900 mt-1">{data.jurisdiction}</p>
              </div>
            )}
          </div>

          {/* Connection status panel */}
          {(data.proximityLevel || data.isSeeker) && (
            <div className={`p-3 rounded-lg border ${connectionInfo.badge}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Connection Status</span>
                <span className="text-xs font-medium">{connectionInfo.status}</span>
              </div>
              <p className="text-xs leading-relaxed">{connectionInfo.instruction}</p>
            </div>
          )}

          {/* Quick action guide */}
          <div className="pt-3 border-t border-slate-200">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs font-medium text-slate-600">Click</div>
                <div className="text-xs text-slate-500">Select</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-600">Drag</div>
                <div className="text-xs text-slate-500">Connect</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-600">ESC</div>
                <div className="text-xs text-slate-500">Cancel</div>
              </div>
            </div>
          </div>
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
    // Show hover cards unless actively dragging
    if (onNodeHover) {
      const rect = e.currentTarget.getBoundingClientRect();
      // Position hover card from top-right corner of the node
      const anchorX = rect.right;
      const anchorY = rect.top;
      const nodeWidth = rect.width;
      const nodeHeight = rect.height;
      onNodeHover(data, { 
        x: anchorX, 
        y: anchorY,
        nodeWidth,
        nodeHeight 
      }, true);
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
        
        // Professional legal org chart layout - hierarchical positioning
        const getEntityPosition = (entity: any) => {
          const name = entity.name;
          
          // Target company at center-bottom (focal point)
          if (name === 'TechFlow Inc') {
            return { x: 600, y: 400 };
          }
          
          // Subsidiary below parent company
          if (name === 'TechFlow Europe Ltd') {
            return { x: 600, y: 580 };
          }
          
          // Founders at top level - key management
          if (name === 'Alex Chen') return { x: 400, y: 100 }; // CEO left
          if (name === 'Jordan Patel') return { x: 600, y: 100 }; // CTO center
          if (name === 'Sam Rivera') return { x: 800, y: 100 }; // VP Eng right
          
          // Institutional investors - left side hierarchy
          if (name === 'Sequoia Capital') return { x: 200, y: 250 }; // Lead investor
          if (name === 'Andreessen Horowitz') return { x: 400, y: 250 }; // Co-investor
          if (name === 'First Round Capital') return { x: 600, y: 250 }; // Early investor
          
          // Employee pool - right side
          if (name === 'Employee Option Pool') return { x: 900, y: 250 };
          
          // Default fallback
          return { x: 300, y: 300 };
        };

        const initialNodes = entities.map((entity) => ({
          id: entity.id,
          type: 'entity',
          position: getEntityPosition(entity),
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
        
        // Create edges based on actual entity names and IDs
        const entityMap = entities.reduce((map, entity) => {
          map[entity.name] = entity.id;
          return map;
        }, {} as Record<string, string>);
        
        const createEdge = (ownerName: string, ownedName: string, label: string, color: string, isSubsidiary = false) => {
          const ownerId = entityMap[ownerName];
          const ownedId = entityMap[ownedName];
          
          if (!ownerId || !ownedId) {
            console.warn(`Could not create edge: ${ownerName} -> ${ownedName} (missing entity)`);
            return null;
          }
          
          return {
            id: `edge-${ownerId}-${ownedId}`,
            source: ownerId,
            target: ownedId,
            sourceHandle: 'bottom',
            targetHandle: 'top-target',
            type: isSubsidiary ? 'straight' : 'smoothstep',
            animated: false,
            label,
            style: { 
              strokeWidth: isSubsidiary ? 3 : 2, 
              stroke: color,
              strokeDasharray: isSubsidiary ? '0' : '0'
            },
            labelStyle: { 
              fontSize: 11, 
              fontWeight: '600', 
              fill: '#1f2937',
              backgroundColor: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #e5e7eb'
            }
          };
        };
        
        // Professional color coding for legal org charts
        const ownershipEdges = [
          // Founders - Blue (management/founders)
          createEdge('Alex Chen', 'TechFlow Inc', '35%', '#2563eb'),
          createEdge('Jordan Patel', 'TechFlow Inc', '30%', '#2563eb'),
          createEdge('Sam Rivera', 'TechFlow Inc', '2%', '#2563eb'),
          
          // Institutional Investors - Green (institutional capital)
          createEdge('Sequoia Capital', 'TechFlow Inc', '15%', '#059669'),
          createEdge('Andreessen Horowitz', 'TechFlow Inc', '8%', '#059669'),
          createEdge('First Round Capital', 'TechFlow Inc', '8%', '#dc2626'),
          
          // Subsidiary - Dark blue (corporate structure)
          createEdge('TechFlow Inc', 'TechFlow Europe Ltd', '100%', '#1e40af', true)
        ].filter(Boolean);
        
        setEdges(ownershipEdges);
        console.log(`Created ${ownershipEdges.length} ownership edges for TechFlow startup structure`);
        console.log('Edge details:', ownershipEdges.map(e => ({ id: e.id, source: e.source, target: e.target })));
        
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
    if (visible) {
      // Only show hover card if not dragging anything
      if (!draggingNode) {
        setHoveredNode(data);
        setHoverPosition(position);
        setShowHoverCard(true);
      }
    } else {
      // Always hide hover card when visibility is false
      setShowHoverCard(false);
      setHoveredNode(null);
      setHoverPosition(null);
    }
  }, [draggingNode]);

  // Node types configuration with hover support - memoized to prevent React Flow warnings
  const nodeTypes = useMemo(() => ({
    entity: (props: any) => <EntityNode {...props} onNodeHover={handleNodeHover} />,
  }), [handleNodeHover]);

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
      {/* Professional Chart Header */}
      <div className="absolute top-4 left-4 z-50 bg-white p-4 rounded-lg shadow-lg border">
        <h1 className="text-lg font-bold text-gray-900 mb-1">TechFlow Inc. Organizational Structure</h1>
        <p className="text-sm text-gray-600 mb-2">Post-Series A Capitalization Table</p>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-0.5 bg-blue-600"></div>
            <span>Founders/Management</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-0.5 bg-green-600"></div>
            <span>Institutional Investors</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-0.5 bg-red-600"></div>
            <span>Early Stage</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-0.5 bg-blue-800"></div>
            <span>Subsidiaries</span>
          </div>
        </div>
      </div>

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
        className="bg-white"
        minZoom={0.4}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
        proOptions={{ hideAttribution: true }}
      >
        <Controls 
          position="bottom-right"
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
        />
        <Background 
          variant="dots" 
          gap={25} 
          size={1.2} 
          color="#f3f4f6"
          style={{ backgroundColor: '#fafafa' }}
        />
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

      {/* Professional Entity Information Panel */}
      {showHoverCard && hoveredNode && hoverPosition && (
        <EntityInfoPanel
          data={hoveredNode}
          position={hoverPosition}
          visible={showHoverCard}
        />
      )}
    </div>
  );
}