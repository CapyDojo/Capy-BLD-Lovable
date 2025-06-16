
import React from 'react';
import { Save, X } from 'lucide-react';

interface EditingRow {
  id: string;
  name: string;
  shareClass: string;
  sharesOwned: number;
}

interface StakeholderEditFormProps {
  editingRow: EditingRow;
  isAddingNew: boolean;
  onSave: () => void;
  onCancel: () => void;
  onUpdate: (updates: Partial<EditingRow>) => void;
}

export const StakeholderEditForm: React.FC<StakeholderEditFormProps> = ({
  editingRow,
  isAddingNew,
  onSave,
  onCancel,
  onUpdate,
}) => {
  return (
    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
      <div className="space-y-2">
        <input
          type="text"
          value={editingRow.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          placeholder="Stakeholder name"
        />
        <div className="flex gap-2">
          <select
            value={editingRow.shareClass}
            onChange={(e) => onUpdate({ shareClass: e.target.value })}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="Common Stock">Common Stock</option>
            <option value="Preferred Series A">Preferred Series A</option>
            <option value="Stock Options">Stock Options</option>
            <option value="Convertible Notes">Convertible Notes</option>
          </select>
          <input
            type="number"
            value={editingRow.sharesOwned || ''}
            onChange={(e) => onUpdate({ sharesOwned: parseInt(e.target.value) || 0 })}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-right"
            placeholder={isAddingNew ? "0" : "Shares"}
          />
        </div>
        <div className="flex justify-end gap-1">
          <button onClick={onSave} className="text-green-600 hover:text-green-800 p-1">
            <Save className="h-3 w-3" />
          </button>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
