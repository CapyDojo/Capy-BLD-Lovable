
import React, { useCallback } from 'react';
import { 
  ReactFlow, 
  Node, 
  Edge,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { EntityNode } from './EntityNode';
import { useNavigate } from 'react-router-dom';

const nodeTypes = {
  entity: EntityNode,
};

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

export const EntityCanvasCore: React.FC<EntityCanvasCoreProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onDrop,
  onDragOver,
  reactFlowWrapper,
}) => {
  const navigate = useNavigate();

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    navigate(`/cap-table?entityId=${node.id}`);
  }, [navigate]);

  return (
    <div className="flex-1 relative" ref={reactFlowWrapper}>
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
        <p className="text-sm text-gray-600">
          💡 <strong>Tip:</strong> Double-click an entity to view its cap table
        </p>
      </div>
      
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
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
      </ReactFlowProvider>
    </div>
  );
};
