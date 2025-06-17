
import React from 'react';
import { Node } from '@xyflow/react';
import { EntityCapTableWrapper } from './EntityCapTableWrapper';
import { useEntityDetailsPanel } from './hooks/useEntityDetailsPanel';
import { EntityDetailsPanelHeader } from './components/EntityDetailsPanelHeader';
import { MigrationStatusIndicator } from './components/MigrationStatusIndicator';
import { EntityFormFields } from './components/EntityFormFields';

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
  const {
    entityData,
    refreshKey,
    localName,
    repository,
    handleUpdateField,
    handleNameChange,
    handleNameBlur,
    handleNameKeyPress,
  } = useEntityDetailsPanel({
    selectedNode,
    onClose,
    onUpdateNode,
  });

  // Don't render if no repository or entity doesn't exist
  if (!isOpen || !selectedNode || !repository) {
    return null;
  }

  const isIndividual = entityData.type === 'Individual';

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
      <EntityDetailsPanelHeader
        isIndividual={isIndividual}
        onClose={onClose}
      />
      
      <MigrationStatusIndicator />
      
      <EntityFormFields
        entityData={entityData}
        localName={localName}
        isIndividual={isIndividual}
        onNameChange={handleNameChange}
        onNameBlur={handleNameBlur}
        onNameKeyPress={handleNameKeyPress}
        onUpdateField={handleUpdateField}
      />

      <EntityCapTableWrapper entityId={selectedNode.id} key={`${selectedNode.id}-${refreshKey}`} />
    </div>
  );
};
