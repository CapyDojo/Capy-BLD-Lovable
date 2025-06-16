
import { useState, useCallback } from 'react';

export const useDragHandling = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  const handleNodeDragStart = useCallback((nodeId: string) => {
    console.log('🎯 Magnetic drag start:', nodeId);
    setIsDragging(true);
    setDraggedNodeId(nodeId);
  }, []);

  const handleNodeDragStop = useCallback(() => {
    console.log('🎯 Magnetic drag stop');
    setIsDragging(false);
    setDraggedNodeId(null);
  }, []);

  return {
    isDragging,
    draggedNodeId,
    handleNodeDragStart,
    handleNodeDragStop
  };
};
