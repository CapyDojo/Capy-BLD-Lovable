
import React from 'react';
import { Building2, User, Users } from 'lucide-react';

const capTableData = [
  {
    id: 1,
    name: 'John Doe',
    type: 'Individual',
    sharesOwned: 500000,
    shareClass: 'Common',
    ownershipPercentage: 45.5,
    fullyDiluted: 38.5,
    icon: User,
  },
  {
    id: 2,
    name: 'Venture Capital Fund',
    type: 'Entity',
    sharesOwned: 300000,
    shareClass: 'Preferred Series A',
    ownershipPercentage: 27.3,
    fullyDiluted: 23.1,
    icon: Building2,
  },
  {
    id: 3,
    name: 'Employee Option Pool',
    type: 'Pool',
    sharesOwned: 200000,
    shareClass: 'Options',
    ownershipPercentage: 18.2,
    fullyDiluted: 15.4,
    icon: Users,
  },
  {
    id: 4,
    name: 'Angel Investor',
    type: 'Individual',
    sharesOwned: 100000,
    shareClass: 'Convertible Note',
    ownershipPercentage: 9.1,
    fullyDiluted: 7.7,
    icon: User,
  },
];

export const CapTableView: React.FC = () => {
  const totalShares = capTableData.reduce((sum, item) => sum + item.sharesOwned, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Ownership Summary</h3>
          <div className="text-sm text-gray-600">
            Total Shares: <span className="font-medium">{totalShares.toLocaleString()}</span>
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
                Share Class
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shares Owned
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ownership %
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
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                    {item.shareClass}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  {item.sharesOwned.toLocaleString()}
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
        </table>
      </div>
    </div>
  );
};
