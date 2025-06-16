
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCapTable } from '@/hooks/useCapTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
            variant="outline"
            onClick={() => navigate(`/cap-table?entityId=${entityId}`)}
            className="h-6 px-2 text-xs"
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

  const getSecurityTypeBadgeColor = (shareClass: string) => {
    if (shareClass.includes('Common')) return 'bg-green-100 text-green-800';
    if (shareClass.includes('Preferred')) return 'bg-purple-100 text-purple-800';
    if (shareClass.includes('Options')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">Stakeholders</h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/cap-table?entityId=${entityId}`)}
          className="h-6 px-2 text-xs"
        >
          Full Cap Table
        </Button>
      </div>
      
      <div className="space-y-2">
        {tableData.map((item) => (
          <div key={item.id}>
            {editingRow?.id === item.id ? (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editingRow.name}
                    onChange={(e) => setEditingRow({ ...editingRow, name: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    placeholder="Stakeholder name"
                  />
                  <div className="flex gap-2">
                    <select
                      value={editingRow.shareClass}
                      onChange={(e) => setEditingRow({ ...editingRow, shareClass: e.target.value })}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="Common Stock">Common Stock</option>
                      <option value="Preferred Series A">Preferred Series A</option>
                      <option value="Stock Options">Stock Options</option>
                      <option value="Convertible Notes">Convertible Notes</option>
                    </select>
                    <input
                      type="number"
                      value={editingRow.sharesOwned}
                      onChange={(e) => setEditingRow({ ...editingRow, sharesOwned: parseInt(e.target.value) || 0 })}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                      placeholder="Shares"
                    />
                  </div>
                  <div className="flex justify-end gap-1">
                    <button onClick={handleSave} className="text-green-600 hover:text-green-800 p-1">
                      <Save className="h-3 w-3" />
                    </button>
                    <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600 p-1">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-3 relative group hover:bg-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </h5>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getSecurityTypeBadgeColor(item.shareClass)}`}
                      >
                        {item.shareClass}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {item.sharesOwned > 0 ? `${item.sharesOwned.toLocaleString()} shares` : 'No shares'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleEdit(item)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 p-1"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isAddingNew && editingRow?.id === 'new' && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Stakeholder name"
                value={editingRow.name}
                onChange={(e) => setEditingRow({ ...editingRow, name: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
              <div className="flex gap-2">
                <select
                  value={editingRow.shareClass}
                  onChange={(e) => setEditingRow({ ...editingRow, shareClass: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="Common Stock">Common Stock</option>
                  <option value="Preferred Series A">Preferred Series A</option>
                  <option value="Stock Options">Stock Options</option>
                  <option value="Convertible Notes">Convertible Notes</option>
                </select>
                <input
                  type="number"
                  placeholder="0"
                  value={editingRow.sharesOwned || ''}
                  onChange={(e) => setEditingRow({ ...editingRow, sharesOwned: parseInt(e.target.value) || 0 })}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                />
              </div>
              <div className="flex justify-end gap-1">
                <button onClick={handleSave} className="text-green-600 hover:text-green-800 p-1">
                  <Save className="h-3 w-3" />
                </button>
                <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600 p-1">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Add New Button as Card */}
        {!isAddingNew && (
          <button
            onClick={handleAddNew}
            className="w-full bg-gray-50 rounded-lg p-3 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add Stakeholder</span>
            </div>
          </button>
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
