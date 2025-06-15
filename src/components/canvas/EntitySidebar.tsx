
import React from 'react';
import { Building2, Shield, Users, Briefcase, Plus, User } from 'lucide-react';
import { EntityTypes } from '@/types/entity';

type DraggableNodeType = EntityTypes | 'Individual';

interface EntitySidebarProps {
  onCreateNode: (type: DraggableNodeType, position: { x: number; y: number }) => void;
}

const draggableItems: { type: DraggableNodeType, icon: React.ElementType, color: string, bgColor: string }[] = [
  { type: 'Corporation', icon: Building2, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { type: 'LLC', icon: Shield, color: 'text-green-600', bgColor: 'bg-green-50' },
  { type: 'Partnership', icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { type: 'Trust', icon: Briefcase, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { type: 'Individual', icon: User, color: 'text-gray-700', bgColor: 'bg-gray-100' },
];

export const EntitySidebar: React.FC<EntitySidebarProps> = ({ onCreateNode }) => {
  const onDragStart = (event: React.DragEvent, nodeType: DraggableNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Entity Types</h2>
        <p className="text-sm text-gray-600">Drag to canvas to create new items</p>
      </div>

      <div className="space-y-3">
        {draggableItems.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(event) => onDragStart(event, item.type)}
            className={`
              flex items-center space-x-3 p-3 rounded-lg border border-gray-200 cursor-move
              hover:shadow-md transition-all duration-200 ${item.bgColor}
            `}
          >
            <item.icon className={`h-5 w-5 ${item.color}`} />
            <span className="text-sm font-medium text-gray-900">{item.type}</span>
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
