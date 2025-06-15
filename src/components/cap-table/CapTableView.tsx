
import React from 'react';
import { Building2, User, Users } from 'lucide-react';

const capTableData = [
  {
    id: 1,
    name: 'Founders',
    type: 'Individual',
    sharesOwned: 7000000,
    shareClass: 'Common Stock',
    ownershipPercentage: 70.0,
    fullyDiluted: 58.3,
    pricePerShare: 0.001,
    investmentAmount: 7000,
    icon: User,
  },
  {
    id: 2,
    name: 'Series A Investors',
    type: 'Entity',
    sharesOwned: 2000000,
    shareClass: 'Preferred Series A',
    ownershipPercentage: 20.0,
    fullyDiluted: 16.7,
    pricePerShare: 1.00,
    investmentAmount: 2000000,
    icon: Building2,
  },
  {
    id: 3,
    name: 'Employee Stock Option Pool',
    type: 'Pool',
    sharesOwned: 1000000,
    shareClass: 'Stock Options',
    ownershipPercentage: 10.0,
    fullyDiluted: 8.3,
    pricePerShare: 0.001,
    investmentAmount: 1000,
    icon: Users,
  },
  {
    id: 4,
    name: 'Convertible Note Holders',
    type: 'Entity',
    sharesOwned: 0,
    shareClass: 'Convertible Notes',
    ownershipPercentage: 0.0,
    fullyDiluted: 16.7,
    pricePerShare: 0.80,
    investmentAmount: 500000,
    icon: Building2,
  },
];

export const CapTableView: React.FC = () => {
  const totalShares = capTableData.reduce((sum, item) => sum + item.sharesOwned, 0);
  const totalInvestment = capTableData.reduce((sum, item) => sum + item.investmentAmount, 0);
  const authorizedShares = 12000000;
  const availableShares = authorizedShares - totalShares;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Capitalization Table</h3>
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
            {capTableData.map((item) => (
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
                  {item.ownershipPercentage}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {item.fullyDiluted}%
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
                100.0%
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
                Authorized: {authorizedShares.toLocaleString()} shares
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
