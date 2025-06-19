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
      return 'border-purple-500 bg-purple-50 shadow-purple-300 shadow-md';
    } else if (proximityLevel === 'AWARENESS') {
      return 'border-orange-500 bg-orange-50 shadow-orange-300 shadow-md';
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
      {/* Connection Handles - Both source and target for each position */}
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
        id="left"
        type="source"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
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
      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-red-500 border-2 border-white opacity-50"
      />
      <Handle
        id="right-target"
        type="target"
        position={Position.Right}
        className="w-3 h-3 bg-red-500 border-2 border-white opacity-50"
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
  
  // Calculate distance between two nodes
  const calculateDistance = (node1: Node, node2: Node) => {
    const dx = node1.position.x - node2.position.x;
    const dy = node1.position.y - node2.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  // Get proximity level based on distance
  const getProximityLevel = (distance: number) => {
    if (distance <= 80) return 'CONNECTION';
    if (distance <= 120) return 'INTEREST';
    if (distance <= 200) return 'AWARENESS';
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
    
    // Update proximity levels for all other nodes
    setNodes(currentNodes => 
      currentNodes.map(node => {
        if (node.id === draggedNode.id) {
          return { ...node, data: { ...node.data, isMagnetic: true } };
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
    
    if (connectionReady) {
      console.log(`🔗 Connection ready!`);
    }
  }, [draggingNode]);
  
  // Handle drag stop
  const onNodeDragStop = useCallback((event: any, node: Node) => {
    console.log(`🎯 Seeker deactivated: ${node.data.name}`);
    setDraggingNode(null);
    
    // Check for auto-connections before clearing proximity
    const connectableNodes = nodes.filter(n => {
      if (n.id === node.id) return false;
      const distance = calculateDistance(node, n);
      return distance <= 80; // CONNECTION zone
    });
    
    if (connectableNodes.length > 0) {
      connectableNodes.forEach(targetNode => {
        const existingEdge = edges.find(e => 
          (e.source === node.id && e.target === targetNode.id) ||
          (e.source === targetNode.id && e.target === node.id)
        );
        
        if (!existingEdge) {
          // Determine connection direction based on relative positions
          const dx = targetNode.position.x - node.position.x;
          const dy = targetNode.position.y - node.position.y;
          
          // Use vertical connections for primarily vertical arrangements
          let sourceHandle, targetHandle;
          if (Math.abs(dy) > Math.abs(dx)) {
            // Vertical connection
            if (dy > 0) {
              // Target is below source - source uses bottom, target uses top
              sourceHandle = 'bottom';
              targetHandle = 'top-target';
            } else {
              // Target is above source - source uses top, target uses bottom
              sourceHandle = 'top';
              targetHandle = 'bottom-target';
            }
          } else {
            // Horizontal connection
            if (dx > 0) {
              // Target is to the right - source uses right, target uses left
              sourceHandle = 'right';
              targetHandle = 'left-target';
            } else {
              // Target is to the left - source uses left, target uses right
              sourceHandle = 'left';
              targetHandle = 'right-target';
            }
          }
          
          const newEdge = {
            id: `bump-${node.id}-${targetNode.id}`,
            source: node.id,
            target: targetNode.id,
            sourceHandle,
            targetHandle,
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
          };
          
          setEdges(currentEdges => [...currentEdges, newEdge]);
          console.log(`✨ Bump Connect: ${node.data.name} → ${targetNode.data.name}`);
        }
      });
    }
    
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
    <div className="w-full h-screen bg-gray-50 relative">
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
              {nodes.some(n => n.data.proximityLevel === 'CONNECTION') ? 'YES' : 'NO'}
            </span>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border">
        <div className="text-sm font-semibold mb-2">Proximity Zones</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full opacity-50"></div>
            <span>AWARENESS (200px)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full opacity-60"></div>
            <span>INTEREST (120px)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full opacity-70"></div>
            <span>CONNECTION (80px)</span>
          </div>
        </div>
      </div>
    </div>
  );
}