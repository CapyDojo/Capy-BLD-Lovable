
import React from 'react';

interface CanvasTipDisplayProps {
  isDragging: boolean;
  magneticZonesCount: number;
}

export const CanvasTipDisplay: React.FC<CanvasTipDisplayProps> = ({
  isDragging,
  magneticZonesCount,
}) => {
  return (
    <div className="absolute top-4 left-4 z-10 bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
      <p className="text-sm text-gray-600">
        💡 <strong>Tip:</strong> Double-click an entity to view its cap table
      </p>
      {isDragging && (
        <p className="text-xs text-blue-600 mt-1 font-medium">
          🎯 Drag near another entity to create magnetic connection! Zones: {magneticZonesCount}
        </p>
      )}
    </div>
  );
};
