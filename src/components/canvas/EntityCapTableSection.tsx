
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCapTable, addStakeholder, updateStakeholder, deleteStakeholder } from '@/hooks/useCapTable';
import { Button } from '@/components/ui/button';
import { StakeholderEditForm } from './StakeholderEditForm';
import { StakeholderListItem } from './StakeholderListItem';
import { AddStakeholderButton } from './AddStakeholderButton';

interface EntityCapTableSectionProps {
  entityId: string;
}

interface EditingRow {
  id: string;
  name: string;
  shareClass: string;
  sharesOwned: number;
}

export const EntityCapTableSection: React.FC<EntityCapTableSectionProps> = ({ entityId }) => {
  const navigate = useNavigate();
  const capTableData = useCapTable(entityId);
  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  if (!capTableData) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Stakeholders</h4>
          <Button
            size="sm"
            onClick={() => navigate(`/cap-table?entityId=${entityId}`)}
            className="h-6 px-2 text-xs bg-blue-600 text-white hover:bg-blue-700"
          >
            Full Cap Table
          </Button>
        </div>
        <p className="text-sm text-gray-500">No stakeholder data available</p>
      </div>
    );
  }

  const { tableData } = capTableData;

  const handleEdit = (item: any) => {
    setEditingRow({
      id: item.id,
      name: item.name,
      shareClass: item.shareClass,
      sharesOwned: item.sharesOwned
    });
  };

  const handleSave = () => {
    if (!editingRow) return;

    if (editingRow.id === 'new') {
      addStakeholder(entityId, {
        name: editingRow.name,
        shareClass: editingRow.shareClass,
        sharesOwned: editingRow.sharesOwned,
        type: 'Individual'
      });
      setIsAddingNew(false);
    } else {
      updateStakeholder(entityId, editingRow.id, {
        name: editingRow.name,
        shareClass: editingRow.shareClass,
        sharesOwned: editingRow.sharesOwned
      });
    }
    setEditingRow(null);
  };

  const handleCancel = () => {
    setEditingRow(null);
    setIsAddingNew(false);
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingRow({
      id: 'new',
      name: '',
      shareClass: 'Common Stock',
      sharesOwned: 0
    });
  };

  const handleDelete = (stakeholderId: string) => {
    deleteStakeholder(entityId, stakeholderId);
  };

  const handleUpdateEditingRow = (updates: Partial<EditingRow>) => {
    if (editingRow) {
      setEditingRow({ ...editingRow, ...updates });
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">Stakeholders</h4>
        <Button
          size="sm"
          onClick={() => navigate(`/cap-table?entityId=${entityId}`)}
          className="h-6 px-2 text-xs bg-blue-600 text-white hover:bg-blue-700"
        >
          Full Cap Table
        </Button>
      </div>
      
      <div className="space-y-2">
        {tableData.map((item) => (
          <div key={item.id}>
            {editingRow?.id === item.id ? (
              <StakeholderEditForm
                editingRow={editingRow}
                isAddingNew={false}
                onSave={handleSave}
                onCancel={handleCancel}
                onUpdate={handleUpdateEditingRow}
              />
            ) : (
              <StakeholderListItem
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        ))}
        
        {isAddingNew && editingRow?.id === 'new' && (
          <StakeholderEditForm
            editingRow={editingRow}
            isAddingNew={true}
            onSave={handleSave}
            onCancel={handleCancel}
            onUpdate={handleUpdateEditingRow}
          />
        )}
        
        {!isAddingNew && (
          <AddStakeholderButton onAddNew={handleAddNew} />
        )}
      </div>
      
      {tableData.length === 0 && !isAddingNew && (
        <div className="text-center py-4 text-sm text-gray-500">
          No stakeholders found. Click "Add Stakeholder" to create one.
        </div>
      )}
    </div>
  );
};
