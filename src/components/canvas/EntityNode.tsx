import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Building2, Shield, Users, Briefcase } from 'lucide-react';

interface EntityNodeData {
  name: string;
  type: string;
  jurisdiction: string;
}

interface EntityNodeProps {
  data: EntityNodeData;
  selected?: boolean;
}

const getEntityIcon = (type: string) => {
  switch (type) {
    case 'Corporation':
      return Building2;
    case 'LLC':
      return Shield;
    case 'Partnership':
      return Users;
    case 'Trust':
      return Briefcase;
    default:
      return Building2;
  }
};

const getEntityColor = (type: string) => {
  switch (type) {
    case 'Corporation':
      return 'bg-blue-50 border-blue-200 text-blue-700';
    case 'LLC':
      return 'bg-green-50 border-green-200 text-green-700';
    case 'Partnership':
      return 'bg-purple-50 border-purple-200 text-purple-700';
    case 'Trust':
      return 'bg-orange-50 border-orange-200 text-orange-700';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-700';
  }
};

export const EntityNode: React.FC<EntityNodeProps> = ({ data, selected }) => {
  const Icon = getEntityIcon(data.type);
  const colorClass = getEntityColor(data.type);

  return (
    <div className={`
      relative min-w-[200px] px-4 py-3 rounded-lg border-2 shadow-sm transition-all duration-200
      ${colorClass}
      ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      hover:shadow-md cursor-pointer
    `}>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 !bg-blue-600 !border-2 !border-white"
      />
      
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5 mt-0.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">
            {data.name}
          </h3>
          <p className="text-xs opacity-75 mt-1">
            {data.type} • {data.jurisdiction}
          </p>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-blue-600 !border-2 !border-white"
      />
    </div>
  );
};
