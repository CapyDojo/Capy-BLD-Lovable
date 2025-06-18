
import { useState, useEffect } from 'react';
import { getUnifiedRepository } from '@/services/repositories/unified';
import { IUnifiedEntityRepository } from '@/services/repositories/unified/IUnifiedRepository';
import { Entity } from '@/types/entity';
import { CapTableView } from '@/types/unified';

export const useOwnershipChartData = (entityId: string) => {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [capTableView, setCapTableView] = useState<CapTableView | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [repository, setRepository] = useState<IUnifiedEntityRepository | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Initialize repository
  useEffect(() => {
    const initRepository = async () => {
      try {
        console.log('🔄 useOwnershipChartData: Initializing unified repository for entity:', entityId);
        const repo = await getUnifiedRepository('ENTERPRISE');
        setRepository(repo);
        console.log('✅ useOwnershipChartData: Unified repository initialized');
      } catch (error) {
        console.error('❌ useOwnershipChartData: Failed to initialize repository:', error);
      }
    };

    initRepository();
  }, []);

  // Load data when repository is ready
  useEffect(() => {
    if (!repository) return;

    const loadData = async () => {
      try {
        console.log('🔄 useOwnershipChartData: Loading data for entity:', entityId);
        
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

        console.log('✅ useOwnershipChartData: Data loaded successfully');
      } catch (error) {
        console.error('❌ useOwnershipChartData: Error loading data:', error);
      }
    };

    loadData();

    // Subscribe to repository changes
    const unsubscribe = repository.subscribe((event) => {
      console.log('📡 useOwnershipChartData: Received repository event:', event.type, event.entityId);
      if (event.entityId === entityId) {
        setRefreshKey(prev => prev + 1);
        loadData();
      }
    });

    return unsubscribe;
  }, [repository, entityId, refreshKey]);

  return {
    entity,
    capTableView,
    chartData,
    refreshKey,
    isLoading: !entity || !capTableView
  };
};
