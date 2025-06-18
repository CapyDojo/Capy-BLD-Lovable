import React, { useRef, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  ReactFlowProvider,
  Node,
  Edge,
  OnConnect,
  Connection,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { EntityNode } from './EntityNode';
import { getUnifiedRepository } from '@/services/repositories/unified';

const nodeTypes = {
  entity: EntityNode,
};

interface RevolutionaryMagneticCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: OnConnect;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
}

// Clean ReactFlow canvas - no magnetic systems
const ReactFlowCanvasContainer: React.FC<RevolutionaryMagneticCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onDrop,
  onDragOver,
}) => {
  console.log('🎯 Clean ReactFlow canvas with nodes:', nodes.length, 'edges:', edges.length);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Simple visual edge creation for testing clean canvas
  const handleConnect = useCallback((params: Connection) => {
    console.log('🔗 Visual edge connection for testing:', params);
    
    // For clean canvas testing, just create visual edge
    // Revolutionary system will handle proper ownership creation later
    onConnect(params);
    
    console.log('✅ Visual edge created - ready for revolutionary system rebuild');
  }, [onConnect]);

  return (
    <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={onNodeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

export const RevolutionaryMagneticCanvas: React.FC<RevolutionaryMagneticCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ReactFlowCanvasContainer {...props} />
    </ReactFlowProvider>
  );
};