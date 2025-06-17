
import React from 'react';

interface NameFieldProps {
  localName: string;
  isIndividual: boolean;
  onNameChange: (value: string) => void;
  onNameBlur: () => void;
  onNameKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const NameField: React.FC<NameFieldProps> = ({
  localName,
  isIndividual,
  onNameChange,
  onNameBlur,
  onNameKeyPress,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {isIndividual ? 'Full Name' : 'Entity Name'}
      </label>
      <input
        type="text"
        value={localName}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        onChange={(e) => onNameChange(e.target.value)}
        onBlur={onNameBlur}
        onKeyPress={onNameKeyPress}
      />
    </div>
  );
};
