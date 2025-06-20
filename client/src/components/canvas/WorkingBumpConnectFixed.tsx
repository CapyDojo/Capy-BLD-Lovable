import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ReactFlow, Node, Edge, addEdge, useNodesState, useEdgesState, Connection, Position, Handle, Background, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { unifiedEntityService } from '../../services/UnifiedEntityService';
import { Entity, EntityTypes } from '../../types/entity';
import EntityEditPanel from './EntityEditPanel';

// Canvas state persistence functions
const saveCanvasState = (nodes: Node[], edges: Edge[]) => {
  try {
    const state = { nodes, edges, timestamp: Date.now() };
    localStorage.setItem('canvas-state', JSON.stringify(state));
    console.log('💾 Canvas state saved with', nodes.length, 'nodes and', edges.length, 'edges');
  } catch (error) {
    console.error('Failed to save canvas state:', error);
  }
};

const loadCanvasState = () => {
  try {
    const saved = localStorage.getItem('canvas-state');
    if (saved) {
      const state = JSON.parse(saved);
      console.log('📁 Canvas state loaded from', new Date(state.timestamp));
      return state;
    }
  } catch (error) {
    console.error('Failed to load canvas state:', error);
  }
  return null;
};

// Entity node component with magnetic visual feedback
const EntityNode = ({ data, id }: { data: any; id: string }) => {
  const getNodeStyle = () => {
    const baseStyle = "px-4 py-3 rounded-lg border-2 bg-white shadow-lg transition-all duration-200 min-w-[140px] text-center relative";
    
    if (data.isSeeker) {
      // Seeker node - blue glow with proximity-based color
      if (data.proximityLevel === 'CONNECTION') {
        return `${baseStyle} border-green-400 bg-green-50 shadow-green-200 shadow-xl`;
      } else if (data.proximityLevel === 'INTEREST') {
        return `${baseStyle} border-orange-400 bg-orange-50 shadow-orange-200 shadow-xl`;
      } else {
        return `${baseStyle} border-blue-400 bg-blue-50 shadow-blue-200 shadow-xl`;
      }
    }
    
    if (data.proximityLevel === 'CONNECTION') {
      return `${baseStyle} border-green-400 bg-green-50 shadow-green-200 shadow-xl`;
    } else if (data.proximityLevel === 'INTEREST') {
      return `${baseStyle} border-orange-400 bg-orange-50 shadow-orange-200 shadow-xl`;
    }
    
    return `${baseStyle} border-gray-300 bg-white shadow-md hover:shadow-lg`;
  };

  const getHandleStyle = (handleId: string) => {
    const baseStyle = "w-3 h-3 border-2 border-gray-400 bg-white";
    
    if (data.isSeeker && data.handleStates && data.handleStates[handleId]) {
      const state = data.handleStates[handleId];
      if (state === 'CONNECTION') {
        return `${baseStyle} !border-green-500 !bg-green-400 shadow-lg shadow-green-300`;
      } else if (state === 'INTEREST') {
        return `${baseStyle} !border-orange-500 !bg-orange-400 shadow-lg shadow-orange-300`;
      }
    }
    
    return `${baseStyle} opacity-75`;
  };

  const getConnectionTip = () => {
    if (data.isSeeker) {
      if (data.proximityLevel === 'CONNECTION') {
        return "Ready to connect";
      } else if (data.proximityLevel === 'INTEREST') {
        return "Move closer";
      } else {
        return "Seeking connections";
      }
    }
    return null;
  };

  return (
    <div className={getNodeStyle()}>
      {/* Connection handles */}
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
      
      {/* Connection status indicator */}
      {getConnectionTip() && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium px-2 py-1 bg-gray-900 text-white rounded whitespace-nowrap">
          {getConnectionTip()}
        </div>
      )}
    </div>
  );
};

