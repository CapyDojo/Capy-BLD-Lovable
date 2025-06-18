
import React from 'react';
import { Building2, Users, Briefcase, Scale } from 'lucide-react';
import { EntityTypes } from '@/types/entity';

type DraggableNodeType = EntityTypes | 'Individual';

interface EntitySidebarProps {
  onCreateNode: (type: DraggableNodeType, position: { x: number; y: number }) => void;
}

const nodeTypes: { type: DraggableNodeType; label: string; icon: React.ReactNode; color: string }[] = [
  {
    type: 'Corporation',
    label: 'Corporation',
    icon: <Building2 className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    type: 'LLC',
    label: 'LLC',
    icon: <Briefcase className="h-4 w-4" />,
    color: 'bg-green-100 text-green-700 border-green-200',
  },
  {
    type: 'Partnership',
    label: 'Partnership',
    icon: <Users className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  {
    type: 'Trust',
    label: 'Trust',
    icon: <Scale className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  {
    type: 'Individual',
    label: 'Individual',
    icon: <Users className="h-4 w-4" />,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
  },
];

export const EntitySidebar: React.FC<EntitySidebarProps> = ({ onCreateNode }) => {
  const onDragStart = (event: React.DragEvent, nodeType: DraggableNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Entity Types</h2>
        <p className="text-sm text-gray-600">Drag to canvas to create</p>
      </div>

      <div className="flex-1 p-4 space-y-3">
        {nodeTypes.map((nodeType) => (
          <div
            key={nodeType.type}
            className={`p-3 rounded-lg border-2 border-dashed cursor-grab active:cursor-grabbing transition-colors hover:shadow-sm ${nodeType.color}`}
            draggable
            onDragStart={(event) => onDragStart(event, nodeType.type)}
          >
            <div className="flex items-center space-x-2">
              {nodeType.icon}
              <span className="text-sm font-medium">{nodeType.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-green-600">
          ✅ Using Unified Repository Architecture
        </div>
      </div>
    </div>
  );
};
