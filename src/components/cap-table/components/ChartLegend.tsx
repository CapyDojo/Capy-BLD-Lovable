
import React from 'react';

interface ChartLegendProps {
  chartData: any[];
  refreshKey: number;
}

export const ChartLegend: React.FC<ChartLegendProps> = ({ chartData, refreshKey }) => {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-900 mb-4">Ownership Breakdown</h4>
      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div key={`${index}-${refreshKey}`} className="flex items-center justify-between">
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
  );
};
