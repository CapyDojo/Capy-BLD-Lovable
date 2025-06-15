
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getCapTableByEntityId, getEntityById } from '@/data/mockData';

interface OwnershipChartProps {
  entityId: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow">
        <p className="font-medium text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600">
          {data.value.toFixed(1)}% ({data.shares > 0 ? data.shares.toLocaleString() + ' shares' : 'Future dilution'})
        </p>
        {data.investmentAmount > 0 && (
          <p className="text-sm text-gray-600">
            Investment: ${data.investmentAmount.toLocaleString()}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const OwnershipChart: React.FC<OwnershipChartProps> = ({ entityId }) => {
  const entity = getEntityById(entityId);
  const capTable = getCapTableByEntityId(entityId);

  if (!entity || !capTable) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p>No ownership data found for this entity.</p>
        </div>
      </div>
    );
  }

  const totalShares = capTable.investments.reduce((sum, inv) => sum + inv.sharesOwned, 0);
  const totalInvestment = capTable.investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);

  // Prepare chart data
  const chartData = capTable.investments
    .filter(inv => inv.sharesOwned > 0)
    .map((investment, index) => {
      const shareholder = capTable.shareholders.find(s => s.id === investment.shareholderId);
      const shareClass = capTable.shareClasses.find(sc => sc.id === investment.shareClassId);
      const percentage = (investment.sharesOwned / totalShares) * 100;
      
      return {
        name: shareholder?.name || 'Unknown',
        value: percentage,
        shares: investment.sharesOwned,
        investmentAmount: investment.investmentAmount,
        shareClass: shareClass?.name || 'Unknown',
        color: COLORS[index % COLORS.length],
      };
    });

  // Add available shares if any
  const availableShares = capTable.authorizedShares - totalShares;
  if (availableShares > 0) {
    const availablePercentage = (availableShares / capTable.authorizedShares) * 100;
    chartData.push({
      name: 'Available for Issuance',
      value: availablePercentage,
      shares: availableShares,
      investmentAmount: 0,
      shareClass: 'Unissued',
      color: '#e5e7eb',
    });
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        Ownership Distribution - {entity.name}
      </h3>
      
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
                  <span className="text-sm font-medium text-gray-900">{item.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Entity Type:</span>
                <span className="font-medium">{entity.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Jurisdiction:</span>
                <span className="font-medium">{entity.jurisdiction}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Authorized Shares:</span>
                <span className="font-medium">{capTable.authorizedShares.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shares Outstanding:</span>
                <span className="font-medium">{totalShares.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Available for Issuance:</span>
                <span className="font-medium">{availableShares.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span>Total Investment:</span>
                <span className="font-medium">${totalInvestment.toLocaleString()}</span>
              </div>
              {capTable.lastRoundValuation && (
                <div className="flex justify-between">
                  <span>Last Round Valuation:</span>
                  <span className="font-medium">${(capTable.lastRoundValuation / 1000000).toFixed(1)}M</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
