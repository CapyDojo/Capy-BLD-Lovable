
import React, { useCallback } from 'react';
import { 
  ReactFlowProvider,
  Node, 
  Edge,
  OnNodeDrag
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ReactFlowCanvas } from './ReactFlowCanvas';
import { CanvasTipDisplay } from './CanvasTipDisplay';
import { MagneticOverlays } from './MagneticOverlays';
import { OwnershipPercentageModal } from './OwnershipPercentageModal';
import { useMagneticConnection } from '@/hooks/useMagneticConnection';
import { useReactFlowDrop } from '@/hooks/useReactFlowDrop';

interface EntityCanvasCoreProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: any) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
}

// Inner component that uses the magnetic connection hook
const ReactFlowCanvasContainer: React.FC<EntityCanvasCoreProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onDrop: externalOnDrop,
  onDragOver: externalOnDragOver,
  reactFlowWrapper: externalReactFlowWrapper,
}) => {
  console.log('🎯 ReactFlowCanvasContainer rendering with nodes:', nodes.length, 'edges:', edges.length);
  
  // Use React Flow native drop handling (with proper coordinate transformation)
  const { onDrop, onDragOver, reactFlowWrapper } = useReactFlowDrop();
  
  // Initialize magnetic connection system (now inside ReactFlowProvider)
  const {
    isDragging,
    draggedNodeId,
    magneticZones,
    connectionPreview,
    showOwnershipModal,
    handleNodeDragStart,
    handleNodeDrag,
    handleNodeDragStop,
    handleOwnershipConfirm,
    setShowOwnershipModal
  } = useMagneticConnection(nodes, edges, onConnect);

  // React Flow drag handlers
  const onNodeDragStart: OnNodeDrag = useCallback((event, node) => {
    console.log('🎯 React Flow drag start:', node.id);
    handleNodeDragStart(node.id);
  }, [handleNodeDragStart]);

  const onNodeDrag: OnNodeDrag = useCallback((event, node) => {
    handleNodeDrag(node.id, node.position);
  }, [handleNodeDrag]);

  const onNodeDragStop: OnNodeDrag = useCallback((event, node) => {
    console.log('🎯 React Flow drag stop:', node.id);
    handleNodeDragStop();
  }, [handleNodeDragStop]);

  // Enhanced onNodesChange to work with magnetic system
  const handleNodesChange = useCallback((changes: any) => {
    console.log('🎯 Nodes changing:', changes);
    onNodesChange(changes);
  }, [onNodesChange]);

  // Enhance nodes with magnetic field data
  const enhancedNodes = nodes.map(node => {
    const magneticZone = magneticZones.find(zone => zone.nodeId === node.id);
    return {
      ...node,
      data: {
        ...node.data,
        magneticZone: magneticZone?.zone,
      }
    };
  });

  // Convert viewport-relative coordinates to coordinates relative to the ReactFlow wrapper
  const getWrapperRelativePosition = useCallback((viewportPosition: { x: number; y: number }) => {
    if (!reactFlowWrapper.current) return viewportPosition;
    
    const rect = reactFlowWrapper.current.getBoundingClientRect();
    return {
      x: viewportPosition.x - rect.left,
      y: viewportPosition.y - rect.top,
    };
  }, [reactFlowWrapper]);

  return (
    <>
      <CanvasTipDisplay 
        isDragging={isDragging}
        magneticZonesCount={magneticZones.length}
      />
      
      <MagneticOverlays
        isDragging={isDragging}
        magneticZones={magneticZones}
        connectionPreview={connectionPreview}
        getWrapperRelativePosition={getWrapperRelativePosition}
      />
      
      <ReactFlowCanvas
        nodes={enhancedNodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
      />

      <OwnershipPercentageModal
        isOpen={showOwnershipModal}
        onClose={setShowOwnershipModal}
        onConfirm={handleOwnershipConfirm}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes magnetic-pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        
        @keyframes connection-preview {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        .magnetic-handle {
          transition: all 0.2s ease;
        }
        
        .magnetic-handle:hover {
          transform: scale(1.2);
        }
      `}</style>
    </>
  );
};

export const EntityCanvasCore: React.FC<EntityCanvasCoreProps> = (props) => {
  console.log('🎯 EntityCanvasCore rendering with wrapper ref:', !!props.reactFlowWrapper.current);
  
  return (
    <div className="flex-1 relative" ref={props.reactFlowWrapper}>
      <ReactFlowProvider>
        <ReactFlowCanvasContainer {...props} />
      </ReactFlowProvider>
    </div>
  );
};
