
import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { Node } from '@xyflow/react';
import { useEntityDetailsPanel } from './hooks/useEntityDetailsPanel';
import { EntityCapTableSection } from './EntityCapTableSection';

interface EntityDetailsPanelProps {
  selectedNode: Node;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  onUpdateNode: (updates: Partial<Node['data']>) => void;
}

export const EntityDetailsPanel: React.FC<EntityDetailsPanelProps> = ({
  selectedNode,
  isOpen,
  onClose,
  onDelete,
  onUpdateNode,
}) => {
  const {
    entityData,
    refreshKey,
    localName,
    handleUpdateField,
    handleNameChange,
    handleNameBlur,
    handleNameKeyPress,
  } = useEntityDetailsPanel({
    selectedNode,
    onClose,
    onUpdateNode,
  });

  if (!isOpen || !selectedNode) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-lg z-50 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Entity Details</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-100"
              title="Delete Entity"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4" key={`entity-details-${refreshKey}`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Name
            </label>
            <input
              type="text"
              value={localName}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={handleNameBlur}
              onKeyPress={handleNameKeyPress}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter entity name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              value={entityData.type || ''}
              onChange={(e) => handleUpdateField('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select type</option>
              <option value="Corporation">Corporation</option>
              <option value="LLC">LLC</option>
              <option value="Partnership">Partnership</option>
              <option value="Trust">Trust</option>
              <option value="Individual">Individual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jurisdiction
            </label>
            <input
              type="text"
              value={entityData.jurisdiction || ''}
              onChange={(e) => handleUpdateField('jurisdiction', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Delaware, California"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registration Number
            </label>
            <input
              type="text"
              value={entityData.registrationNumber || ''}
              onChange={(e) => handleUpdateField('registrationNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., C123456789"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={entityData.address || ''}
              onChange={(e) => handleUpdateField('address', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter entity address"
            />
          </div>
        </div>

        {/* Cap Table Section - Now using unified repository */}
        <EntityCapTableSection entityId={selectedNode.id} />
      </div>
    </div>
  );
};
