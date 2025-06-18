
import React from 'react';

interface ConnectionPreviewProps {
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
}

export const ConnectionPreview: React.FC<ConnectionPreviewProps> = ({
  sourcePosition,
  targetPosition
}) => {
  const length = Math.sqrt(
    Math.pow(targetPosition.x - sourcePosition.x, 2) + 
    Math.pow(targetPosition.y - sourcePosition.y, 2)
  );
  
  const angle = Math.atan2(
    targetPosition.y - sourcePosition.y,
    targetPosition.x - sourcePosition.x
  ) * (180 / Math.PI);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: sourcePosition.x,
        top: sourcePosition.y,
        width: length,
        height: 2,
        background: 'linear-gradient(90deg, transparent 0%, #22c55e 50%, transparent 100%)',
        transformOrigin: '0 50%',
        transform: `rotate(${angle}deg)`,
        animation: 'connection-preview 0.5s ease-in-out infinite alternate',
        zIndex: 999
      }}
    />
  );
};
