
import React from 'react';
import { Node } from '@xyflow/react';
import { useNavigate } from 'react-router-dom';

interface EntityDetailsPanelProps {
  selectedNode: Node;
  isOpen: boolean;
  onClose: () => void;
  onUpdateNode: (updates: Partial<Node['data']>) => void;
}

export const EntityDetailsPanel: React.FC<EntityDetailsPanelProps> = ({
  selectedNode,
  isOpen,
  onClose,
  onUpdateNode,
}) => {
  const navigate = useNavigate();

  if (!isOpen || !selectedNode) {
    return null;
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Entity Details</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(`/cap-table?entityId=${selectedNode.id}`)}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            View Cap Table
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Entity Name
          </label>
          <input
            type="text"
            value={String(selectedNode.data.name || '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => onUpdateNode({ name: e.target.value })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Entity Type
          </label>
          <select
            value={String(selectedNode.data.type || '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => onUpdateNode({ type: e.target.value })}
          >
            <option value="Corporation">Corporation</option>
            <option value="LLC">LLC</option>
            <option value="Partnership">Partnership</option>
            <option value="Trust">Trust</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jurisdiction
          </label>
          <select
            value={String(selectedNode.data.jurisdiction || '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => onUpdateNode({ jurisdiction: e.target.value })}
          >
            <option value="Delaware">Delaware</option>
            <option value="California">California</option>
            <option value="New York">New York</option>
            <option value="Nevada">Nevada</option>
          </select>
        </div>
      </div>
    </div>
  );
};
