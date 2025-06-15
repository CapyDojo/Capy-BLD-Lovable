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

export const useMagneticConnection = (
  nodes: Node[],
  edges: Edge[],
  onConnect: (connection: { source: string; target: string; label: string }) => void
) => {
  const { flowToScreenPosition, getNode } = useReactFlow();
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [magneticZones, setMagneticZones] = useState<MagneticZone[]>([]);
  const [connectionPreview, setConnectionPreview] = useState<ConnectionPreview | null>(null);
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<{ source: string; target: string } | null>(null);
  
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
    
    // Convert flow coordinates to screen coordinates
    const topPoint = flowToScreenPosition({ x: position.x + width / 2, y: position.y });
    const bottomPoint = flowToScreenPosition({ x: position.x + width / 2, y: position.y + height });

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
      let closestSnap: MagneticZone | null = null;

      // Get the current dragged node with updated position
      const currentDraggedNode = { ...draggedNode, position: draggedNodePosition };
      const draggedPoints = getConnectionPoints(currentDraggedNode);

      nodes.forEach(node => {
        if (node.id === draggedNode.id) return;
        
        if (!isValidConnection(draggedNode.id, node.id)) return;

        const targetPoints = getConnectionPoints(node);

        // Check all valid connection combinations
        Object.entries(draggedPoints).forEach(([draggedPoint, draggedPos]) => {
          Object.entries(targetPoints).forEach(([targetPoint, targetPos]) => {
            // Only allow valid connections (bottom to top, top to bottom)
            if (draggedPoint === targetPoint) return;
            
            const distance = calculateDistance(draggedPos, targetPos);
            const zone = getMagneticZone(distance);

            console.log(`🎯 Distance from ${draggedNode.id} to ${node.id}: ${distance}, zone: ${zone}`);

            if (zone) {
              const magneticZone: MagneticZone = {
                nodeId: node.id,
                zone,
                distance,
                screenPosition: targetPos
              };

              newZones.push(magneticZone);

              // Track closest snap zone for preview
              if (zone === 'snap' && (!closestSnap || distance < closestSnap.distance)) {
                closestSnap = magneticZone;
                setConnectionPreview({
                  sourceId: draggedNode.id,
                  targetId: node.id,
                  sourcePosition: draggedPos,
                  targetPosition: targetPos
                });
                console.log('🎯 Setting connection preview:', draggedNode.id, '->', node.id);
              }
            }
          });
        });
      });

      if (!closestSnap) {
        setConnectionPreview(null);
      }

      console.log('🎯 New magnetic zones:', newZones);
      setMagneticZones(newZones);
      animationFrameRef.current = undefined;
    });
  }, [nodes, isValidConnection, getConnectionPoints, calculateDistance, getMagneticZone]);

  const handleNodeDragStart = useCallback((nodeId: string) => {
    console.log('🎯 Magnetic drag start:', nodeId);
    setIsDragging(true);
    setDraggedNodeId(nodeId);
  }, []);

  const handleNodeDrag = useCallback((nodeId: string, newPosition: { x: number; y: number }) => {
    if (isDragging && draggedNodeId === nodeId) {
      const draggedNode = nodes.find(n => n.id === nodeId);
      if (draggedNode) {
        console.log('🎯 Node dragging:', nodeId, newPosition);
        updateMagneticZones(draggedNode, newPosition);
      }
    }
  }, [isDragging, draggedNodeId, nodes, updateMagneticZones]);

  const handleNodeDragStop = useCallback(() => {
    console.log('🎯 Magnetic drag stop, checking for snap zones. Zones:', magneticZones);
    // Check for snap zone connection
    const snapZone = magneticZones.find(zone => zone.zone === 'snap');
    if (snapZone && draggedNodeId && connectionPreview) {
      console.log('🎯 Creating connection:', connectionPreview);
      setPendingConnection({
        source: connectionPreview.sourceId,
        target: connectionPreview.targetId
      });
      setShowOwnershipModal(true);
    }

    setIsDragging(false);
    setDraggedNodeId(null);
    setMagneticZones([]);
    setConnectionPreview(null);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  }, [magneticZones, draggedNodeId, connectionPreview]);

  const handleOwnershipConfirm = useCallback((percentage: number) => {
    if (pendingConnection) {
      console.log('🎯 Confirming ownership connection:', pendingConnection, percentage);
      onConnect({
        source: pendingConnection.source,
        target: pendingConnection.target,
        label: `${percentage}%`
      });
    }
    setShowOwnershipModal(false);
    setPendingConnection(null);
  }, [pendingConnection, onConnect]);

  return {
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
  };
};
