
import React, { useState } from 'react';
import { useCapTable } from '@/hooks/useCapTable';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Save, X } from 'lucide-react';

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
  const capTableData = useCapTable(entityId);
  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  if (!capTableData) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Cap Table</h4>
        <p className="text-sm text-gray-500">No cap table data available</p>
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
    // TODO: Implement save functionality with proper data synchronization
    console.log('Saving:', editingRow);
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

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">Cap Table</h4>
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddNew}
          className="h-6 px-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-2">
          <div className="col-span-5">Stakeholder</div>
          <div className="col-span-4">Security Type</div>
          <div className="col-span-3 text-right">Shares</div>
        </div>
        
        {tableData.map((item) => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-center px-2 py-1 hover:bg-gray-50 rounded text-xs">
            {editingRow?.id === item.id ? (
              <>
                <div className="col-span-5">
                  <input
                    type="text"
                    value={editingRow.name}
                    onChange={(e) => setEditingRow({ ...editingRow, name: e.target.value })}
                    className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded"
                  />
                </div>
                <div className="col-span-4">
                  <select
                    value={editingRow.shareClass}
                    onChange={(e) => setEditingRow({ ...editingRow, shareClass: e.target.value })}
                    className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded"
                  >
                    <option value="Common Stock">Common Stock</option>
                    <option value="Preferred Series A">Preferred Series A</option>
                    <option value="Stock Options">Stock Options</option>
                    <option value="Convertible Notes">Convertible Notes</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={editingRow.sharesOwned}
                    onChange={(e) => setEditingRow({ ...editingRow, sharesOwned: parseInt(e.target.value) || 0 })}
                    className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded text-right"
                  />
                </div>
                <div className="col-span-1 flex space-x-1">
                  <button onClick={handleSave} className="text-green-600 hover:text-green-800">
                    <Save className="h-3 w-3" />
                  </button>
                  <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="col-span-5 text-gray-900 truncate">{item.name}</div>
                <div className="col-span-4">
                  <span className={`inline-flex px-1.5 py-0.5 text-xs rounded-full ${
                    item.shareClass.includes('Common') ? 'bg-green-100 text-green-800' :
                    item.shareClass.includes('Preferred') ? 'bg-purple-100 text-purple-800' :
                    item.shareClass.includes('Options') ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {item.shareClass}
                  </span>
                </div>
                <div className="col-span-2 text-right text-gray-900">
                  {item.sharesOwned > 0 ? item.sharesOwned.toLocaleString() : '-'}
                </div>
                <div className="col-span-1">
                  <button 
                    onClick={() => handleEdit(item)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        
        {isAddingNew && editingRow?.id === 'new' && (
          <div className="grid grid-cols-12 gap-2 items-center px-2 py-1 bg-blue-50 rounded text-xs">
            <div className="col-span-5">
              <input
                type="text"
                placeholder="Stakeholder name"
                value={editingRow.name}
                onChange={(e) => setEditingRow({ ...editingRow, name: e.target.value })}
                className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded"
              />
            </div>
            <div className="col-span-4">
              <select
                value={editingRow.shareClass}
                onChange={(e) => setEditingRow({ ...editingRow, shareClass: e.target.value })}
                className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded"
              >
                <option value="Common Stock">Common Stock</option>
                <option value="Preferred Series A">Preferred Series A</option>
                <option value="Stock Options">Stock Options</option>
                <option value="Convertible Notes">Convertible Notes</option>
              </select>
            </div>
            <div className="col-span-2">
              <input
                type="number"
                placeholder="0"
                value={editingRow.sharesOwned || ''}
                onChange={(e) => setEditingRow({ ...editingRow, sharesOwned: parseInt(e.target.value) || 0 })}
                className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded text-right"
              />
            </div>
            <div className="col-span-1 flex space-x-1">
              <button onClick={handleSave} className="text-green-600 hover:text-green-800">
                <Save className="h-3 w-3" />
              </button>
              <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {tableData.length === 0 && !isAddingNew && (
        <div className="text-center py-4 text-xs text-gray-500">
          No stakeholders found. Click "Add" to create one.
        </div>
      )}
    </div>
  );
};
