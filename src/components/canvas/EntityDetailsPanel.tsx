
import React, { useEffect, useState } from 'react';
import { Node } from '@xyflow/react';
import { EntityCapTableWrapper } from './EntityCapTableWrapper';
import { NameField } from './forms/NameField';
import { TypeField } from './forms/TypeField';
import { IndividualFieldsForm } from './forms/IndividualFieldsForm';
import { EntityFieldsForm } from './forms/EntityFieldsForm';
import { getUnifiedRepository } from '@/services/repositories/unified';
import { IUnifiedEntityRepository } from '@/services/repositories/unified/IUnifiedRepository';

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
  const [repository, setRepository] = useState<IUnifiedEntityRepository | null>(null);

  // Initialize unified repository
  useEffect(() => {
    const initRepository = async () => {
      try {
        console.log('🔄 EntityDetailsPanel: Initializing unified repository...');
        const repo = await getUnifiedRepository('ENTERPRISE'); // Use enterprise by default
        setRepository(repo);
        console.log('✅ EntityDetailsPanel: Unified repository initialized');
      } catch (error) {
        console.error('❌ EntityDetailsPanel: Failed to initialize repository:', error);
        // Fallback to legacy if needed
        const fallbackRepo = await getUnifiedRepository('LEGACY');
        setRepository(fallbackRepo);
      }
    };

    initRepository();
  }, []);

  // Subscribe to repository changes
  useEffect(() => {
    if (!repository) return;

    console.log('🔗 EntityDetailsPanel: Subscribing to unified repository events');
    const unsubscribe = repository.subscribe(async (event) => {
      console.log('📡 EntityDetailsPanel: Received repository event:', event.type, event.entityId);
      
      if (event.entityId === selectedNode?.id) {
        if (event.type === 'ENTITY_DELETED') {
          console.log('🚪 Selected entity was deleted, closing panel');
          onClose();
          return;
        }
        
        // Refresh entity data
        const currentEntity = await repository.getEntity(selectedNode.id);
        if (currentEntity) {
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
  }, [repository, selectedNode, onClose]);

  // Update local data when selectedNode changes
  useEffect(() => {
    const updateEntityData = async () => {
      if (selectedNode && repository) {
        const entity = await repository.getEntity(selectedNode.id);
        
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
          console.log('🚪 Entity no longer exists in repository, closing panel');
          onClose();
        }
      }
    };

    updateEntityData();
  }, [selectedNode, refreshKey, onClose, repository]);

  // Don't render if no repository or entity doesn't exist
  if (!isOpen || !selectedNode || !repository) {
    return null;
  }

  // Double-check entity exists before rendering
  useEffect(() => {
    const checkEntityExists = async () => {
      const entityExists = await repository.getEntity(selectedNode.id);
      if (!entityExists) {
        onClose();
      }
    };
    checkEntityExists();
  }, [selectedNode.id, repository, onClose]);

  const handleUpdateField = async (field: string, value: string) => {
    if (!repository) return;
    
    console.log('📝 EntityDetailsPanel: Updating field via unified repository:', field, value);
    const updates = { [field]: value };
    setEntityData(prev => ({ ...prev, ...updates }));
    onUpdateNode(updates);

    try {
      await repository.updateEntity(selectedNode.id, updates, 'user', `Updated ${field}`);
      console.log('✅ Entity updated successfully in unified repository');
    } catch (error) {
      console.error('❌ Error updating entity in unified repository:', error);
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
      <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
        🚀 Using Unified Repository Architecture (Phase 2 Migration)
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
