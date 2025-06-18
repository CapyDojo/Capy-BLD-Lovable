
import React, { useState, useEffect } from 'react';
import { Building2, FileText, BarChart3, Download } from 'lucide-react';
import { getUnifiedRepository } from '@/services/repositories/unified';
import { IUnifiedEntityRepository } from '@/services/repositories/unified/IUnifiedRepository';
import { CapTableView } from './CapTableView';
import { OwnershipChart } from './OwnershipChart';

export const CapTableEditor: React.FC = () => {
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');
  const [entities, setEntities] = useState<any[]>([]);
  const [repository, setRepository] = useState<IUnifiedEntityRepository | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize unified repository
  useEffect(() => {
    const initRepository = async () => {
      try {
        console.log('🔄 CapTableEditor: Initializing unified repository...');
        setLoading(true);
        setError(null);
        
        const repo = await getUnifiedRepository('ENTERPRISE');
        setRepository(repo);
        
        const allEntities = await repo.getAllEntities();
        setEntities(allEntities);
        
        if (allEntities.length > 0 && !selectedEntityId) {
          setSelectedEntityId(allEntities[0].id);
        }
        
        console.log('✅ CapTableEditor: Unified repository initialized');
      } catch (error) {
        console.error('❌ CapTableEditor: Failed to initialize repository:', error);
        setError('Failed to initialize cap table system');
      } finally {
        setLoading(false);
      }
    };

    initRepository();
  }, []);

  const selectedEntity = entities.find(e => e.id === selectedEntityId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading cap table system...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error: {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cap Table Management</h1>
          <p className="text-gray-600">Manage ownership and equity distribution</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Entity
          </label>
          <select
            value={selectedEntityId}
            onChange={(e) => setSelectedEntityId(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select an entity</option>
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name} ({entity.type})
              </option>
            ))}
          </select>
        </div>

        {selectedEntityId && (
          <>
            <div className="flex space-x-1 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('table')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'table'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Table View
              </button>
              <button
                onClick={() => setActiveTab('chart')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'chart'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Chart View
              </button>
            </div>

            {activeTab === 'table' && (
              <CapTableView entityId={selectedEntityId} />
            )}

            {activeTab === 'chart' && (
              <OwnershipChart entityId={selectedEntityId} />
            )}
          </>
        )}

        {!selectedEntityId && (
          <div className="text-center py-12 text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Select an entity to view its cap table</p>
          </div>
        )}
      </div>
    </div>
  );
};
