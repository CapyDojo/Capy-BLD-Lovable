import { useState, useCallback, useRef, useMemo } from 'react';
import { Node, useReactFlow } from '@xyflow/react';

// Core magnetic configuration
const MAGNETIC_CONFIG = {
  detection: { radius: 90, color: 'rgba(139, 69, 190, 0.3)' }, // Deep purple
  strongPull: { radius: 60, color: 'rgba(59, 130, 246, 0.5)' }, // Electric blue  
  snap: { radius: 30, color: 'rgba(6, 182, 212, 0.7)' }, // Vibrant cyan
  previewAlpha: 0.15, // Subtle preview mode opacity
} as const;

export interface MagneticZone {
  nodeId: string;
  zone: 'detection' | 'strongPull' | 'snap' | 'preview';
  distance: number;
  connectionPoint: { x: number; y: number };
  targetPoint: { x: number; y: number };
  validConnection: boolean;
}

export interface ConnectionPreview {
  sourceId: string;
  targetId: string;
  sourcePoint: { x: number; y: number };
  targetPoint: { x: number; y: number };
  percentage: number;
}

interface MagneticDragState {
  isDragging: boolean;
  draggedNodeId: string | null;
  hoveredNodeId: string | null;
  magneticZones: MagneticZone[];
  connectionPreview: ConnectionPreview | null;
  recentConnections: string[]; // Magnetic fatigue tracking
}

