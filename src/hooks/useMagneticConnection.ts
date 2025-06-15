
import { useState, useCallback, useRef, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';

interface MagneticZone {
  nodeId: string;
  zone: 'detection' | 'strongPull' | 'snap' | null;
  distance: number;
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
    if (distance <= 20) return 'snap';
    if (distance <= 40) return 'strongPull';
    if (distance <= 80) return 'detection';
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
    const rect = node.data?.basePosition || node.position;
    const width = 200; // Default node width
    const height = 80; // Default node height
    
    const points = {
      top: { x: rect.x + width / 2, y: rect.y },
      bottom: { x: rect.x + width / 2, y: rect.y + height }
    };

    // Individuals only have bottom connector
    if (node.type === 'shareholder') {
      return { bottom: points.bottom };
    }

    return points;
  }, []);

  const updateMagneticZones = useCallback((draggedNode: Node, mousePosition: { x: number; y: number }) => {
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(() => {
        const newZones: MagneticZone[] = [];
        let closestSnap: MagneticZone | null = null;

        nodes.forEach(node => {
          if (node.id === draggedNode.id) return;
          
          if (!isValidConnection(draggedNode.id, node.id)) return;

          const draggedPoints = getConnectionPoints(draggedNode);
          const targetPoints = getConnectionPoints(node);

          // Check all valid connection combinations
          Object.entries(draggedPoints).forEach(([draggedPoint, draggedPos]) => {
            Object.entries(targetPoints).forEach(([targetPoint, targetPos]) => {
              // Only allow valid connections (bottom to top, top to bottom)
              if (draggedPoint === targetPoint) return;
              
              const distance = calculateDistance(mousePosition, targetPos);
              const zone = getMagneticZone(distance);

              if (zone) {
                const magneticZone: MagneticZone = {
                  nodeId: node.id,
                  zone,
                  distance
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
                }
              }
            });
          });
        });

        if (!closestSnap) {
          setConnectionPreview(null);
        }

        setMagneticZones(newZones);
        animationFrameRef.current = undefined;
      });
    }
  }, [nodes, isValidConnection, getConnectionPoints, calculateDistance, getMagneticZone]);

  const handleDragStart = useCallback((nodeId: string) => {
    setIsDragging(true);
    setDraggedNodeId(nodeId);
  }, []);

  const handleDragEnd = useCallback(() => {
    // Check for snap zone connection
    const snapZone = magneticZones.find(zone => zone.zone === 'snap');
    if (snapZone && draggedNodeId && connectionPreview) {
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
      onConnect({
        source: pendingConnection.source,
        target: pendingConnection.target,
        label: `${percentage}%`
      });
    }
    setShowOwnershipModal(false);
    setPendingConnection(null);
  }, [pendingConnection, onConnect]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (isDragging && draggedNodeId) {
      const draggedNode = nodes.find(n => n.id === draggedNodeId);
      if (draggedNode) {
        updateMagneticZones(draggedNode, { x: event.clientX, y: event.clientY });
      }
    }
  }, [isDragging, draggedNodeId, nodes, updateMagneticZones]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isDragging, handleMouseMove]);

  return {
    isDragging,
    draggedNodeId,
    magneticZones,
    connectionPreview,
    showOwnershipModal,
    handleDragStart,
    handleDragEnd,
    handleOwnershipConfirm,
    setShowOwnershipModal
  };
};
