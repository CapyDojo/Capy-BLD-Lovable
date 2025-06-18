
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { ChartTooltip } from './components/ChartTooltip';
import { ChartLegend } from './components/ChartLegend';
import { EntityInfo } from './components/EntityInfo';
import { useOwnershipChartData } from './hooks/useOwnershipChartData';

interface OwnershipChartProps {
  entityId: string;
}

export const OwnershipChart: React.FC<OwnershipChartProps> = ({ entityId }) => {
  const { entity, capTableView, chartData, refreshKey, isLoading } = useOwnershipChartData(entityId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p>Loading ownership data...</p>
        </div>
      </div>
    );
  }

  if (!entity || !capTableView || capTableView.totalShares === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p>No ownership data found for this entity.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" key={`chart-${refreshKey}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Ownership Distribution - {entity.name}
        </h3>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          ✅ Enterprise Store
        </Badge>
      </div>
      
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
                  <Cell key={`cell-${index}-${refreshKey}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-6">
          <ChartLegend chartData={chartData} refreshKey={refreshKey} />
          <EntityInfo entity={entity} capTableView={capTableView} />
        </div>
      </div>
    </div>
  );
};
