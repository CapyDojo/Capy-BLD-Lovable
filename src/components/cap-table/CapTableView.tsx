
import React from 'react';
import { Building2, User, Users } from 'lucide-react';
import { useCapTable } from '@/hooks/useCapTable';

interface CapTableViewProps {
  entityId: string;
}

export const CapTableView: React.FC<CapTableViewProps> = ({ entityId }) => {
  const capTableData = useCapTable(entityId);

  if (!capTableData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p>No cap table data found for this entity.</p>
        </div>
      </div>
    );
  }

  const { entity, capTable, totalShares, totalInvestment, availableShares, tableData } = capTableData;

  // Add icons to table data
  const enhancedTableData = tableData.map(item => ({
    ...item,
    icon: item.type === 'Individual' ? User : item.type === 'Pool' ? Users : Building2,
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Capitalization Table - {entity.name}
          </h3>
          <div className="text-sm text-gray-600 space-x-4">
            <span>Total Investment: <span className="font-medium">${totalInvestment.toLocaleString()}</span></span>
            <span>Outstanding Shares: <span className="font-medium">{totalShares.toLocaleString()}</span></span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stakeholder
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Security Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shares
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price/Share
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Investment
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Basic %
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fully Diluted %
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {enhancedTableData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center">
                        <item.icon className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.type}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    item.shareClass.includes('Common') ? 'bg-green-100 text-green-800' :
                    item.shareClass.includes('Preferred') ? 'bg-purple-100 text-purple-800' :
                    item.shareClass.includes('Options') ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {item.shareClass}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  {item.sharesOwned > 0 ? item.sharesOwned.toLocaleString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  ${item.pricePerShare.toFixed(3)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  ${item.investmentAmount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {item.ownershipPercentage.toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {item.fullyDiluted.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-6 py-3 text-sm font-medium text-gray-900" colSpan={2}>
                Total Outstanding
              </td>
              <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                {totalShares.toLocaleString()}
              </td>
              <td className="px-6 py-3 text-right text-sm text-gray-500">
                -
              </td>
              <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                ${totalInvestment.toLocaleString()}
              </td>
              <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                100.0%
              </td>
              <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                {((totalShares / capTable.authorizedShares) * 100).toFixed(1)}%
              </td>
            </tr>
            <tr>
              <td className="px-6 py-3 text-sm text-gray-600" colSpan={2}>
                Available for Issuance
              </td>
              <td className="px-6 py-3 text-right text-sm text-gray-600">
                {availableShares.toLocaleString()}
              </td>
              <td className="px-6 py-3 text-right text-sm text-gray-500" colSpan={4}>
                Authorized: {capTable.authorizedShares.toLocaleString()} shares
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
