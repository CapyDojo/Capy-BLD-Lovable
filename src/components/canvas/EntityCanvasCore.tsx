
import React, { useCallback } from 'react';
import { 
  ReactFlow, 
  Node, 
  Edge,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  OnNodeDrag
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { EntityNode } from './EntityNode';
import { ShareholderNode } from './ShareholderNode';
import { MagneticField } from './MagneticField';
import { ConnectionPreview } from './ConnectionPreview';
import { OwnershipPercentageModal } from './OwnershipPercentageModal';
import { useMagneticConnection } from '@/hooks/useMagneticConnection';
import { useNavigate } from 'react-router-dom';

const nodeTypes = {
  entity: EntityNode,
  shareholder: ShareholderNode,
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

  // Initialize magnetic connection system
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
    console.log('🎯 React Flow drag:', node.id, node.position);
    handleNodeDrag(node.id, node.position);
  }, [handleNodeDrag]);

  const onNodeDragStop: OnNodeDrag = useCallback((event, node) => {
    console.log('🎯 React Flow drag stop:', node.id);
    handleNodeDragStop();
  }, [handleNodeDragStop]);

  // Enhanced onNodesChange to work with magnetic system
  const handleNodesChange = useCallback((changes: any) => {
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

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    navigate(`/cap-table?entityId=${node.id}`);
  }, [navigate]);

  return (
    <div className="flex-1 relative" ref={reactFlowWrapper}>
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
        <p className="text-sm text-gray-600">
          💡 <strong>Tip:</strong> Double-click an entity to view its cap table
        </p>
        {isDragging && (
          <p className="text-xs text-blue-600 mt-1 font-medium">
            🎯 Drag near another entity to create magnetic connection! Zones: {magneticZones.length}
          </p>
        )}
      </div>
      
      {/* Magnetic Field Overlays */}
      {isDragging && magneticZones.map((zone, index) => (
        <MagneticField
          key={`${zone.nodeId}-${zone.zone}-${index}`}
          zone={zone.zone!}
          nodeId={zone.nodeId}
          position={zone.screenPosition}
        />
      ))}

      {/* Connection Preview */}
      {connectionPreview && (
        <ConnectionPreview
          sourcePosition={connectionPreview.sourcePosition}
          targetPosition={connectionPreview.targetPosition}
        />
      )}
      
      <ReactFlowProvider>
        <ReactFlow
          nodes={enhancedNodes}
          edges={edges}
          onNodesChange={handleNodesChange}
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
      </ReactFlowProvider>

      {/* Ownership Percentage Modal */}
      <OwnershipPercentageModal
        isOpen={showOwnershipModal}
        onClose={() => setShowOwnershipModal(false)}
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
    </div>
  );
};
