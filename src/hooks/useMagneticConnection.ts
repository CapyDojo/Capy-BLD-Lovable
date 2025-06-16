
import { useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useMagneticZones } from './useMagneticZones';
import { useOwnershipModal } from './useOwnershipModal';
import { useDragHandling } from './useDragHandling';

export const useMagneticConnection = (
  nodes: Node[],
  edges: Edge[],
  onConnect: (connection: { source: string; target: string; label: string }) => void
) => {
  const { isDragging, draggedNodeId, handleNodeDragStart, handleNodeDragStop } = useDragHandling();
  
  const { magneticZones, connectionPreview, updateMagneticZones, clearMagneticZones } = useMagneticZones(nodes, edges);
  
  const { 
    showOwnershipModal, 
    openOwnershipModal, 
    handleOwnershipConfirm, 
    closeOwnershipModal
  } = useOwnershipModal(onConnect);

  const handleNodeDrag = useCallback((nodeId: string, newPosition: { x: number; y: number }) => {
    if (isDragging && draggedNodeId === nodeId) {
      const draggedNode = nodes.find(n => n.id === nodeId);
      if (draggedNode) {
        console.log('🎯 Node dragging:', nodeId, newPosition);
        updateMagneticZones(draggedNode, newPosition);
      }
    }
  }, [isDragging, draggedNodeId, nodes, updateMagneticZones]);

  const handleNodeDragStopWithConnection = useCallback(() => {
    console.log('🎯 Magnetic drag stop, checking for snap zones. Zones:', magneticZones);
    // Check for snap zone connection
    const snapZone = magneticZones.find(zone => zone.zone === 'snap');
    if (snapZone && draggedNodeId && connectionPreview) {
      console.log('🎯 Creating connection:', connectionPreview);
      openOwnershipModal({
        source: connectionPreview.sourceId,
        target: connectionPreview.targetId
      });
    }

    handleNodeDragStop();
    clearMagneticZones();
  }, [magneticZones, draggedNodeId, connectionPreview, handleNodeDragStop, clearMagneticZones, openOwnershipModal]);

  return {
    isDragging,
    draggedNodeId,
    magneticZones,
    connectionPreview,
    showOwnershipModal,
    handleNodeDragStart,
    handleNodeDrag,
    handleNodeDragStop: handleNodeDragStopWithConnection,
    handleOwnershipConfirm,
    closeOwnershipModal
  };
};
