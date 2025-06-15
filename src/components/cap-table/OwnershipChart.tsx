
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const chartData = [
  { name: 'Founders', value: 58.3, color: '#10b981', shares: 7000000 },
  { name: 'Series A Investors', value: 16.7, color: '#3b82f6', shares: 2000000 },
  { name: 'Employee Option Pool', value: 8.3, color: '#f59e0b', shares: 1000000 },
  { name: 'Convertible Notes (Future)', value: 16.7, color: '#ef4444', shares: 0 },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow">
        <p className="font-medium text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600">
          {data.value}% ({data.shares > 0 ? data.shares.toLocaleString() + ' shares' : 'Future dilution'})
        </p>
      </div>
    );
  }
  return null;
};

export const OwnershipChart: React.FC = () => {
  const totalShares = 10000000; // Current outstanding shares
  const authorizedShares = 12000000;
  const companyValuation = 10000000; // $10M post-money valuation

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Ownership Distribution (Fully Diluted)</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Ownership Breakdown</h4>
            <div className="space-y-3">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Total Authorized Shares:</span>
                <span className="font-medium">{authorizedShares.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shares Outstanding:</span>
                <span className="font-medium">{totalShares.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Available for Issuance:</span>
                <span className="font-medium">{(authorizedShares - totalShares).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span>Post-Money Valuation:</span>
                <span className="font-medium">${(companyValuation / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between">
                <span>Price per Share (Last Round):</span>
                <span className="font-medium">$1.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
