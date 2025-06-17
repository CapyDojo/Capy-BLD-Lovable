import { useMemo, useState, useEffect } from 'react';
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
  const [dataSnapshot, setDataSnapshot] = useState({
    shareholders: dataStore.getShareholders(),
    shareClasses: dataStore.getShareClasses(),
    capTable: dataStore.getCapTableByEntityId(entityId)
  });

  // Enhanced subscription to dataStore with forced refresh
  useEffect(() => {
    console.log('🔗 useCapTable: Subscribing to dataStore for entity:', entityId);
    const unsubscribe = dataStore.subscribe(() => {
      console.log('📡 useCapTable: DataStore updated, forcing refresh for entity:', entityId);
      
      // Update data snapshot to force memoization refresh
      setDataSnapshot({
        shareholders: dataStore.getShareholders(),
        shareClasses: dataStore.getShareClasses(),
        capTable: dataStore.getCapTableByEntityId(entityId)
      });
      
      setRefreshTrigger(prev => prev + 1);
    });
    return unsubscribe;
  }, [entityId]);

  return useMemo(() => {
    console.log('🔄 useCapTable: Computing data for entity:', entityId, 'refresh trigger:', refreshTrigger);
    
    const entity = dataStore.getEntityById(entityId);
    if (!entity) {
      console.log('❌ Entity not found:', entityId);
      return null;
    }

    const capTable = dataSnapshot.capTable;
    if (!capTable) {
      console.log('❌ No cap table found for entity:', entityId);
      return null;
    }

    // Use snapshot data to ensure we get the latest values
    const allShareholders = dataSnapshot.shareholders;
    const allShareClasses = dataSnapshot.shareClasses;

    console.log('🔍 DEBUG: Cap table for', entity.name, 'has', capTable.investments.length, 'investments');
    console.log('🔍 DEBUG: All shareholders count:', allShareholders.length);
    console.log('🔍 DEBUG: Data snapshot timestamp:', Date.now());
    
    capTable.investments.forEach((inv, index) => {
      const shareholder = allShareholders.find(s => s.id === inv.shareholderId);
      console.log(`  Investment ${index + 1}:`, {
        investmentId: inv.id,
        shareholderId: inv.shareholderId,
        shareholderName: shareholder?.name || 'UNKNOWN',
        sharesOwned: inv.sharesOwned
      });
    });

    const totalShares = capTable.investments.reduce((sum, inv) => sum + inv.sharesOwned, 0);
    const availableShares = capTable.authorizedShares - totalShares;

    // Build table data with current shareholder names from snapshot
    const tableData = capTable.investments.map((investment) => {
      const shareholder = allShareholders.find(s => s.id === investment.shareholderId);
      const shareClass = allShareClasses.find(sc => sc.id === investment.shareClassId);
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

    // Build chart data
    const chartData = tableData
      .filter(item => item.sharesOwned > 0)
      .map((item, index) => {
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'];
        return {
          name: item.name,
          value: item.ownershipPercentage,
          shares: item.sharesOwned,
          investmentAmount: item.investmentAmount,
          shareClass: item.shareClass,
          color: colors[index % colors.length],
        };
      });

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

    console.log('✅ Cap table data computed for:', entity.name, 'with', tableData.length, 'stakeholders');
    console.log('📊 Final table data:', tableData.map(t => ({ name: t.name, shares: t.sharesOwned })));

    return {
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
  }, [entityId, refreshTrigger, dataSnapshot.shareholders.length, dataSnapshot.shareClasses.length, dataSnapshot.capTable?.investments.length]);
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
