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
      {/* Target handles */}
      <Handle
        id="top-target"
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-red-500 border-2 border-white opacity-50"
      />
      <Handle
        id="bottom-target"
        type="target"
        position={Position.Bottom}
        className="w-3 h-3 bg-red-500 border-2 border-white opacity-50"
      />
      
      {/* Future: Hidden left/right handles for document connections */}
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white opacity-0 pointer-events-none"
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white opacity-0 pointer-events-none"
      />
      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-red-500 border-2 border-white opacity-0 pointer-events-none"
      />
      <Handle
        id="right-target"
        type="target"
        position={Position.Right}
        className="w-3 h-3 bg-red-500 border-2 border-white opacity-0 pointer-events-none"
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

export default function WorkingBumpConnect() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [draggingNode, setDraggingNode] = useState<Node | null>(null);
  const [previousProximityStates, setPreviousProximityStates] = useState<Record<string, string | null>>({});
  const [recentEdges, setRecentEdges] = useState<string[]>([]); // Track recent edges for undo
  const [greenZoneTimer, setGreenZoneTimer] = useState<Record<string, NodeJS.Timeout | null>>({});
  
  // Sensitivity settings
  const [sensitivity, setSensitivity] = useState({
    approachZone: 260,    // Orange zone radius
    connectionZone: 180,  // Green zone radius
    dwellTime: 300        // Milliseconds to hold in green zone
  });
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading Working Bump Connect data...');
        
        const entities = await unifiedEntityService.getAllEntities();
        console.log(`Loaded ${entities?.length || 0} entities`);
        
        const nodeData = (entities || []).map((entity, index) => ({
          id: entity.id,
          type: 'entity',
          position: entity.position || { 
            x: (index % 3) * 300 + 100, 
            y: Math.floor(index / 3) * 200 + 100 
          },
          data: {
            name: entity.name,
            type: entity.type,
            jurisdiction: entity.jurisdiction,
            isMagnetic: false,
            proximityLevel: null,
          }
        }));
        
        setNodes(nodeData);
        setEdges([]); // Clear any cached edges
        setLoading(false);
        console.log('Working Bump Connect initialized');
        
      } catch (error) {
        console.error('Working Bump Connect loading error:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // ESC key handler for undoing recent connections
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && recentEdges.length > 0) {
        event.preventDefault();
        const lastEdgeId = recentEdges[recentEdges.length - 1];
        
        setEdges(currentEdges => currentEdges.filter(edge => edge.id !== lastEdgeId));
        setRecentEdges(currentRecent => currentRecent.slice(0, -1));
        
        console.log(`🔙 Undid connection: ${lastEdgeId}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recentEdges, setEdges]);
  
  // Calculate distance between two nodes
  const calculateDistance = (node1: Node, node2: Node) => {
    const dx = node1.position.x - node2.position.x;
    const dy = node1.position.y - node2.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  // Get proximity level based on distance and current sensitivity settings
  const getProximityLevel = (distance: number) => {
    if (distance <= sensitivity.connectionZone) return 'CONNECTION';  // Green - ready to connect
    if (distance <= sensitivity.approachZone) return 'INTEREST';      // Orange - approaching
    return null;
  };
  
  // Handle drag start
  const onNodeDragStart = useCallback((event: any, node: Node) => {
    console.log(`🎯 Seeker activated: ${node.data.name}`);
    setDraggingNode(node);
    
    // Activate magnetic state for dragging node
    setNodes(currentNodes => 
      currentNodes.map(n => ({
        ...n,
        data: { 
          ...n.data, 
          isMagnetic: n.id === node.id,
          proximityLevel: null 
        }
      }))
    );
  }, []);
  
  // Handle drag
  const onNodeDrag = useCallback((event: any, draggedNode: Node) => {
    if (!draggingNode || draggingNode.id !== draggedNode.id) return;
    
    let activeZones = 0;
    let connectionReady = false;
    let seekerProximityLevel = null;
    
    // Find the closest target and its proximity level for the seeker
    const otherNodes = nodes.filter(n => n.id !== draggedNode.id);
    const distances = otherNodes.map(node => ({
      node,
      distance: calculateDistance(draggedNode, node)
    }));
    
    // Get the closest proximity level for the seeker node
    const closestTarget = distances.reduce((closest, current) => 
      current.distance < closest.distance ? current : closest
    );
    
    if (closestTarget) {
      seekerProximityLevel = getProximityLevel(closestTarget.distance);
    }
    
    // Update proximity levels for all nodes
    setNodes(currentNodes => 
      currentNodes.map(node => {
        if (node.id === draggedNode.id) {
          // Apply same proximity level to seeker as closest target
          return { 
            ...node, 
            data: { 
              ...node.data, 
              isMagnetic: true,
              proximityLevel: seekerProximityLevel 
            } 
          };
        }
        
        const distance = calculateDistance(draggedNode, node);
        const proximityLevel = getProximityLevel(distance);
        
        if (proximityLevel) {
          activeZones++;
          if (proximityLevel === 'CONNECTION') {
            connectionReady = true;
          }
        }
        
        return {
          ...node,
          data: { 
            ...node.data, 
            proximityLevel,
            isMagnetic: false 
          }
        };
      })
    );
    
    if (activeZones > 0) {
      console.log(`🎯 Proximity detected: ${activeZones} zones active`);
    }
    
    // Check for transitions into CONNECTION zone and create edges immediately
    const newProximityStates: Record<string, string | null> = {};
    const nodesToConnect: Node[] = [];
    
    otherNodes.forEach(node => {
      const distance = calculateDistance(draggedNode, node);
      const currentProximityLevel = getProximityLevel(distance);
      const previousProximityLevel = previousProximityStates[node.id];
      
      newProximityStates[node.id] = currentProximityLevel;
      
      // Detect transition into CONNECTION zone - start dwell timer
      if (currentProximityLevel === 'CONNECTION' && previousProximityLevel !== 'CONNECTION') {
        const pairKey = `${draggedNode.id}-${node.id}`;
        
        // Clear any existing timer
        if (greenZoneTimer[pairKey]) {
          clearTimeout(greenZoneTimer[pairKey]);
        }
        
        // Set timer for dynamic dwell time
        const timer = setTimeout(() => {
          nodesToConnect.push(node);
          setGreenZoneTimer(prev => ({ ...prev, [pairKey]: null }));
          
          // Trigger connection creation
          const existingEdge = edges.find(e => 
            (e.source === draggedNode.id && e.target === node.id) ||
            (e.source === node.id && e.target === draggedNode.id)
          );
          
          if (!existingEdge) {
            // Determine connection direction based on relative positions
            const dx = node.position.x - draggedNode.position.x;
            const dy = node.position.y - draggedNode.position.y;
            
            // Use only vertical connections for entity relationships
            let sourceHandle, targetHandle;
            if (dy > 0) {
              // Target is below source - source uses bottom, target uses top
              sourceHandle = 'bottom';
              targetHandle = 'top-target';
            } else {
              // Target is above source - source uses top, target uses bottom
              sourceHandle = 'top';
              targetHandle = 'bottom-target';
            }
            
            const newEdge = {
              id: `${draggedNode.id}-${node.id}`,
              source: draggedNode.id,
              target: node.id,
              sourceHandle,
              targetHandle,
              type: 'smoothstep', 
              animated: true,
              label: '25%',
              style: { strokeWidth: 2, stroke: '#10b981' },
              labelStyle: { fontSize: 12, fontWeight: 'bold', fill: '#10b981' }
            };
            
            console.log(`✨ Bump Connect: ${draggedNode.data.name} → ${node.data.name}`);
            
            setEdges(currentEdges => [...currentEdges, newEdge]);
            setRecentEdges(currentRecent => [...currentRecent, newEdge.id]);
            
            // Create ownership relationship
            unifiedEntityService.createOwnership(
              draggedNode.id,
              node.id,
              25,
              'Common Stock'
            ).catch(error => {
              console.error('Failed to create ownership:', error);
            });
          }
        }, sensitivity.dwellTime);
        
        setGreenZoneTimer(prev => ({ ...prev, [pairKey]: timer }));
      }
      
      // Clear timer if node exits CONNECTION zone
      if (currentProximityLevel !== 'CONNECTION' && previousProximityLevel === 'CONNECTION') {
        const pairKey = `${draggedNode.id}-${node.id}`;
        if (greenZoneTimer[pairKey]) {
          clearTimeout(greenZoneTimer[pairKey]);
          setGreenZoneTimer(prev => ({ ...prev, [pairKey]: null }));
        }
      }
    });
    
    // Update proximity states
    setPreviousProximityStates(newProximityStates);
  }, [draggingNode, nodes, edges, previousProximityStates, greenZoneTimer]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(greenZoneTimer).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [greenZoneTimer]);
  
  // Handle drag stop
  const onNodeDragStop = useCallback((event: any, node: Node) => {
    console.log(`🎯 Seeker deactivated: ${node.data.name}`);
    setDraggingNode(null);
    
    // Clear all proximity states
    setNodes(currentNodes => 
      currentNodes.map(n => ({
        ...n,
        data: { 
          ...n.data, 
          isMagnetic: false,
          proximityLevel: null 
        }
      }))
    );
  }, [nodes, edges]);
  
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
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading Working Bump Connect...</div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-screen bg-gray-50 flex">
      {/* Left Panel */}
      <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <div className="space-y-6">
          {/* Connection Sensitivity Controls */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-semibold mb-4 text-gray-800">Connection Sensitivity</div>
            
            {/* Approach Zone Slider */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600">Approach Zone</span>
                <span className="text-xs font-mono text-orange-600 bg-orange-50 px-2 py-1 rounded">{sensitivity.approachZone}px</span>
              </div>
              <input
                type="range"
                min="100"
                max="300"
                step="10"
                value={sensitivity.approachZone}
                onChange={(e) => setSensitivity(prev => ({ ...prev, approachZone: parseInt(e.target.value) }))}
                className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>100px</span>
                <span>300px</span>
              </div>
            </div>

            {/* Connection Zone Slider */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600">Connection Zone</span>
                <span className="text-xs font-mono text-green-600 bg-green-50 px-2 py-1 rounded">{sensitivity.connectionZone}px</span>
              </div>
              <input
                type="range"
                min="60"
                max="200"
                step="10"
                value={sensitivity.connectionZone}
                onChange={(e) => setSensitivity(prev => ({ ...prev, connectionZone: parseInt(e.target.value) }))}
                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>60px</span>
                <span>200px</span>
              </div>
            </div>

            {/* Dwell Time Slider */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600">Dwell Time</span>
                <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">{sensitivity.dwellTime}ms</span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="100"
                value={sensitivity.dwellTime}
                onChange={(e) => setSensitivity(prev => ({ ...prev, dwellTime: parseInt(e.target.value) }))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>100ms</span>
                <span>1000ms</span>
              </div>
            </div>

            {/* Preset Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setSensitivity({ approachZone: 280, connectionZone: 160, dwellTime: 100 })}
                className="flex-1 px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Easy
              </button>
              <button
                onClick={() => setSensitivity({ approachZone: 260, connectionZone: 180, dwellTime: 300 })}
                className="flex-1 px-3 py-2 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
              >
                Normal
              </button>
              <button
                onClick={() => setSensitivity({ approachZone: 140, connectionZone: 80, dwellTime: 600 })}
                className="flex-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Precise
              </button>
            </div>
          </div>

          {/* Connection Stats */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-semibold mb-3 text-gray-800">Connection Activity</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Entities:</span>
                <span className="font-mono text-gray-800">{nodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Connections:</span>
                <span className="font-mono text-gray-800">{edges.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recent Connections:</span>
                <span className="font-mono text-gray-800">{recentEdges.length}</span>
              </div>
              {draggingNode && (
                <div className="flex justify-between text-green-600">
                  <span>Active Zones:</span>
                  <span className="font-mono">{nodes.filter(n => n.data.proximityLevel).length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
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
              Active Zones: {nodes.filter(n => n.data.proximityLevel).length}
            </div>
            <div className="text-sm">
              Connection Ready: <span className={nodes.some(n => n.data.proximityLevel === 'CONNECTION') ? 'text-green-600 font-bold' : 'text-gray-400'}>
                {nodes.some(n => n.data.proximityLevel === 'CONNECTION') ? `YES (Hold ${sensitivity.dwellTime}ms)` : 'NO'}
              </span>
            </div>
          </div>
        )}

        {/* Undo Hint */}
        {recentEdges.length > 0 && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-80 text-white px-3 py-2 rounded-lg text-sm z-50">
            Press ESC to undo ({recentEdges.length} available)
          </div>
        )}
      </div>
    </div>
  );
}