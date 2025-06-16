
import React, { useEffect, useState } from 'react';
import { Node } from '@xyflow/react';
import { EntityCapTableSection } from './EntityCapTableSection';
import { dataStore } from '@/services/dataStore';

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
  const [entityData, setEntityData] = useState(selectedNode?.data || {});
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to data store changes
  useEffect(() => {
    console.log('🔗 EntityDetailsPanel subscribing to data store changes');
    const unsubscribe = dataStore.subscribe(() => {
      console.log('📡 EntityDetailsPanel received data store update');
      setRefreshKey(prev => prev + 1);
      
      // Check if selected entity still exists
      if (selectedNode) {
        const currentEntity = dataStore.getEntityById(selectedNode.id);
        if (!currentEntity) {
          console.log('🚪 Selected entity was deleted, closing panel');
          onClose();
        } else {
          console.log('📝 Updating entity data in panel');
          setEntityData({
            name: currentEntity.name,
            type: currentEntity.type,
            jurisdiction: currentEntity.jurisdiction,
            ...selectedNode.data
          });
        }
      }
    });
    return unsubscribe;
  }, [selectedNode, onClose]);

  // Update local data when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      const entity = dataStore.getEntityById(selectedNode.id);
      if (entity) {
        setEntityData({
          name: entity.name,
          type: entity.type,
          jurisdiction: entity.jurisdiction,
          ...selectedNode.data
        });
      }
    }
  }, [selectedNode, refreshKey]);

  if (!isOpen || !selectedNode) {
    return null;
  }

  const handleUpdateField = (field: string, value: string) => {
    console.log('📝 EntityDetailsPanel updating field:', field, value);
    const updates = { [field]: value };
    setEntityData(prev => ({ ...prev, ...updates }));
    onUpdateNode(updates);
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Entity Details</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Entity Name
          </label>
          <input
            type="text"
            value={String(entityData.name || '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => handleUpdateField('name', e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Entity Type
          </label>
          <select
            value={String(entityData.type || '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => handleUpdateField('type', e.target.value)}
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
            value={String(entityData.jurisdiction || '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => handleUpdateField('jurisdiction', e.target.value)}
          >
            <option value="Delaware">Delaware</option>
            <option value="California">California</option>
            <option value="New York">New York</option>
            <option value="Nevada">Nevada</option>
          </select>
        </div>
      </div>

      <EntityCapTableSection entityId={selectedNode.id} key={`${selectedNode.id}-${refreshKey}`} />
    </div>
  );
};
