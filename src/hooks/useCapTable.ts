
import { useMemo, useState, useEffect } from 'react';
import { dataStore } from '@/services/dataStore';
import { syncCapTableData, SyncedStakeholderData } from '@/services/capTableSync';

export interface CapTableData {
  entity: any;
  capTable: any;
  totalShares: number;
  totalInvestment: number;
  availableShares: number;
  chartData: any[];
  tableData: SyncedStakeholderData[];
}

export const useCapTable = (entityId: string): CapTableData | null => {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setRefreshKey(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  return useMemo(() => {
    const entity = dataStore.getEntityById(entityId);
    const syncedData = syncCapTableData(entityId);

    if (!entity || !syncedData) {
      return null;
    }

    const totalInvestment = syncedData.stakeholders.reduce((sum, stakeholder) => sum + stakeholder.investmentAmount, 0);

    // Calculate chart data using synced stakeholder data
    const chartData = syncedData.stakeholders
      .filter(stakeholder => stakeholder.sharesOwned > 0)
      .map((stakeholder, index) => {
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'];
        
        return {
          name: stakeholder.name,
          value: stakeholder.ownershipPercentage,
          shares: stakeholder.sharesOwned,
          investmentAmount: stakeholder.investmentAmount,
          shareClass: stakeholder.shareClass,
          color: colors[index % colors.length],
        };
      });

    // Add available shares if any
    if (syncedData.availableShares > 0) {
      const availablePercentage = (syncedData.availableShares / syncedData.authorizedShares) * 100;
      chartData.push({
        name: 'Available for Issuance',
        value: availablePercentage,
        shares: syncedData.availableShares,
        investmentAmount: 0,
        shareClass: 'Unissued',
        color: '#e5e7eb',
      });
    }

    return {
      entity,
      capTable: {
        authorizedShares: syncedData.authorizedShares,
        shareholders: syncedData.stakeholders.map(s => ({
          id: s.id,
          name: s.name,
          type: s.type,
          entityId: s.entityId
        })),
        shareClasses: syncedData.stakeholders.map(s => ({
          id: s.id,
          name: s.shareClass,
          type: s.shareClass,
          votingRights: true
        })),
        investments: syncedData.stakeholders.map(s => ({
          id: s.id,
          shareholderId: s.id,
          shareClassId: s.id,
          sharesOwned: s.sharesOwned,
          pricePerShare: s.pricePerShare,
          investmentAmount: s.investmentAmount,
          investmentDate: new Date()
        }))
      },
      totalShares: syncedData.totalShares,
      totalInvestment,
      availableShares: syncedData.availableShares,
      chartData,
      tableData: syncedData.stakeholders,
    };
  }, [entityId, refreshKey]);
};

// Export functions for cap table mutations
export const addStakeholder = (entityId: string, stakeholder: { name: string; shareClass: string; sharesOwned: number; type?: 'Individual' | 'Entity' | 'Pool' }) => {
  dataStore.addStakeholder(entityId, stakeholder);
};

export const updateStakeholder = (entityId: string, stakeholderId: string, updates: { name?: string; shareClass?: string; sharesOwned?: number }) => {
  dataStore.updateStakeholder(entityId, stakeholderId, updates);
};

export const deleteStakeholder = (entityId: string, stakeholderId: string) => {
  dataStore.deleteStakeholder(entityId, stakeholderId);
};
