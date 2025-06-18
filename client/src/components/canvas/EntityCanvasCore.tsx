
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
import { RevolutionaryMagneticCanvas } from './RevolutionaryMagneticCanvas';
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

// Inner component that uses the revolutionary magnetic connection system
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

  return (
    <RevolutionaryMagneticCanvas
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
    />
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
