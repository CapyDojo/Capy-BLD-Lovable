
import { useState, useCallback, useRef } from 'react';
import { Node, Edge, useReactFlow } from '@xyflow/react';

interface MagneticZone {
  nodeId: string;
  zone: 'detection' | 'strongPull' | 'snap' | null;
  distance: number;
  screenPosition: { x: number; y: number };
}

interface ConnectionPreview {
  sourceId: string;
  targetId: string;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
}

export const useMagneticZones = (nodes: Node[], edges: Edge[]) => {
  const { flowToScreenPosition } = useReactFlow();
  const [magneticZones, setMagneticZones] = useState<MagneticZone[]>([]);
  const [connectionPreview, setConnectionPreview] = useState<ConnectionPreview | null>(null);
  const animationFrameRef = useRef<number>();

  const calculateDistance = useCallback((pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
  }, []);

  const getMagneticZone = useCallback((distance: number): MagneticZone['zone'] => {
    if (distance <= 50) return 'snap';
    if (distance <= 100) return 'strongPull';
    if (distance <= 150) return 'detection';
    return null;
  }, []);

  const isValidConnection = useCallback((sourceId: string, targetId: string): boolean => {
    // Prevent self-connection
    if (sourceId === targetId) return false;
    
    // Check if connection already exists
    const existingConnection = edges.find(
      edge => (edge.source === sourceId && edge.target === targetId) ||
               (edge.source === targetId && edge.target === sourceId)
    );
    if (existingConnection) return false;

    // Prevent circular ownership (simplified check)
    const sourceNode = nodes.find(n => n.id === sourceId);
    const targetNode = nodes.find(n => n.id === targetId);
    
    if (sourceNode?.type === 'shareholder' && targetNode?.type === 'shareholder') {
      return false; // Individuals can't own other individuals
    }

    return true;
  }, [nodes, edges]);

  const getConnectionPoints = useCallback((node: Node) => {
    const position = node.position;
    const width = 200; // Default node width
    const height = 80; // Default node height
    
    // Convert flow coordinates to screen coordinates relative to the ReactFlow component
    const topPoint = flowToScreenPosition({ x: position.x + width / 2, y: position.y });
    const bottomPoint = flowToScreenPosition({ x: position.x + width / 2, y: position.y + height });

    console.log(`🎯 Connection points for ${node.id}:`, {
      flowPosition: position,
      topPoint,
      bottomPoint
    });

    const points = {
      top: topPoint,
      bottom: bottomPoint
    };

    // Individuals only have bottom connector
    if (node.type === 'shareholder') {
      return { bottom: points.bottom };
    }

    return points;
  }, [flowToScreenPosition]);

  const updateMagneticZones = useCallback((draggedNode: Node, draggedNodePosition: { x: number; y: number }) => {
    console.log('🎯 Updating magnetic zones for:', draggedNode.id, 'at position:', draggedNodePosition);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const newZones: MagneticZone[] = [];
      let closestSnapConnection: (ConnectionPreview & { distance: number }) | null = null;

      // Get the current dragged node with updated position
      const currentDraggedNode = { ...draggedNode, position: draggedNodePosition };
      const draggedPoints = getConnectionPoints(currentDraggedNode);

      nodes.forEach(node => {
        if (node.id === draggedNode.id) return;
        
        if (!isValidConnection(draggedNode.id, node.id)) return;

        const targetPoints = getConnectionPoints(node);

        const potentialConnections: Array<ConnectionPreview & { distance: number }> = [];

        // Possibility 1: dragged node is owner (bottom handle) -> target node is owned (top handle)
        if (draggedPoints.bottom && 'top' in targetPoints && targetPoints.top) {
          const distance = calculateDistance(draggedPoints.bottom, targetPoints.top);
          potentialConnections.push({
            sourceId: draggedNode.id,
            targetId: node.id,
            sourcePosition: draggedPoints.bottom,
            targetPosition: targetPoints.top,
            distance,
          });
        }
        
        // Possibility 2: target node is owner (bottom handle) -> dragged node is owned (top handle)
        if (targetPoints.bottom && 'top' in draggedPoints && draggedPoints.top) {
          const distance = calculateDistance(targetPoints.bottom, draggedPoints.top);
          potentialConnections.push({
            sourceId: node.id,
            targetId: draggedNode.id,
            sourcePosition: targetPoints.bottom,
            targetPosition: draggedPoints.top,
            distance,
          });
        }

        if (potentialConnections.length > 0) {
          // Find the closest of the potential connections for this node pair
          const bestConnection = potentialConnections.sort((a, b) => a.distance - b.distance)[0];
          const { distance, sourceId, targetId, sourcePosition, targetPosition } = bestConnection;
          const zone = getMagneticZone(distance);

          if (zone) {
            newZones.push({
              nodeId: node.id,
              zone,
              distance,
              // The magnetic field should be on the handle of the non-dragged node.
              screenPosition: draggedNode.id === sourceId ? targetPosition : sourcePosition,
            });

            // If this is the closest snap connection found so far, store it
            if (zone === 'snap' && (!closestSnapConnection || distance < closestSnapConnection.distance)) {
              closestSnapConnection = bestConnection;
            }
          }
        }
      });

      if (closestSnapConnection) {
        setConnectionPreview(closestSnapConnection);
        console.log('🎯 Setting connection preview:', closestSnapConnection.sourceId, '->', closestSnapConnection.targetId);
      } else {
        setConnectionPreview(null);
      }

      console.log('🎯 New magnetic zones:', newZones);
      setMagneticZones(newZones);
      animationFrameRef.current = undefined;
    });
  }, [nodes, isValidConnection, getConnectionPoints, calculateDistance, getMagneticZone]);

  const clearMagneticZones = useCallback(() => {
    setMagneticZones([]);
    setConnectionPreview(null);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  }, []);

  return {
    magneticZones,
    connectionPreview,
    updateMagneticZones,
    clearMagneticZones
  };
};
