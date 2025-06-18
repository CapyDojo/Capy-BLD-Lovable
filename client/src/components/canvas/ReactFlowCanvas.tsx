
import React, { useCallback } from 'react';
import { 
  ReactFlow, 
  Node, 
  Edge,
  Background,
  Controls,
  MiniMap,
  OnNodeDrag
} from '@xyflow/react';
import { EntityNode } from './EntityNode';
import { useLocation } from 'wouter';

const nodeTypes = {
  entity: EntityNode,
};

interface ReactFlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: any) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onNodeDragStart: OnNodeDrag;
  onNodeDrag: OnNodeDrag;
  onNodeDragStop: OnNodeDrag;
}

export const ReactFlowCanvas: React.FC<ReactFlowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onDrop,
  onDragOver,
  onNodeDragStart,
  onNodeDrag,
  onNodeDragStop,
}) => {
  const [, setLocation] = useLocation();

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    setLocation(`/cap-table?entityId=${node.id}`);
  }, [setLocation]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onNodeDoubleClick={onNodeDoubleClick}
      onNodeDragStart={onNodeDragStart}
      onNodeDrag={onNodeDrag}
      onNodeDragStop={onNodeDragStop}
      onDrop={onDrop}
      onDragOver={onDragOver}
      nodeTypes={nodeTypes}
      fitView
      className="bg-gray-50"
    >
      <Controls />
      <MiniMap 
        nodeStrokeColor="#3b82f6"
        nodeColor="#dbeafe"
        nodeBorderRadius={8}
      />
      <Background color="#e5e7eb" gap={20} />
    </ReactFlow>
  );
};
