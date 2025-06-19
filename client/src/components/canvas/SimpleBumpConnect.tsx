import React, { useState, useEffect, useCallback } from 'react';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, Node, Edge } from '@xyflow/react';
import { unifiedEntityService } from '../../services/UnifiedEntityService';

interface ProximityCircle {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  label: string;
}

// Simple Entity Node
const EntityNode = ({ data }: any) => {
  return (
    <div className={`
      px-4 py-2 rounded-lg border-2 bg-white shadow-lg transition-all duration-200
      ${data.isMagnetic ? 'border-blue-500 shadow-blue-500 shadow-lg' : 'border-gray-300'}
      hover:shadow-xl cursor-move relative
    `}>
      <div className="font-semibold text-gray-800">{data.name}</div>
      <div className="text-xs text-gray-500">{data.type}</div>
      {data.jurisdiction && (
        <div className="text-xs text-gray-400">{data.jurisdiction}</div>
      )}
    </div>
  );
};

const nodeTypes = {
  entity: EntityNode,
};

export default function SimpleBumpConnect() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [draggingNode, setDraggingNode] = useState<Node | null>(null);
  const [proximityCircles, setProximityCircles] = useState<ProximityCircle[]>([]);
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading Simple Bump Connect data...');
        
        const entities = await unifiedEntityService.getAllEntities();
        console.log(`Loaded ${entities?.length || 0} entities`);
        
        const nodeData = (entities || []).map((entity, index) => ({
          id: entity.id,
          type: 'entity',
          position: entity.position || { 
            x: (index % 3) * 250 + 100, 
            y: Math.floor(index / 3) * 150 + 100 
          },
          data: {
            name: entity.name,
            type: entity.type,
            jurisdiction: entity.jurisdiction,
            isMagnetic: false,
          }
        }));
        
        setNodes(nodeData);
        setLoading(false);
        console.log('Simple Bump Connect initialized');
        
      } catch (error) {
        console.error('Simple Bump Connect loading error:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Calculate distance between two points
  const calculateDistance = (pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  // Handle drag start
  const onNodeDragStart = useCallback((event: any, node: Node) => {
    console.log(`Seeker activated: ${node.data.name}`);
    setDraggingNode(node);
    
    // Activate magnetic state
    setNodes(currentNodes => 
      currentNodes.map(n => ({
        ...n,
        data: { ...n.data, isMagnetic: n.id === node.id }
      }))
    );
  }, []);
  
  // Handle drag
  const onNodeDrag = useCallback((event: any, node: Node) => {
    if (!draggingNode || draggingNode.id !== node.id) return;
    
    const circles: ProximityCircle[] = [];
    
    nodes.forEach(targetNode => {
      if (targetNode.id === node.id) return;
      
      const distance = calculateDistance(node.position, targetNode.position);
      
      // 3-Zone Detection System
      if (distance <= 90) {
        circles.push({
          id: `zone-90-${targetNode.id}`,
          x: targetNode.position.x,
          y: targetNode.position.y,
          size: 90,
          color: '#ff6b35',
          opacity: 0.3,
          label: 'AWARENESS'
        });
      }
      if (distance <= 60) {
        circles.push({
          id: `zone-60-${targetNode.id}`,
          x: targetNode.position.x,
          y: targetNode.position.y,
          size: 60,
          color: '#8b5cf6',
          opacity: 0.4,
          label: 'INTEREST'
        });
      }
      if (distance <= 30) {
        circles.push({
          id: `zone-30-${targetNode.id}`,
          x: targetNode.position.x,
          y: targetNode.position.y,
          size: 30,
          color: '#10b981',
          opacity: 0.5,
          label: 'CONNECTION'
        });
      }
    });
    
    setProximityCircles(circles);
    
    if (circles.length > 0) {
      console.log(`Proximity detected: ${circles.length} zones active`);
    }
  }, [draggingNode, nodes]);
  
  // Handle drag stop
  const onNodeDragStop = useCallback((event: any, node: Node) => {
    console.log(`Seeker deactivated: ${node.data.name}`);
    setDraggingNode(null);
    setProximityCircles([]);
    
    // Remove magnetic state
    setNodes(currentNodes => 
      currentNodes.map(n => ({
        ...n,
        data: { ...n.data, isMagnetic: false }
      }))
    );
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading Simple Bump Connect...</div>
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
        fitView
        className="bg-gray-50"
      >
        <Controls />
        <Background gap={20} size={1} color="#e5e7eb" />
      </ReactFlow>
      
      {/* 3-Zone Proximity Detection Circles */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1000 }}>
        {proximityCircles.map(circle => (
          <div
            key={circle.id}
            className="absolute border-2 border-white rounded-full flex items-center justify-center"
            style={{
              left: circle.x,
              top: circle.y,
              width: circle.size * 2,
              height: circle.size * 2,
              backgroundColor: circle.color,
              opacity: circle.opacity,
              transform: 'translate(-50%, -50%)',
              animation: circle.size === 30 ? 'pulse 1s infinite' : 'none',
              boxShadow: circle.size === 30 ? '0 0 20px rgba(16, 185, 129, 0.5)' : 'none',
            }}
          >
            <span className="text-white text-xs font-bold">
              {circle.label}
            </span>
          </div>
        ))}
      </div>
      
      {/* Status Display */}
      {draggingNode && (
        <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg z-50">
          <div className="font-semibold text-gray-800">
            Seeker: {draggingNode.data.name}
          </div>
          <div className="text-sm text-gray-600">
            Active Zones: {proximityCircles.length}
          </div>
          <div className="text-sm text-green-600">
            Connection Ready: {proximityCircles.filter(c => c.size === 30).length > 0 ? 'YES' : 'NO'}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
        }
      `}</style>
    </div>
  );
}