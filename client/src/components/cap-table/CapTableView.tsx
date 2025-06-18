
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { getUnifiedRepository } from '@/services/repositories/unified';
import { IUnifiedEntityRepository } from '@/services/repositories/unified/IUnifiedRepository';
import { CapTableView as CapTableViewType } from '@/types/unified';

interface CapTableViewProps {
  entityId: string;
}

export const CapTableView: React.FC<CapTableViewProps> = ({ entityId }) => {
  const [capTableData, setCapTableData] = useState<CapTableViewType | null>(null);
  const [repository, setRepository] = useState<IUnifiedEntityRepository | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Initialize unified repository
  useEffect(() => {
    const initRepository = async () => {
      try {
        console.log('🔄 CapTableView: Initializing unified repository for entity:', entityId);
        const repo = await getUnifiedRepository('ENTERPRISE');
        setRepository(repo);
        console.log('✅ CapTableView: Unified repository initialized');
      } catch (error) {
        console.error('❌ CapTableView: Failed to initialize repository:', error);
      }
    };

    initRepository();
  }, []);

  // Load data when repository is ready
  useEffect(() => {
    if (!repository) return;

    const loadData = async () => {
      try {
        console.log('🔄 CapTableView: Loading cap table for entity:', entityId);
        const capTable = await repository.getCapTableView(entityId);
        setCapTableData(capTable);
        console.log('✅ CapTableView: Cap table loaded');
      } catch (error) {
        console.error('❌ CapTableView: Error loading cap table:', error);
        setCapTableData(null);
      }
    };

    loadData();

    // Subscribe to repository changes
    const unsubscribe = repository.subscribe((event) => {
      console.log('📡 CapTableView: Received repository event:', event.type, event.entityId);
      if (event.entityId === entityId) {
        setRefreshKey(prev => prev + 1);
        loadData();
      }
    });

    return unsubscribe;
  }, [repository, entityId, refreshKey]);

  if (!capTableData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading cap table data...</p>
      </div>
    );
  }

  if (capTableData.totalShares === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No cap table data found for this entity.</p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto">
          <Plus className="h-4 w-4" />
          <span>Add Share Class</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" key={`cap-table-${refreshKey}`}>
      {/* Share Classes Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Share Classes</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Share Class</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Shares
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issued Shares
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price per Share
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {capTableData.shareClasses.map((shareClass) => (
                <tr key={shareClass.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {shareClass.name || shareClass.className || 'Unnamed Class'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shareClass.authorizedShares.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shareClass.issuedShares.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${(shareClass.pricePerShare || shareClass.price || 1).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ownership Summary Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Ownership Summary</h3>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Shareholder</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shareholder
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shares
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {capTableData.ownershipSummary.map((ownership) => (
                <tr key={ownership.ownershipId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {ownership.ownerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ownership.shares.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ownership.percentage.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Total Shares:</span>
            <span className="font-medium">{capTableData.totalShares.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Share Classes:</span>
            <span className="font-medium">{capTableData.shareClasses.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Shareholders:</span>
            <span className="font-medium">{capTableData.ownershipSummary.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
