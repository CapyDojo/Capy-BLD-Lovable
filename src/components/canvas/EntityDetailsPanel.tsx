
import React, { useEffect, useState } from 'react';
import { Node } from '@xyflow/react';
import { EntityCapTableWrapper } from './EntityCapTableWrapper';
import { NameField } from './forms/NameField';
import { TypeField } from './forms/TypeField';
import { IndividualFieldsForm } from './forms/IndividualFieldsForm';
import { EntityFieldsForm } from './forms/EntityFieldsForm';
import { migrationBridge } from '@/services/dataStore/MigrationBridge';

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

  // Enable migration for this component
  useEffect(() => {
    migrationBridge.enableMigrationFor('EntityDetailsPanel');
    console.log('🔄 EntityDetailsPanel migrated to use enterprise store');
  }, []);

  // Get the appropriate store (enterprise or legacy based on migration status)
  const dataStore = migrationBridge.getStoreFor('EntityDetailsPanel');

  // Subscribe to data store changes
  useEffect(() => {
    console.log('🔗 EntityDetailsPanel subscribing to data store changes');
    const unsubscribe = dataStore.subscribe(() => {
      console.log('📡 EntityDetailsPanel received data store update');
      
      // Check if selected entity still exists
      if (selectedNode) {
        const currentEntity = dataStore.getEntityById ? 
          dataStore.getEntityById(selectedNode.id) : 
          dataStore.getEntity ? 
          dataStore.getEntity(selectedNode.id) : null;
        
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
  }, [selectedNode, onClose, dataStore]);

  // Update local data when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      const getEntity = async () => {
        let entity;
        if (dataStore.getEntityById) {
          // Legacy store method
          entity = dataStore.getEntityById(selectedNode.id);
        } else if (dataStore.getEntity) {
          // Enterprise store method
          entity = await dataStore.getEntity(selectedNode.id);
        }
        
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
      };

      getEntity();
    }
  }, [selectedNode, refreshKey, onClose, dataStore]);

  // Don't render if entity doesn't exist
  if (!isOpen || !selectedNode) {
    return null;
  }

  // Double-check entity exists before rendering
  const checkEntityExists = async () => {
    if (dataStore.getEntityById) {
      return dataStore.getEntityById(selectedNode.id);
    } else if (dataStore.getEntity) {
      return await dataStore.getEntity(selectedNode.id);
    }
    return null;
  };

  const handleUpdateField = async (field: string, value: string) => {
    console.log('📝 EntityDetailsPanel updating field:', field, value);
    const updates = { [field]: value };
    setEntityData(prev => ({ ...prev, ...updates }));
    onUpdateNode(updates);

    // Update in the appropriate store
    if (dataStore.updateEntity) {
      try {
        if (dataStore.updateEntity.length > 3) {
          // Enterprise store signature: updateEntity(id, updates, updatedBy, reason)
          await dataStore.updateEntity(selectedNode.id, updates, 'user', `Updated ${field}`);
        } else {
          // Legacy store signature: updateEntity(id, updates)
          dataStore.updateEntity(selectedNode.id, updates);
        }
        console.log('✅ Entity updated successfully in store');
      } catch (error) {
        console.error('❌ Error updating entity in store:', error);
      }
    }
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
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  const isIndividual = entityData.type === 'Individual';

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          {isIndividual ? 'Individual Details' : 'Entity Details'}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      
      {/* Migration status indicator */}
      <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
        ✅ Using Enterprise Store (Phase 1 Migration)
      </div>
      
      <div className="space-y-4">
        <NameField
          localName={localName}
          isIndividual={isIndividual}
          onNameChange={handleNameChange}
          onNameBlur={handleNameBlur}
          onNameKeyPress={handleNameKeyPress}
        />
        
        <TypeField
          entityData={entityData}
          isIndividual={isIndividual}
          onUpdateField={handleUpdateField}
        />
        
        {isIndividual ? (
          <IndividualFieldsForm
            entityData={entityData}
            onUpdateField={handleUpdateField}
          />
        ) : (
          <EntityFieldsForm
            entityData={entityData}
            onUpdateField={handleUpdateField}
          />
        )}
      </div>

      <EntityCapTableWrapper entityId={selectedNode.id} key={`${selectedNode.id}-${refreshKey}`} />
    </div>
  );
};
