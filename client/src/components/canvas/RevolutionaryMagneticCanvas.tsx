import React, { useCallback, useEffect, useRef } from 'react';
import { Node, Edge, OnNodeDrag, useReactFlow } from '@xyflow/react';
import { useMagneticDragEngine } from '@/hooks/useMagneticDragEngine';
import { useCollisionPhysics } from '@/hooks/useCollisionPhysics';
import { MagneticFieldRenderer } from './MagneticFieldRenderer';
import { ConnectionAnimator } from './ConnectionAnimator';
import { ReactFlowCanvas } from './ReactFlowCanvas';

interface RevolutionaryMagneticCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: any) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
}

export const RevolutionaryMagneticCanvas: React.FC<RevolutionaryMagneticCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onDrop,
  onDragOver,
}) => {
  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();
  const successConnectionsRef = useRef<Array<{
    sourcePoint: { x: number; y: number };
    targetPoint: { x: number; y: number };
    timestamp: number;
  }>>([]);

  // Initialize collision physics
  const { settings: collisionSettings, resolveCollision } = useCollisionPhysics();

  // Handle successful connections with animation
  const handleConnection = useCallback((connection: { source: string; target: string; percentage: number }) => {
    console.log('🎯 Revolutionary magnetic connection created:', connection);
    
    // Find source and target nodes for animation
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    
    if (sourceNode && targetNode) {
      // Convert node positions to screen coordinates for animation
      const sourceScreenPos = flowToScreenPosition({
        x: sourceNode.position.x + 100,
        y: sourceNode.position.y + 68,
      });
      const targetScreenPos = flowToScreenPosition({
        x: targetNode.position.x + 100,
        y: targetNode.position.y,
      });

      // Add success animation
      successConnectionsRef.current = [
        ...successConnectionsRef.current,
        {
          sourcePoint: sourceScreenPos,
          targetPoint: targetScreenPos,
          timestamp: Date.now(),
        }
      ];

      // Clean up old animations
      setTimeout(() => {
        successConnectionsRef.current = successConnectionsRef.current.filter(
          anim => Date.now() - anim.timestamp < 2000
        );
      }, 2100);
    }

    // Create the actual connection
    onConnect(connection);
  }, [nodes, flowToScreenPosition, onConnect]);

  // Initialize revolutionary magnetic drag engine
  const {
    isDragging,
    draggedNodeId,
    hoveredNodeId,
    magneticZones,
    connectionPreview,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    handleNodeHover,
    cleanup,
    magneticConfig,
  } = useMagneticDragEngine(nodes, handleConnection);

  // Enhanced node drag handler with collision physics
  const handleNodeDragWithPhysics: OnNodeDrag = useCallback((event, node, nodes) => {
    const newPosition = { x: node.position.x, y: node.position.y };
    
    // Apply collision physics
    const resolvedPosition = resolveCollision(node, newPosition, nodes);
    
    // Update magnetic zones
    handleDrag(node.id, resolvedPosition);
    
    // Apply position changes
    const updatedNode = { ...node, position: resolvedPosition };
    onNodesChange([{ id: node.id, type: 'position', position: resolvedPosition }]);
  }, [resolveCollision, handleDrag, onNodesChange]);

  // Enhanced drag start handler
  const handleNodeDragStartEnhanced: OnNodeDrag = useCallback((event, node) => {
    handleDragStart(node.id);
  }, [handleDragStart]);

  // Enhanced drag end handler
  const handleNodeDragEndEnhanced: OnNodeDrag = useCallback((event, node) => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Handle mouse events for preview mode
  const handleMouseEnter = useCallback((event: React.MouseEvent, node: Node) => {
    if (!isDragging) {
      handleNodeHover(node.id);
    }
  }, [isDragging, handleNodeHover]);

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      handleNodeHover(null);
    }
  }, [isDragging, handleNodeHover]);

  // Enhanced nodes with magnetic field data and hover handlers
  const enhancedNodes = nodes.map(node => {
    const magneticZone = magneticZones.find(zone => zone.nodeId === node.id);
    return {
      ...node,
      data: {
        ...node.data,
        magneticZone: magneticZone?.zone,
        isBeingDragged: draggedNodeId === node.id,
        isDragTarget: Boolean(magneticZone),
        onMouseEnter: (event: React.MouseEvent) => handleMouseEnter(event, node),
        onMouseLeave: handleMouseLeave,
      }
    };
  });

  // Magnetic zones are already in flow coordinates, no transformation needed
  const screenMagneticZones = magneticZones;

  const screenConnectionPreview = connectionPreview;

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Enhanced ReactFlow Canvas */}
      <ReactFlowCanvas
        nodes={enhancedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDragStart={handleNodeDragStartEnhanced}
        onNodeDrag={handleNodeDragWithPhysics}
        onNodeDragStop={handleNodeDragEndEnhanced}
      />

      {/* Revolutionary Magnetic Field Overlay */}
      <MagneticFieldRenderer
        magneticZones={screenMagneticZones}
        connectionPreview={screenConnectionPreview}
        isDragging={isDragging}
        isPreview={!isDragging && hoveredNodeId !== null}
      />

      {/* Success Animation System */}
      <ConnectionAnimator
        successConnections={successConnectionsRef.current}
      />

      {/* Dynamic cursor styling */}
      <style>{`
        .react-flow__node[data-magnetic-zone="detection"] {
          cursor: grab;
          animation: entity-breathing 2s ease-in-out infinite;
        }
        
        .react-flow__node[data-magnetic-zone="strongPull"] {
          cursor: grab;
          animation: entity-breathing-strong 1s ease-in-out infinite;
          filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.5));
        }
        
        .react-flow__node[data-magnetic-zone="snap"] {
          cursor: grabbing;
          animation: entity-breathing-snap 0.5s ease-in-out infinite;
          filter: drop-shadow(0 0 15px rgba(6, 182, 212, 0.7));
        }
        
        .react-flow__node[data-is-being-dragged="true"] {
          cursor: grabbing;
          transform: scale(1.05);
          filter: drop-shadow(0 0 20px rgba(6, 182, 212, 0.8));
          z-index: 1000;
        }
        
        .react-flow__node[data-is-preview="true"] {
          cursor: grab;
          animation: entity-preview-hint 3s ease-in-out infinite;
        }

        @keyframes entity-breathing {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        
        @keyframes entity-breathing-strong {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes entity-breathing-snap {
          0%, 100% { transform: scale(1.05); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes entity-preview-hint {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};