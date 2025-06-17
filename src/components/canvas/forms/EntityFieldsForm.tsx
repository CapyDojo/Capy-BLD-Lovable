
import React from 'react';

interface EntityFieldsFormProps {
  entityData: any;
  onUpdateField: (field: string, value: string) => void;
}

export const EntityFieldsForm: React.FC<EntityFieldsFormProps> = ({
  entityData,
  onUpdateField,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Jurisdiction
      </label>
      <select
        value={String(entityData.jurisdiction || '')}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        onChange={(e) => onUpdateField('jurisdiction', e.target.value)}
      >
        <option value="Delaware">Delaware</option>
        <option value="California">California</option>
        <option value="Nevada">Nevada</option>
        <option value="New York">New York</option>
      </select>
    </div>
  );
};
