
import React from 'react';
import { BaseEdge, getBezierPath, EdgeProps } from '@xyflow/react';

export const OwnershipEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge 
      id={id}
      path={edgePath} 
      markerEnd={markerEnd} 
      style={{
        stroke: '#10b981',
        strokeWidth: 2,
        ...style
      }} 
    />
  );
};
