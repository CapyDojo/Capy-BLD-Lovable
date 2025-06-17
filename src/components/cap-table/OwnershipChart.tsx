import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getUnifiedRepository } from '@/services/repositories/unified';
import { IUnifiedEntityRepository } from '@/services/repositories/unified/IUnifiedRepository';
import { Entity } from '@/types/entity';
import { CapTableView } from '@/types/unified';
import { Badge } from '@/components/ui/badge';

interface OwnershipChartProps {
  entityId: string;
}

const CustomTooltip = ({ active, payload }: any) => {
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

export const OwnershipChart: React.FC<OwnershipChartProps> = ({ entityId }) => {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [capTableView, setCapTableView] = useState<CapTableView | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [repository, setRepository] = useState<IUnifiedEntityRepository | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Initialize repository
  useEffect(() => {
    const initRepository = async () => {
      try {
        console.log('🔄 OwnershipChart: Initializing unified repository for entity:', entityId);
        const repo = await getUnifiedRepository('ENTERPRISE');
        setRepository(repo);
        console.log('✅ OwnershipChart: Unified repository initialized');
      } catch (error) {
        console.error('❌ OwnershipChart: Failed to initialize repository:', error);
      }
    };

    initRepository();
  }, []);

  // Load data when repository is ready
  useEffect(() => {
    if (!repository) return;

    const loadData = async () => {
      try {
        console.log('🔄 OwnershipChart: Loading data for entity:', entityId);
        
        const entityData = await repository.getEntity(entityId);
        const capTable = await repository.getCapTableView(entityId);
        
        setEntity(entityData);
        setCapTableView(capTable);

        // Generate chart data
        if (capTable && capTable.ownershipSummary.length > 0) {
          const colors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
            '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
          ];

          const data = capTable.ownershipSummary.map((ownership, index) => ({
            name: ownership.ownerName,
            value: ownership.percentage,
            shares: ownership.shares,
            color: colors[index % colors.length]
          }));

          setChartData(data);
        } else {
          setChartData([]);
        }

        console.log('✅ OwnershipChart: Data loaded successfully');
      } catch (error) {
        console.error('❌ OwnershipChart: Error loading data:', error);
      }
    };

    loadData();

    // Subscribe to repository changes
    const unsubscribe = repository.subscribe((event) => {
      console.log('📡 OwnershipChart: Received repository event:', event.type, event.entityId);
      if (event.entityId === entityId) {
        setRefreshKey(prev => prev + 1);
        loadData();
      }
    });

    return unsubscribe;
  }, [repository, entityId, refreshKey]);

  if (!entity || !capTableView) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p>Loading ownership data...</p>
        </div>
      </div>
    );
  }

  if (capTableView.totalShares === 0) {
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
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-6">
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
          
          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Entity Type:</span>
                <span className="font-medium">{entity.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Jurisdiction:</span>
                <span className="font-medium">{entity.jurisdiction || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Shares:</span>
                <span className="font-medium">{capTableView.totalShares.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shareholders:</span>
                <span className="font-medium">{capTableView.ownershipSummary.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Share Classes:</span>
                <span className="font-medium">{capTableView.shareClasses.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
