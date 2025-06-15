
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { User } from 'lucide-react';

interface ShareholderNodeData {
  name: string;
  ownershipPercentage: number;
  magneticZone?: 'detection' | 'strongPull' | 'snap';
}

interface ShareholderNodeProps {
  data: ShareholderNodeData;
  selected?: boolean;
  id: string;
  onDragStart?: (nodeId: string) => void;
  onDragEnd?: () => void;
}

const getMagneticGlow = (zone?: 'detection' | 'strongPull' | 'snap') => {
  switch (zone) {
    case 'detection':
      return 'ring-2 ring-white ring-opacity-50';
    case 'strongPull':
      return 'ring-4 ring-yellow-400 ring-opacity-75 animate-pulse';
    case 'snap':
      return 'ring-4 ring-green-500 ring-opacity-90 animate-pulse';
    default:
      return '';
  }
};

export const ShareholderNode: React.FC<ShareholderNodeProps> = ({ 
  data, 
  selected, 
  id, 
  onDragStart, 
  onDragEnd 
}) => {
  const magneticGlow = getMagneticGlow(data.magneticZone);

  const handleMouseDown = () => {
    if (onDragStart) {
      onDragStart(id);
    }
  };

  const handleMouseUp = () => {
    if (onDragEnd) {
      onDragEnd();
    }
  };

  return (
    <div 
      className={`
        min-w-[180px] px-4 py-3 rounded-lg border-2 shadow-sm transition-all duration-200
        bg-gray-50 border-gray-200 text-gray-700
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${magneticGlow}
        hover:shadow-md cursor-pointer
      `}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Individuals don't have top handle */}
      
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <User className="h-5 w-5 mt-0.5 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">
            {data.name}
          </h3>
          <p className="text-xs opacity-75 mt-1">
            Stakeholder
          </p>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-purple-600 !border-2 !border-white magnetic-handle"
      />
    </div>
  );
};
