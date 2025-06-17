
import React from 'react';

interface EntityDetailsPanelHeaderProps {
  isIndividual: boolean;
  onClose: () => void;
}

export const EntityDetailsPanelHeader: React.FC<EntityDetailsPanelHeaderProps> = ({
  isIndividual,
  onClose,
}) => {
  return (
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
  );
};
