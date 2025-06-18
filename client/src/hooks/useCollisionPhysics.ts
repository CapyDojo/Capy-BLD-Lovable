import { useCallback, useState, useEffect } from 'react';
import { Node } from '@xyflow/react';

interface CollisionSettings {
  bounceEnabled: boolean;
  bounceStrength: number;
  preventOverlap: boolean;
  minDistance: number; // Minimum distance between node centers
}

interface CollisionState {
  settings: CollisionSettings;
}

export const useCollisionPhysics = () => {
  const [state, setState] = useState<CollisionState>({
    settings: {
      bounceEnabled: true,
      bounceStrength: 0.3,
      preventOverlap: true,
      minDistance: 220, // Node width (200) + 20px padding
    },
  });

  // Listen for settings updates from Settings page
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      const { physicsSettings } = event.detail;
      if (physicsSettings) {
        setState(prev => ({
          ...prev,
          settings: physicsSettings,
        }));
      }
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    
    // Load saved settings on mount
    const savedSettings = localStorage.getItem('physicsSettings');
    if (savedSettings) {
      const physicsSettings = JSON.parse(savedSettings);
      setState(prev => ({
        ...prev,
        settings: physicsSettings,
      }));
    }

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    };
  }, []);

  // Check if two nodes would overlap at given positions
  const checkCollision = useCallback((
    nodeA: { position: { x: number; y: number }; id: string },
    nodeB: { position: { x: number; y: number }; id: string }
  ): boolean => {
    if (nodeA.id === nodeB.id) return false;
    
    const distance = Math.sqrt(
      Math.pow(nodeB.position.x - nodeA.position.x, 2) + 
      Math.pow(nodeB.position.y - nodeA.position.y, 2)
    );
    
    return distance < state.settings.minDistance;
  }, [state.settings.minDistance]);

  // Calculate bounce velocity when collision occurs
  const calculateBounce = useCallback((
    movingNode: { position: { x: number; y: number } },
    staticNode: { position: { x: number; y: number } }
  ): { x: number; y: number } => {
    const dx = movingNode.position.x - staticNode.position.x;
    const dy = movingNode.position.y - staticNode.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return { x: 0, y: 0 };
    
    // Normalize direction and apply bounce strength
    const normalizedX = dx / distance;
    const normalizedY = dy / distance;
    
    return {
      x: normalizedX * state.settings.bounceStrength * 50,
      y: normalizedY * state.settings.bounceStrength * 50,
    };
  }, [state.settings.bounceStrength]);

  // Resolve collision by adjusting position
  const resolveCollision = useCallback((
    draggedNode: Node,
    newPosition: { x: number; y: number },
    allNodes: Node[]
  ): { x: number; y: number } => {
    if (!state.settings.preventOverlap) {
      return newPosition;
    }

    const nodeWithNewPosition = { ...draggedNode, position: newPosition };
    
    for (const otherNode of allNodes) {
      if (otherNode.id === draggedNode.id) continue;
      
      if (checkCollision(nodeWithNewPosition, otherNode)) {
        if (state.settings.bounceEnabled) {
          // Apply bounce physics
          const bounceVelocity = calculateBounce(nodeWithNewPosition, otherNode);
          
          // Calculate safe position with bounce
          const dx = newPosition.x - otherNode.position.x;
          const dy = newPosition.y - otherNode.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const safeDistance = state.settings.minDistance + 5; // Add small buffer
            const normalizedX = dx / distance;
            const normalizedY = dy / distance;
            
            return {
              x: otherNode.position.x + normalizedX * safeDistance + bounceVelocity.x,
              y: otherNode.position.y + normalizedY * safeDistance + bounceVelocity.y,
            };
          }
        } else {
          // Stop at collision boundary without bounce
          const dx = newPosition.x - otherNode.position.x;
          const dy = newPosition.y - otherNode.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const safeDistance = state.settings.minDistance;
            const normalizedX = dx / distance;
            const normalizedY = dy / distance;
            
            return {
              x: otherNode.position.x + normalizedX * safeDistance,
              y: otherNode.position.y + normalizedY * safeDistance,
            };
          }
        }
      }
    }
    
    return newPosition;
  }, [state.settings, checkCollision, calculateBounce]);

  // Update collision settings
  const updateSettings = useCallback((newSettings: Partial<CollisionSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  }, []);

  return {
    settings: state.settings,
    checkCollision,
    resolveCollision,
    updateSettings,
  };
};