export const useMagneticDragEngine = (
  nodes: Node[],
  onConnection: (connection: { source: string; target: string; percentage: number }) => void
) => {
  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();
  const animationFrameRef = useRef<number>();
  
  const [state, setState] = useState<MagneticDragState>({
    isDragging: false,
    draggedNodeId: null,
    hoveredNodeId: null,
    magneticZones: [],
    connectionPreview: null,
    recentConnections: [],
  });

  // Calculate connection points for an entity (top for owned, bottom for owner)
  const getConnectionPoints = useCallback((node: Node) => {
    const nodeCenter = { x: node.position.x + 100, y: node.position.y + 34 }; // Node center
    return {
      top: { x: nodeCenter.x, y: node.position.y }, // Owned entity connection
      bottom: { x: nodeCenter.x, y: node.position.y + 68 }, // Owner entity connection
    };
  }, []);

  // Validate if two entities can be connected
  const canConnect = useCallback((sourceId: string, targetId: string): boolean => {
    // Prevent self-connection
    if (sourceId === targetId) return false;
    
    // Check for magnetic fatigue (recent connections)
    const connectionKey = `${sourceId}-${targetId}`;
    if (state.recentConnections.includes(connectionKey)) return false;
    
    // TODO: Add business logic validation (circular ownership, etc.)
    return true;
  }, [state.recentConnections]);

  // Calculate distance between two points
  const calculateDistance = useCallback((p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }, []);

  // Get magnetic zone type based on distance
  const getMagneticZone = useCallback((distance: number): MagneticZone['zone'] | null => {
    if (distance <= MAGNETIC_CONFIG.snap.radius) return 'snap';
    if (distance <= MAGNETIC_CONFIG.strongPull.radius) return 'strongPull';
    if (distance <= MAGNETIC_CONFIG.detection.radius) return 'detection';
    return null;
  }, []);

  // Update magnetic zones based on current drag position
  const updateMagneticZones = useCallback((draggedNode: Node, dragPosition: { x: number; y: number }) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const newZones: MagneticZone[] = [];
      let closestSnapConnection: ConnectionPreview | null = null;
      let closestSnapDistance = Infinity;

      const draggedNodeWithPosition = { ...draggedNode, position: dragPosition };
      const draggedPoints = getConnectionPoints(draggedNodeWithPosition);

      nodes.forEach(targetNode => {
        if (targetNode.id === draggedNode.id) return;
        if (!canConnect(draggedNode.id, targetNode.id)) return;

        const targetPoints = getConnectionPoints(targetNode);

        // Check owner -> owned connection (dragged bottom to target top)
        const ownerDistance = calculateDistance(draggedPoints.bottom, targetPoints.top);
        const ownerZone = getMagneticZone(ownerDistance);
        
        if (ownerZone) {
          newZones.push({
            nodeId: targetNode.id,
            zone: ownerZone,
            distance: ownerDistance,
            connectionPoint: draggedPoints.bottom,
            targetPoint: targetPoints.top,
            validConnection: true,
          });

          if (ownerZone === 'snap' && ownerDistance < closestSnapDistance) {
            closestSnapConnection = {
              sourceId: draggedNode.id,
              targetId: targetNode.id,
              sourcePoint: draggedPoints.bottom,
              targetPoint: targetPoints.top,
              percentage: 100,
            };
            closestSnapDistance = ownerDistance;
          }
        }

        // Check owned -> owner connection (dragged top to target bottom)
        const ownedDistance = calculateDistance(draggedPoints.top, targetPoints.bottom);
        const ownedZone = getMagneticZone(ownedDistance);
        
        if (ownedZone) {
          newZones.push({
            nodeId: targetNode.id,
            zone: ownedZone,
            distance: ownedDistance,
            connectionPoint: draggedPoints.top,
            targetPoint: targetPoints.bottom,
            validConnection: true,
          });

          if (ownedZone === 'snap' && ownedDistance < closestSnapDistance) {
            closestSnapConnection = {
              sourceId: targetNode.id,
              targetId: draggedNode.id,
              sourcePoint: targetPoints.bottom,
              targetPoint: draggedPoints.top,
              percentage: 100,
            };
            closestSnapDistance = ownedDistance;
          }
        }
      });

      setState(prev => ({
        ...prev,
        magneticZones: newZones,
        connectionPreview: closestSnapConnection,
      }));
    });
  }, [nodes, getConnectionPoints, canConnect, calculateDistance, getMagneticZone]);

  // Generate preview zones for hover state
  const generatePreviewZones = useCallback((hoveredNodeId: string) => {
    const hoveredNode = nodes.find(n => n.id === hoveredNodeId);
    if (!hoveredNode) return [];

    const previewZones: MagneticZone[] = [];
    const hoveredPoints = getConnectionPoints(hoveredNode);

    nodes.forEach(targetNode => {
      if (targetNode.id === hoveredNodeId) return;
      if (!canConnect(hoveredNodeId, targetNode.id)) return;

      const targetPoints = getConnectionPoints(targetNode);

      // Add preview zones for potential connections
      previewZones.push({
        nodeId: targetNode.id,
        zone: 'preview',
        distance: MAGNETIC_CONFIG.detection.radius,
        connectionPoint: hoveredPoints.bottom,
        targetPoint: targetPoints.top,
        validConnection: true,
      });
    });

    return previewZones;
  }, [nodes, getConnectionPoints, canConnect]);

  // Drag event handlers
  const handleDragStart = useCallback((nodeId: string) => {
    setState(prev => ({
      ...prev,
      isDragging: true,
      draggedNodeId: nodeId,
      hoveredNodeId: null,
      magneticZones: [],
      connectionPreview: null,
    }));
  }, []);

  const handleDrag = useCallback((nodeId: string, newPosition: { x: number; y: number }) => {
    if (!state.isDragging || state.draggedNodeId !== nodeId) return;
    
    const draggedNode = nodes.find(n => n.id === nodeId);
    if (draggedNode) {
      updateMagneticZones(draggedNode, newPosition);
    }
  }, [state.isDragging, state.draggedNodeId, nodes, updateMagneticZones]);

  const handleDragEnd = useCallback(async () => {
    // Auto-connect if in snap zone
    if (state.connectionPreview) {
      const { sourceId, targetId, percentage } = state.connectionPreview;
      
      // Create connection with proper share class handling
      console.log('🎯 Revolutionary magnetic connection creating:', { sourceId, targetId, percentage });
      
      try {
        const { getUnifiedRepository } = await import('@/services/repositories/unified');
        const repository = await getUnifiedRepository('ENTERPRISE');
        
        // Get the target entity to find its share classes
        const targetEntity = await repository.getEntity(targetId);
        if (!targetEntity) {
          throw new Error(`Target entity ${targetId} not found`);
        }

        // Get share classes for the target entity
        const shareClasses = await repository.getShareClassesByEntity(targetId);
        let shareClassId = shareClasses.length > 0 ? shareClasses[0].id : null;

        // If no share class exists, create a default one
        if (!shareClassId) {
          const defaultShareClass = await repository.createShareClass({
            entityId: targetId,
            name: 'Common Stock',
            type: 'Common Stock' as const,
            totalAuthorizedShares: 10000,
            votingRights: true
          }, 'user');
          shareClassId = defaultShareClass.id;
        }

        // Calculate shares from percentage
        const shares = (percentage / 100) * 1000; // Convert percentage to shares

        // Create ownership in unified repository
        await repository.createOwnership({
          ownerEntityId: sourceId,
          ownedEntityId: targetId,
          shares,
          shareClassId: shareClassId!,
          effectiveDate: new Date(),
          createdBy: 'user',
          updatedBy: 'user'
        }, 'user');

        console.log('✅ Revolutionary magnetic connection created successfully');
      } catch (error) {
        console.error('❌ Error creating revolutionary magnetic connection:', error);
      }
      
      // Also call the original onConnection for UI updates
      onConnection({ source: sourceId, target: targetId, percentage });
      
      // Add magnetic fatigue
      const connectionKey = `${sourceId}-${targetId}`;
      setState(prev => ({
        ...prev,
        recentConnections: [...prev.recentConnections, connectionKey],
      }));
      
      // Remove fatigue after 2 seconds
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          recentConnections: prev.recentConnections.filter(k => k !== connectionKey),
        }));
      }, 2000);
    }

    setState(prev => ({
      ...prev,
      isDragging: false,
      draggedNodeId: null,
      magneticZones: [],
      connectionPreview: null,
    }));

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [state.connectionPreview, onConnection]);

  // Hover handlers for preview mode
  const handleNodeHover = useCallback((nodeId: string | null) => {
    if (state.isDragging) return; // Don't show preview during drag
    
    setState(prev => ({
      ...prev,
      hoveredNodeId: nodeId,
      magneticZones: nodeId ? generatePreviewZones(nodeId) : [],
    }));
  }, [state.isDragging, generatePreviewZones]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  return {
    // State
    isDragging: state.isDragging,
    draggedNodeId: state.draggedNodeId,
    hoveredNodeId: state.hoveredNodeId,
    magneticZones: state.magneticZones,
    connectionPreview: state.connectionPreview,
    
    // Handlers
    handleDragStart,
    handleDrag,
    handleDragEnd,
    handleNodeHover,
    cleanup,
    
    // Configuration
    magneticConfig: MAGNETIC_CONFIG,
  };
};