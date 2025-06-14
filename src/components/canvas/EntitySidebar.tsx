
import React from 'react';
import { Building2, Shield, Users, Briefcase, Plus } from 'lucide-react';
import { EntityTypes } from '@/types/entity';

interface EntitySidebarProps {
  onCreateEntity: (type: EntityTypes, position: { x: number; y: number }) => void;
}

const entityTypes = [
  { type: 'Corporation' as EntityTypes, icon: Building2, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { type: 'LLC' as EntityTypes, icon: Shield, color: 'text-green-600', bgColor: 'bg-green-50' },
  { type: 'Partnership' as EntityTypes, icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { type: 'Trust' as EntityTypes, icon: Briefcase, color: 'text-orange-600', bgColor: 'bg-orange-50' },
];

export const EntitySidebar: React.FC<EntitySidebarProps> = ({ onCreateEntity }) => {
  const onDragStart = (event: React.DragEvent, nodeType: EntityTypes) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Entity Types</h2>
        <p className="text-sm text-gray-600">Drag to canvas to create new entities</p>
      </div>

      <div className="space-y-3">
        {entityTypes.map((entity) => (
          <div
            key={entity.type}
            draggable
            onDragStart={(event) => onDragStart(event, entity.type)}
            className={`
              flex items-center space-x-3 p-3 rounded-lg border border-gray-200 cursor-move
              hover:shadow-md transition-all duration-200 ${entity.bgColor}
            `}
          >
            <entity.icon className={`h-5 w-5 ${entity.color}`} />
            <span className="text-sm font-medium text-gray-900">{entity.type}</span>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
            <Plus className="h-4 w-4" />
            <span>Import Structure</span>
          </button>
          <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
            <Plus className="h-4 w-4" />
            <span>Export Diagram</span>
          </button>
        </div>
      </div>
    </div>
  );
};
