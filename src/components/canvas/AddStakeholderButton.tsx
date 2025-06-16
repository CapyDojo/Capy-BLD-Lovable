
import React from 'react';
import { Plus } from 'lucide-react';

interface AddStakeholderButtonProps {
  onAddNew: () => void;
}

export const AddStakeholderButton: React.FC<AddStakeholderButtonProps> = ({ onAddNew }) => {
  return (
    <button
      onClick={onAddNew}
      className="w-full bg-gray-50 rounded-lg p-3 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center justify-center gap-2 text-gray-500">
        <Plus className="h-4 w-4" />
        <span className="text-sm">Add Stakeholder</span>
      </div>
    </button>
  );
};
