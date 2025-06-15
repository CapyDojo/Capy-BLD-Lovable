
import React, { useState } from 'react';
import { CapTableView } from './CapTableView';
import { OwnershipChart } from './OwnershipChart';
import { Plus, Download, Upload, Building2 } from 'lucide-react';
import { getAllEntities, getEntityById } from '@/data/mockData';
import { useSearchParams } from 'react-router-dom';

export const CapTableEditor: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const entityIdFromUrl = searchParams.get('entityId');
  
  const entities = getAllEntities();
  const [selectedEntityId, setSelectedEntityId] = useState<string>(
    entityIdFromUrl || entities[0]?.id || ''
  );
  const [view, setView] = useState<'table' | 'chart'>('table');

  const selectedEntity = getEntityById(selectedEntityId);

  const handleEntityChange = (entityId: string) => {
    setSelectedEntityId(entityId);
    setSearchParams({ entityId });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cap Table</h1>
          <p className="text-gray-600">Manage ownership structure and equity distribution</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('table')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                view === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setView('chart')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                view === 'chart' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Chart View
            </button>
          </div>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />
            <span>Add Stakeholder</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Entity Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <Building2 className="h-5 w-5 text-gray-400" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Entity
            </label>
            <select
              value={selectedEntityId}
              onChange={(e) => handleEntityChange(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name} ({entity.type} • {entity.jurisdiction})
                </option>
              ))}
            </select>
          </div>
          {selectedEntity && (
            <div className="text-sm text-gray-600">
              <div>Registration: {selectedEntity.registrationNumber}</div>
              <div>Incorporated: {selectedEntity.incorporationDate?.toLocaleDateString()}</div>
            </div>
          )}
        </div>
      </div>

      {selectedEntityId && (
        view === 'table' ? 
          <CapTableView entityId={selectedEntityId} /> : 
          <OwnershipChart entityId={selectedEntityId} />
      )}
    </div>
  );
};
