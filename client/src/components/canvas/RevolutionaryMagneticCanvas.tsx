import React, { useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  ReactFlowProvider,
  Node,
  Edge,
  OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { EntityNode } from './EntityNode';

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

  return (
    <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
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