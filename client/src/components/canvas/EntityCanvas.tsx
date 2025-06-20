
import React from 'react';
import { EntitySidebar } from './EntitySidebar';
import { EntityCanvasCore } from './EntityCanvasCore';
import { EntityDetailsPanel } from './EntityDetailsPanel';
import { useEntityCanvas } from '@/hooks/useEntityCanvas';

export const EntityCanvas: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    selectedNode,
    sidebarOpen,
    setSidebarOpen,
    reactFlowWrapper,
    createNode,
    onDragOver,
    onDrop,
    updateSelectedNode,
    deleteSelectedNode,
  } = useEntityCanvas();

  // Ensure panel opens when a node is selected
  React.useEffect(() => {
    if (selectedNode) {
      setSidebarOpen(true);
    }
  }, [selectedNode, setSidebarOpen]);

  return (
    <div className="h-full flex">
      <div className="w-64 bg-white border-r border-gray-200">
        <EntitySidebar onCreateNode={createNode} />
      </div>
      
      <EntityCanvasCore
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        reactFlowWrapper={reactFlowWrapper}
      />

      {selectedNode && (
        <EntityDetailsPanel
          selectedNode={selectedNode}
          isOpen={sidebarOpen && !!selectedNode}
          onClose={() => {
            setSidebarOpen(false);
          }}
          onDelete={deleteSelectedNode}
          onUpdateNode={updateSelectedNode}
        />
      )}
    </div>
  );
};
