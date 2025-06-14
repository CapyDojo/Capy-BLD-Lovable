
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const chartData = [
  { name: 'John Doe', value: 45.5, color: '#3b82f6' },
  { name: 'Venture Capital Fund', value: 27.3, color: '#10b981' },
  { name: 'Employee Option Pool', value: 18.2, color: '#f59e0b' },
  { name: 'Angel Investor', value: 9.1, color: '#ef4444' },
];

export const OwnershipChart: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Ownership Distribution</h3>
      
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
              <Tooltip 
                formatter={(value: number) => [`${value}%`, 'Ownership']}
                labelStyle={{ color: '#374151' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Ownership Breakdown</h4>
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
          
          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <div className="flex justify-between mb-2">
                <span>Total Authorized Shares:</span>
                <span className="font-medium">10,000,000</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Shares Outstanding:</span>
                <span className="font-medium">1,100,000</span>
              </div>
              <div className="flex justify-between">
                <span>Available for Issuance:</span>
                <span className="font-medium">8,900,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
