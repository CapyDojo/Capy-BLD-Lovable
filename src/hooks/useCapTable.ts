import { useMemo } from 'react';
import { getEntityById } from '@/data/mockData';
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
  return useMemo(() => {
    const entity = getEntityById(entityId);
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
  }, [entityId]);
};
