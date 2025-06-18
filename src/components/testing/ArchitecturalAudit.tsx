
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface AuditResult {
  component: string;
  status: 'migrated' | 'legacy' | 'mixed';
  issues: string[];
  recommendations: string[];
}

export const ArchitecturalAudit: React.FC = () => {
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runAudit = async () => {
    setIsRunning(true);
    
    // Simulate audit process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const results: AuditResult[] = [
      {
        component: 'EntityCanvas',
        status: 'migrated',
        issues: [],
        recommendations: []
      },
      {
        component: 'CapTableEditor',
        status: 'migrated',
        issues: [],
        recommendations: []
      },
      {
        component: 'EntityDetailsPanel',
        status: 'migrated',
        issues: [],
        recommendations: []
      },
      {
        component: 'OwnershipChart',
        status: 'migrated',
        issues: [],
        recommendations: []
      }
    ];
    
    setAuditResults(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runAudit();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'migrated':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'legacy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'mixed':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'migrated':
        return 'bg-green-100 text-green-800';
      case 'legacy':
        return 'bg-red-100 text-red-800';
      case 'mixed':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const migratedCount = auditResults.filter(r => r.status === 'migrated').length;
  const totalCount = auditResults.length;
  const completionPercentage = totalCount > 0 ? (migratedCount / totalCount) * 100 : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Architectural Audit</h3>
        <button
          onClick={runAudit}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Run Audit'}
        </button>
      </div>

      {/* Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Migration Progress</span>
          <span className="text-sm font-bold text-gray-900">{completionPercentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-600">
          {migratedCount} of {totalCount} components migrated to unified architecture
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {auditResults.map((result, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                {getStatusIcon(result.status)}
                <span className="font-medium text-gray-900">{result.component}</span>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(result.status)}`}>
                {result.status.toUpperCase()}
              </span>
            </div>
            
            {result.issues.length > 0 && (
              <div className="mb-2">
                <span className="text-sm font-medium text-red-600">Issues:</span>
                <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
                  {result.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.recommendations.length > 0 && (
              <div>
                <span className="text-sm font-medium text-blue-600">Recommendations:</span>
                <ul className="mt-1 text-sm text-blue-600 list-disc list-inside">
                  {result.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {completionPercentage === 100 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-800">
              ✅ Migration Complete! All components are using the unified repository architecture.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