// Main component interface
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
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  
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
        const loadedEntities = await unifiedEntityService.getAllEntities();
        console.log(`Loaded ${loadedEntities.length} entities`);
        setEntities(loadedEntities);
        
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

        // Try to load saved canvas state first
        const savedState = loadCanvasState();
        let initialNodes;
        let initialEdges;

        if (savedState && savedState.nodes.length > 0) {
          // Use saved positions and merge with current entity data
          console.log('📁 Restoring canvas from saved state');
          initialNodes = loadedEntities.map((entity) => {
            const savedNode = savedState.nodes.find((n: any) => n.id === entity.id);
            return {
              id: entity.id,
              type: 'entity',
              position: savedNode ? savedNode.position : getEntityPosition(entity),
              data: {
                name: entity.name,
                type: entity.type,
                jurisdiction: entity.jurisdiction,
                isMagnetic: false,
                proximityLevel: null,
                isSeeker: false,
                handleStates: {}
              }
            };
          });
          
          // Restore saved edges if they reference existing entities
          const validEntityIds = new Set(loadedEntities.map(e => e.id));
          initialEdges = savedState.edges.filter((edge: any) => 
            validEntityIds.has(edge.source) && validEntityIds.has(edge.target)
          );
        } else {
          // Use default layout
          console.log('🏗️ Using default canvas layout');
          initialNodes = loadedEntities.map((entity) => ({
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
          
          // Generate default edges
          initialEdges = [];
        }
        
        setNodes(initialNodes);
        
        if (savedState && initialEdges.length > 0) {
          // Use saved edges
          setEdges(initialEdges);
          console.log(`📁 Restored ${initialEdges.length} saved edges`);
        } else {
          // Create default edges based on actual entity names and IDs
          const entityMap = loadedEntities.reduce((map, entity) => {
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
        }
        
        setLoading(false);
        console.log('Working Bump Connect initialized');
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Save canvas state when nodes or edges change
  useEffect(() => {
    if (!loading && nodes.length > 0) {
      const timeoutId = setTimeout(() => {
        saveCanvasState(nodes, edges);
      }, 1000); // Debounce saves
      
      return () => clearTimeout(timeoutId);
    }
  }, [nodes, edges, loading]);

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
      let seekerProximityLevel: any = null;
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
            clearTimeout(greenZoneTimer[n.id]);
            setGreenZoneTimer(prev => ({ ...prev, [n.id]: null }));
          }
          
          return {
            ...n,
            data: { 
              ...n.data, 
              proximityLevel,
              isMagnetic: false 
            }
          };
        }
        
        return n;
      });
    });
    
    // Update proximity states for next iteration
    const newProximityStates: Record<string, string | null> = {};
    nodes.forEach((n: any) => {
      if (n.id !== node.id) {
        const distance = calculateDistance(node, n);
        newProximityStates[n.id] = getProximityLevel(distance);
      }
    });
    setPreviousProximityStates(newProximityStates);
  }, [draggingNode, nodes, currentSensitivity, previousProximityStates, greenZoneTimer]);

  // Handle drag stop
  const onNodeDragStop = useCallback((event: any, node: Node) => {
    console.log(`🎯 Seeker deactivated: ${node.data.name}`);
    setDraggingNode(null);
    
    // Clear all proximity states
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
  }, [setNodes]);

  // Handle manual connections
  const onConnect = useCallback((params: Connection) => {
    console.log(`🔗 Manual connection: ${params.source} → ${params.target}`);
    const newEdge = {
      ...params,
      type: 'smoothstep',
      animated: true,
      label: '25%',
      style: { 
        strokeWidth: 2, 
        stroke: '#6b7280' 
      },
    };
    setEdges(eds => addEdge(newEdge, eds));
  }, [setEdges]);

  // Handle node click for editing
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation();
    const entity = entities.find(e => e.id === node.id);
    if (entity) {
      setSelectedEntity(entity);
      setEditPanelOpen(true);
    }
  }, [entities]);

  // Handle entity updates from edit panel
  const handleEntityUpdated = useCallback(async (updatedEntity: Entity) => {
    try {
      // Update entity in service
      await unifiedEntityService.updateEntity(updatedEntity.id, updatedEntity, 'canvas-edit');
      
      // Update local entities state
      setEntities(prev => prev.map(e => e.id === updatedEntity.id ? updatedEntity : e));
      
      // Update node data in canvas
      setNodes((currentNodes: any) => 
        currentNodes.map((node: any) => 
          node.id === updatedEntity.id 
            ? { ...node, data: { ...node.data, name: updatedEntity.name, type: updatedEntity.type } }
            : node
        )
      );
      
      console.log(`✅ Entity updated: ${updatedEntity.name}`);
    } catch (error) {
      console.error('Failed to update entity:', error);
    }
  }, [setNodes]);

  // ESC key handler for undoing recent connections
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        
        if (editPanelOpen) {
          // Close edit panel first
          setEditPanelOpen(false);
          setSelectedEntity(null);
        } else if (recentEdges.length > 0) {
          // Undo recent connection
          const lastEdgeId = recentEdges[recentEdges.length - 1];
          setEdges((currentEdges: any) => currentEdges.filter((edge: any) => edge.id !== lastEdgeId));
          setRecentEdges(currentRecent => currentRecent.slice(0, -1));
          console.log(`🔙 Undid connection: ${lastEdgeId}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recentEdges, setEdges, editPanelOpen]);

  // Node types configuration
  const nodeTypes = useMemo(() => ({
    entity: EntityNode,
  }), []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-900">Loading canvas...</div>
          <div className="text-sm text-gray-500 mt-1">Preparing organizational structure</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-white flex">
      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className="bg-gray-50"
          connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2 }}
          defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
        >
          <Background variant={'dots' as BackgroundVariant} gap={20} size={1} />
        </ReactFlow>

        {/* Professional Chart Header */}
        <div className="absolute top-6 left-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h1 className="text-lg font-semibold text-gray-900 mb-1">TechFlow Inc. Organizational Structure</h1>
          <p className="text-sm text-gray-600">Post-Series A Capitalization Table</p>
        </div>
      </div>

      {/* Entity Edit Panel */}
      {editPanelOpen && selectedEntity && (
        <EntityEditPanel
          entity={selectedEntity}
          isOpen={editPanelOpen}
          onClose={() => {
            setEditPanelOpen(false);
            setSelectedEntity(null);
          }}
          onEntityUpdated={handleEntityUpdated}
        />
      )}
    </div>
  );
}