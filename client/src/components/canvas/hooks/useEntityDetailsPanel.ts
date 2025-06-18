import { useEffect, useState } from 'react';
import { Node } from '@xyflow/react';
import { getUnifiedRepository } from '@/services/repositories/unified';
import { IUnifiedEntityRepository } from '@/services/repositories/unified/IUnifiedRepository';

interface UseEntityDetailsPanelProps {
  selectedNode: Node;
  onClose: () => void;
  onUpdateNode: (updates: Partial<Node['data']>) => void;
}

export const useEntityDetailsPanel = ({
  selectedNode,
  onClose,
  onUpdateNode,
}: UseEntityDetailsPanelProps) => {
  const [entityData, setEntityData] = useState(selectedNode?.data || {});
  const [refreshKey, setRefreshKey] = useState(0);
  const [localName, setLocalName] = useState(String(selectedNode?.data?.name || ''));
  const [repository, setRepository] = useState<IUnifiedEntityRepository | null>(null);

  // Initialize unified repository
  useEffect(() => {
    const initRepository = async () => {
      try {
        console.log('🔄 EntityDetailsPanel: Initializing unified repository...');
        const repo = await getUnifiedRepository('ENTERPRISE');
        setRepository(repo);
        console.log('✅ EntityDetailsPanel: Unified repository initialized');
      } catch (error) {
        console.error('❌ EntityDetailsPanel: Failed to initialize repository:', error);
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

  // Double-check entity exists before rendering
  useEffect(() => {
    const checkEntityExists = async () => {
      if (selectedNode && repository) {
        const entityExists = await repository.getEntity(selectedNode.id);
        if (!entityExists) {
          onClose();
        }
      }
    };
    checkEntityExists();
  }, [selectedNode?.id, repository, onClose]);

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

  return {
    entityData,
    refreshKey,
    localName,
    repository,
    handleUpdateField,
    handleNameChange,
    handleNameBlur,
    handleNameKeyPress,
  };
};
