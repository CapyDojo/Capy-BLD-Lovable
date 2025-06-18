
import React from 'react';

interface IndividualFieldsFormProps {
  entityData: any;
  onUpdateField: (field: string, value: string) => void;
}

export const IndividualFieldsForm: React.FC<IndividualFieldsFormProps> = ({
  entityData,
  onUpdateField,
}) => {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Citizenship
        </label>
        <select
          value={String(entityData.citizenship || '')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onChange={(e) => onUpdateField('citizenship', e.target.value)}
        >
          <option value="">Select Citizenship</option>
          <option value="US Citizen">US Citizen</option>
          <option value="Canadian Citizen">Canadian Citizen</option>
          <option value="UK Citizen">UK Citizen</option>
          <option value="Other">Other</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Residence
        </label>
        <select
          value={String(entityData.residence || '')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onChange={(e) => onUpdateField('residence', e.target.value)}
        >
          <option value="">Select Residence</option>
          <option value="California">California</option>
          <option value="New York">New York</option>
          <option value="Delaware">Delaware</option>
          <option value="Nevada">Nevada</option>
          <option value="Texas">Texas</option>
          <option value="Florida">Florida</option>
          <option value="Other">Other</option>
        </select>
      </div>
    </>
  );
};
