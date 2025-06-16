
import React, { useState, useEffect } from 'react';
import { CapTableView } from './CapTableView';
import { OwnershipChart } from './OwnershipChart';
import { Plus, Download, Upload, Building2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { dataStore } from '@/services/dataStore';

export const CapTableEditor: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const entityIdFromUrl = searchParams.get('entityId');
  
  const [entities, setEntities] = useState(() => dataStore.getEntities());
  const [selectedEntityId, setSelectedEntityId] = useState<string>(
    entityIdFromUrl || entities[0]?.id || ''
  );
  const [view, setView] = useState<'table' | 'chart'>('table');
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to data store changes to update entities list
  useEffect(() => {
    console.log('🔗 CapTableEditor subscribing to data store changes');
    const unsubscribe = dataStore.subscribe(() => {
      console.log('📡 CapTableEditor received data store update');
      const updatedEntities = dataStore.getEntities();
      setEntities(updatedEntities);
      
      // Check if selected entity still exists
      if (selectedEntityId && !updatedEntities.find(e => e.id === selectedEntityId)) {
        console.log('⚠️ Selected entity was deleted, selecting first available');
        const firstEntity = updatedEntities[0];
        if (firstEntity) {
          setSelectedEntityId(firstEntity.id);
          setSearchParams({ entityId: firstEntity.id });
        } else {
          setSelectedEntityId('');
          setSearchParams({});
        }
      }
      
      setRefreshKey(prev => prev + 1);
    });
    return unsubscribe;
  }, [selectedEntityId, setSearchParams]);

  const selectedEntity = entities.find(e => e.id === selectedEntityId);

  const handleEntityChange = (entityId: string) => {
    console.log('🔄 CapTableEditor changing entity to:', entityId);
    setSelectedEntityId(entityId);
    setSearchParams({ entityId });
  };

  // Helper function to safely format date
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return 'N/A';
    
    try {
      // If it's already a Date object
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString();
      }
      
      // If it's a string, try to parse it
      if (typeof dateValue === 'string') {
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString();
        }
      }
      
      return 'Invalid Date';
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  if (entities.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cap Table</h1>
            <p className="text-gray-600">No entities available. Please create entities first.</p>
          </div>
        </div>
      </div>
    );
  }

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
              <div>Registration: {selectedEntity.registrationNumber || 'N/A'}</div>
              <div>Incorporated: {formatDate(selectedEntity.incorporationDate)}</div>
            </div>
          )}
        </div>
      </div>

      {selectedEntityId && (
        <div key={`${selectedEntityId}-${refreshKey}`}>
          {view === 'table' ? 
            <CapTableView entityId={selectedEntityId} /> : 
            <OwnershipChart entityId={selectedEntityId} />
          }
        </div>
      )}
    </div>
  );
};
