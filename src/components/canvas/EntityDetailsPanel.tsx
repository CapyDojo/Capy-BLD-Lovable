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
  const [localName, setLocalName] = useState(String(selectedNode?.data?.name || ''));

  // Subscribe to data store changes
  useEffect(() => {
    console.log('🔗 EntityDetailsPanel subscribing to data store changes');
    const unsubscribe = dataStore.subscribe(() => {
      console.log('📡 EntityDetailsPanel received data store update');
      
      // Check if selected entity still exists
      if (selectedNode) {
        const currentEntity = dataStore.getEntityById(selectedNode.id);
        if (!currentEntity) {
          console.log('🚪 Selected entity was deleted, closing panel');
          onClose();
          return;
        } else {
          console.log('📝 Updating entity data in panel');
          const newEntityData = {
            name: currentEntity.name,
            type: currentEntity.type,
            jurisdiction: currentEntity.jurisdiction,
            ...selectedNode.data
          };
          setEntityData(newEntityData);
          setLocalName(String(currentEntity.name || ''));
        }
      }
      
      setRefreshKey(prev => prev + 1);
    });
    return unsubscribe;
  }, [selectedNode, onClose]);

  // Update local data when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      const entity = dataStore.getEntityById(selectedNode.id);
      if (entity) {
        const newEntityData = {
          name: entity.name,
          type: entity.type,
          jurisdiction: entity.jurisdiction,
          ...selectedNode.data
        };
        setEntityData(newEntityData);
        setLocalName(String(entity.name || ''));
      } else {
        // Entity no longer exists, close panel
        console.log('🚪 Entity no longer exists in panel effect, closing');
        onClose();
      }
    }
  }, [selectedNode, refreshKey, onClose]);

  // Don't render if entity doesn't exist
  if (!isOpen || !selectedNode) {
    return null;
  }

  // Double-check entity exists before rendering
  const entityExists = dataStore.getEntityById(selectedNode.id);
  if (!entityExists) {
    return null;
  }

  const handleUpdateField = (field: string, value: string) => {
    console.log('📝 EntityDetailsPanel updating field:', field, value);
    const updates = { [field]: value };
    setEntityData(prev => ({ ...prev, ...updates }));
    onUpdateNode(updates);
  };

  const handleNameChange = (value: string) => {
    setLocalName(value);
  };

  const handleNameBlur = () => {
    if (localName !== entityData.name) {
      handleUpdateField('name', localName);
    }
  };

  const handleNameKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (localName !== entityData.name) {
        handleUpdateField('name', localName);
      }
      e.currentTarget.blur();
    }
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
            value={localName}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={handleNameBlur}
            onKeyPress={handleNameKeyPress}
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
            <option value="Nevada">Nevada</option>
            <option value="New York">New York</option>
          </select>
        </div>
      </div>

      <EntityCapTableSection entityId={selectedNode.id} key={`${selectedNode.id}-${refreshKey}`} />
    </div>
  );
};
