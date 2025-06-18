
import React from 'react';

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow">
        <p className="font-medium text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600">
          {data.value.toFixed(1)}% ({data.shares > 0 ? data.shares.toLocaleString() + ' shares' : 'No shares'})
        </p>
      </div>
    );
  }
  return null;
};
