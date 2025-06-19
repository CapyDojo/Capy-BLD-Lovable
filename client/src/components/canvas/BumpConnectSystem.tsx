import React, { useCallback, useEffect, useState } from 'react';
import { Node, useReactFlow } from '@xyflow/react';

interface HandlePosition {
  x: number;
  y: number;
  nodeId: string;
  type: 'top' | 'bottom';
}

interface DetectionZone {
  level: 'outer' | 'middle' | 'inner';
  radius: number;
  color: string;
  pulseSpeed: string;
}

interface BumpConnectSystemProps {
  nodes: Node[];
  draggingNode: Node | null;
  onAutoConnect: (source: string, target: string, percentage: number) => void;
}

const DETECTION_ZONES: Record<string, DetectionZone> = {
  outer: { level: 'outer', radius: 90, color: 'orange', pulseSpeed: 'animate-pulse' },
  middle: { level: 'middle', radius: 60, color: 'amber', pulseSpeed: 'animate-pulse-fast' },
  inner: { level: 'inner', radius: 30, color: 'green', pulseSpeed: 'animate-none' }
};

export const BumpConnectSystem: React.FC<BumpConnectSystemProps> = ({
  nodes,
  draggingNode,
  onAutoConnect
}) => {
  const { getNode } = useReactFlow();
  const [activeDetections, setActiveDetections] = useState<Map<string, DetectionZone>>(new Map());
  const [autoConnections, setAutoConnections] = useState<Set<string>>(new Set());

  // Calculate handle positions for a node
  const getHandlePositions = useCallback((node: Node): { top: HandlePosition; bottom: HandlePosition } => {
    const nodeElement = document.querySelector(`[data-id="${node.id}"]`);
    if (!nodeElement) {
      return {
        top: { x: node.position.x + 90, y: node.position.y, nodeId: node.id, type: 'top' },
        bottom: { x: node.position.x + 90, y: node.position.y + 80, nodeId: node.id, type: 'bottom' }
      };
    }

    const rect = nodeElement.getBoundingClientRect();
    const centerX = node.position.x + (rect.width / 2);
    
    return {
      top: { x: centerX, y: node.position.y, nodeId: node.id, type: 'top' },
      bottom: { x: centerX, y: node.position.y + rect.height, nodeId: node.id, type: 'bottom' }
    };
  }, []);

  // Calculate distance between two points
  const calculateDistance = useCallback((pos1: HandlePosition, pos2: HandlePosition): number => {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
  }, []);

  // Get detection zone level based on distance
  const getDetectionZone = useCallback((distance: number): DetectionZone | null => {
    if (distance <= DETECTION_ZONES.inner.radius) return DETECTION_ZONES.inner;
    if (distance <= DETECTION_ZONES.middle.radius) return DETECTION_ZONES.middle;
    if (distance <= DETECTION_ZONES.outer.radius) return DETECTION_ZONES.outer;
    return null;
  }, []);

  // Calculate ownership percentage based on existing cap table
  const calculateOwnershipPercentage = useCallback((targetNodeId: string): number => {
    // Default to 50% for now - will integrate with cap table data
    return 50;
  }, []);

  // Main detection logic
  useEffect(() => {
    if (!draggingNode) {
      setActiveDetections(new Map());
      return;
    }

    const seekerHandles = getHandlePositions(draggingNode);
    const newDetections = new Map<string, DetectionZone>();
    const newConnections = new Set<string>();

    // Check all other nodes for proximity
    nodes.forEach(targetNode => {
      if (targetNode.id === draggingNode.id) return;

      const targetHandles = getHandlePositions(targetNode);

      // Check Seeker TH → Target BH (orange connection)
      const thToBhDistance = calculateDistance(seekerHandles.top, targetHandles.bottom);
      const thToBhZone = getDetectionZone(thToBhDistance);
      
      if (thToBhZone) {
        const detectionKey = `${draggingNode.id}-TH-${targetNode.id}-BH`;
        newDetections.set(detectionKey, thToBhZone);

        // Auto-connect at inner zone
        if (thToBhZone.level === 'inner') {
          const connectionKey = `${draggingNode.id}-${targetNode.id}`;
          if (!autoConnections.has(connectionKey)) {
            const percentage = calculateOwnershipPercentage(targetNode.id);
            onAutoConnect(draggingNode.id, targetNode.id, percentage);
            newConnections.add(connectionKey);
            console.log('🎯 Auto-connected TH→BH:', draggingNode.data.name, '→', targetNode.data.name, `${percentage}%`);
          }
        }
      }

      // Check Seeker BH → Target TH (purple connection)
      const bhToThDistance = calculateDistance(seekerHandles.bottom, targetHandles.top);
      const bhToThZone = getDetectionZone(bhToThDistance);
      
      if (bhToThZone) {
        const detectionKey = `${draggingNode.id}-BH-${targetNode.id}-TH`;
        newDetections.set(detectionKey, bhToThZone);

        // Auto-connect at inner zone
        if (bhToThZone.level === 'inner') {
          const connectionKey = `${draggingNode.id}-${targetNode.id}`;
          if (!autoConnections.has(connectionKey)) {
            const percentage = calculateOwnershipPercentage(targetNode.id);
            onAutoConnect(draggingNode.id, targetNode.id, percentage);
            newConnections.add(connectionKey);
            console.log('🎯 Auto-connected BH→TH:', draggingNode.data.name, '→', targetNode.data.name, `${percentage}%`);
          }
        }
      }
    });

    setActiveDetections(newDetections);
    setAutoConnections(prev => {
      const prevArray = Array.from(prev);
      const newArray = Array.from(newConnections);
      return new Set([...prevArray, ...newArray]);
    });
  }, [draggingNode, nodes, getHandlePositions, calculateDistance, getDetectionZone, calculateOwnershipPercentage, onAutoConnect, autoConnections]);

  // Render detection zones
  return (
    <div className="absolute inset-0 pointer-events-none">
      {draggingNode && Array.from(activeDetections.entries()).map(([detectionKey, zone]) => {
        const [seekerInfo, targetInfo] = detectionKey.split('-').slice(1);
        const isOrangeConnection = seekerInfo === 'TH' && targetInfo.endsWith('BH');
        const isPurpleConnection = seekerInfo === 'BH' && targetInfo.endsWith('TH');
        
        const seekerHandles = getHandlePositions(draggingNode);
        const handlePos = seekerInfo === 'TH' ? seekerHandles.top : seekerHandles.bottom;
        
        const baseColor = isOrangeConnection ? 'orange' : isPurpleConnection ? 'purple' : 'blue';
        const intensity = zone.level === 'inner' ? '500' : zone.level === 'middle' ? '400' : '300';
        const colorClass = `bg-${baseColor}-${intensity}/30`;
        
        return (
          <div
            key={detectionKey}
            className={`absolute rounded-full border-2 border-${baseColor}-${intensity} ${colorClass} ${zone.pulseSpeed}`}
            style={{
              left: handlePos.x - zone.radius,
              top: handlePos.y - zone.radius,
              width: zone.radius * 2,
              height: zone.radius * 2,
              zIndex: zone.level === 'inner' ? 30 : zone.level === 'middle' ? 20 : 10
            }}
          >
            {zone.level === 'inner' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-xs font-bold bg-green-500 px-2 py-1 rounded">
                  🧲 CONNECT
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};