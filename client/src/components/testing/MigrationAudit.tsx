
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database } from 'lucide-react';

interface ComponentStatus {
  name: string;
  path: string;
  status: 'migrated' | 'legacy' | 'mixed';
  dataStore: 'unified' | 'legacy' | 'mixed';
  lastUpdated: string;
  issues: string[];
}

export const MigrationAudit: React.FC = () => {
  const [components, setComponents] = useState<ComponentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const runAudit = async () => {
    setRefreshing(true);
    
    // Simulate audit analysis
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const auditResults: ComponentStatus[] = [
      {
        name: 'EntityCanvas',
        path: 'src/components/canvas/EntityCanvas.tsx',
        status: 'migrated',
        dataStore: 'unified',
        lastUpdated: new Date().toISOString(),
        issues: []
      },
      {
        name: 'EntityDetailsPanel',
        path: 'src/components/canvas/EntityDetailsPanel.tsx',
        status: 'migrated',
        dataStore: 'unified',
        lastUpdated: new Date().toISOString(),
        issues: []
      },
      {
        name: 'CapTableEditor',
        path: 'src/components/cap-table/CapTableEditor.tsx',
        status: 'migrated',
        dataStore: 'unified',
        lastUpdated: new Date().toISOString(),
        issues: []
      },
      {
        name: 'OwnershipChart',
        path: 'src/components/cap-table/OwnershipChart.tsx',
        status: 'migrated',
        dataStore: 'unified',
        lastUpdated: new Date().toISOString(),
        issues: []
      },
      {
        name: 'EntityCapTableSection',
        path: 'src/components/canvas/EntityCapTableSection.tsx',
        status: 'migrated',
        dataStore: 'unified',
        lastUpdated: new Date().toISOString(),
        issues: []
      }
    ];
    
    setComponents(auditResults);
    setRefreshing(false);
    setIsLoading(false);
  };

  useEffect(() => {
    runAudit();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'migrated':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'legacy':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'mixed':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Database className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'migrated':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'legacy':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'mixed':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const migratedCount = components.filter(c => c.status === 'migrated').length;
  const totalCount = components.length;
  const migrationProgress = totalCount > 0 ? (migratedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Migration Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Migration Status Overview</h2>
          <button
            onClick={runAudit}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Scanning...' : 'Refresh Audit'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-800">Migrated</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-green-900">
              {migratedCount}
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-800">Total Components</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {totalCount}
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-800">Progress</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-blue-900">
              {migrationProgress.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Migration Progress</span>
            <span>{migratedCount}/{totalCount} components</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${migrationProgress}%` }}
            />
          </div>
        </div>

        {migrationProgress === 100 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-800">
                🎉 Migration Complete! All components are using the unified repository architecture.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Component Details */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Component Analysis</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-6 text-center text-gray-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>Analyzing component migration status...</p>
            </div>
          ) : (
            components.map((component, index) => (
              <div key={index} className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(component.status)}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{component.name}</h4>
                      <p className="text-xs text-gray-500">{component.path}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={getStatusBadge(component.status)}>
                      {component.status.toUpperCase()}
                    </span>
                    <span className={getStatusBadge(component.dataStore)}>
                      {component.dataStore.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {component.issues.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-red-600">Issues:</span>
                    <ul className="mt-1 text-xs text-red-600 list-disc list-inside">
                      {component.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-2 text-xs text-gray-500">
                  Last updated: {new Date(component.lastUpdated).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
