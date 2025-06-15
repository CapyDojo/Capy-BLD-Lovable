
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { User } from 'lucide-react';

interface ShareholderNodeData {
  name: string;
  ownershipPercentage: number;
}

interface ShareholderNodeProps {
  data: ShareholderNodeData;
  selected?: boolean;
}

export const ShareholderNode: React.FC<ShareholderNodeProps> = ({ data, selected }) => {
  return (
    <div className={`
      min-w-[180px] px-4 py-3 rounded-lg border-2 shadow-sm transition-all duration-200
      bg-gray-50 border-gray-200 text-gray-700
      ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      hover:shadow-md cursor-pointer
    `}>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 !bg-indigo-600 !border-2 !border-white"
      />
      
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
    </div>
  );
};
