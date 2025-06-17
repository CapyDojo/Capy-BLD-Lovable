import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { dataStore } from '@/services/dataStore';

export interface CapTableData {
  entity: any;
  capTable: any;
  totalShares: number;
  totalInvestment: number;
  availableShares: number;
  chartData: any[];
  tableData: any[];
}

export const useCapTable = (entityId: string): CapTableData | null => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const lastComputedRef = useRef<{ entityId: string; data: CapTableData | null; timestamp: number }>({ 
    entityId: '', 
    data: null, 
    timestamp: 0 
  });

  // Throttled refresh to prevent excessive re-computations
  const throttledRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastComputedRef.current.timestamp < 100) { // Throttle to max 10 updates per second
      return;
    }
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Enhanced subscription to dataStore with throttling
  useEffect(() => {
    console.log('🔗 useCapTable: Subscribing to dataStore for entity:', entityId);
    const unsubscribe = dataStore.subscribe(throttledRefresh);
    return unsubscribe;
  }, [entityId, throttledRefresh]);

  return useMemo(() => {
    const startTime = performance.now();
    console.log('🔄 useCapTable: Computing data for entity:', entityId);
    
    const entity = dataStore.getEntityById(entityId);
    if (!entity) {
      console.log('❌ Entity not found:', entityId);
      return null;
    }

    const capTable = dataStore.getCapTableByEntityId(entityId);
    if (!capTable) {
      console.log('❌ No cap table found for entity:', entityId);
      return null;
    }

    // Use efficient data fetching
    const allShareholders = dataStore.getShareholders();
    const allShareClasses = dataStore.getShareClasses();

    // Create lookup maps for better performance
    const shareholderMap = new Map(allShareholders.map(s => [s.id, s]));
    const shareClassMap = new Map(allShareClasses.map(sc => [sc.id, sc]));

    console.log('🔍 DEBUG: Processing cap table for', entity.name, 'with', capTable.investments.length, 'investments');
    
    const totalShares = capTable.investments.reduce((sum, inv) => sum + inv.sharesOwned, 0);
    const availableShares = capTable.authorizedShares - totalShares;

    // Build table data with optimized lookups
    const tableData = capTable.investments.map((investment) => {
      const shareholder = shareholderMap.get(investment.shareholderId);
      const shareClass = shareClassMap.get(investment.shareClassId);
      const ownershipPercentage = totalShares > 0 ? (investment.sharesOwned / totalShares) * 100 : 0;
      const fullyDiluted = capTable.authorizedShares > 0 ? (investment.sharesOwned / capTable.authorizedShares) * 100 : 0;

      return {
        id: investment.id,
        name: shareholder?.name || 'Unknown',
        type: shareholder?.type || 'Individual',
        entityId: shareholder?.entityId,
        sharesOwned: investment.sharesOwned,
        shareClass: shareClass?.name || 'Unknown',
        ownershipPercentage,
        fullyDiluted,
        pricePerShare: investment.pricePerShare,
        investmentAmount: investment.investmentAmount,
      };
    });

    const totalInvestment = tableData.reduce((sum, item) => sum + item.investmentAmount, 0);

    // Build chart data with color optimization
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'];
    const chartData = tableData
      .filter(item => item.sharesOwned > 0)
      .map((item, index) => ({
        name: item.name,
        value: item.ownershipPercentage,
        shares: item.sharesOwned,
        investmentAmount: item.investmentAmount,
        shareClass: item.shareClass,
        color: colors[index % colors.length],
      }));

    // Add available shares to chart if any
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

    const result = {
      entity,
      capTable: {
        authorizedShares: capTable.authorizedShares,
        shareholders: allShareholders,
        shareClasses: allShareClasses,
        investments: capTable.investments
      },
      totalShares,
      totalInvestment,
      availableShares,
      chartData,
      tableData,
    };

    // Cache the result
    lastComputedRef.current = {
      entityId,
      data: result,
      timestamp: Date.now()
    };

    const endTime = performance.now();
    console.log(`✅ Cap table computed for ${entity.name} in ${(endTime - startTime).toFixed(2)}ms`);

    return result;
  }, [entityId, refreshTrigger]);
};

// Simplified mutation functions that just use dataStore directly
export const addStakeholder = (entityId: string, stakeholder: { name: string; shareClass: string; sharesOwned: number; type?: 'Individual' | 'Entity' | 'Pool' }) => {
  console.log('➕ Adding stakeholder to entity:', entityId, stakeholder);
  dataStore.addStakeholder(entityId, stakeholder);
};

export const updateStakeholder = (entityId: string, stakeholderId: string, updates: { name?: string; shareClass?: string; sharesOwned?: number }) => {
  console.log('📝 Updating stakeholder:', stakeholderId, 'in entity:', entityId, updates);
  dataStore.updateStakeholder(entityId, stakeholderId, updates);
};

export const deleteStakeholder = (entityId: string, stakeholderId: string) => {
  console.log('🗑️ Deleting stakeholder:', stakeholderId, 'from entity:', entityId);
  dataStore.deleteStakeholder(entityId, stakeholderId);
};
