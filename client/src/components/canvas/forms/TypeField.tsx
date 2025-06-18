
import React from 'react';

interface TypeFieldProps {
  entityData: any;
  isIndividual: boolean;
  onUpdateField: (field: string, value: string) => void;
}

export const TypeField: React.FC<TypeFieldProps> = ({
  entityData,
  isIndividual,
  onUpdateField,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {isIndividual ? 'Type' : 'Entity Type'}
      </label>
      <select
        value={String(entityData.type || '')}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        onChange={(e) => onUpdateField('type', e.target.value)}
      >
        <option value="Individual">Individual</option>
        <option value="Corporation">Corporation</option>
        <option value="LLC">LLC</option>
        <option value="Partnership">Partnership</option>
        <option value="Trust">Trust</option>
      </select>
    </div>
  );
};
