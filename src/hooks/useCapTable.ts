
import { useMemo } from 'react';
import { getCapTableByEntityId, getEntityById } from '@/data/mockData';

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
  return useMemo(() => {
    const entity = getEntityById(entityId);
    const capTable = getCapTableByEntityId(entityId);

    if (!entity || !capTable) {
      return null;
    }

    const totalShares = capTable.investments.reduce((sum, inv) => sum + inv.sharesOwned, 0);
    const totalInvestment = capTable.investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
    const availableShares = capTable.authorizedShares - totalShares;

    // Calculate chart data
    const chartData = capTable.investments
      .filter(inv => inv.sharesOwned > 0)
      .map((investment, index) => {
        const shareholder = capTable.shareholders.find(s => s.id === investment.shareholderId);
        const shareClass = capTable.shareClasses.find(sc => sc.id === investment.shareClassId);
        const percentage = (investment.sharesOwned / totalShares) * 100;
        
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'];
        
        return {
          name: shareholder?.name || 'Unknown',
          value: percentage,
          shares: investment.sharesOwned,
          investmentAmount: investment.investmentAmount,
          shareClass: shareClass?.name || 'Unknown',
          color: colors[index % colors.length],
        };
      });

    // Add available shares if any
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

    // Calculate table data
    const tableData = capTable.investments.map((investment) => {
      const shareholder = capTable.shareholders.find(s => s.id === investment.shareholderId);
      const shareClass = capTable.shareClasses.find(sc => sc.id === investment.shareClassId);
      const ownershipPercentage = totalShares > 0 ? (investment.sharesOwned / totalShares) * 100 : 0;
      
      return {
        id: investment.id,
        name: shareholder?.name || 'Unknown',
        type: shareholder?.type || 'Unknown',
        sharesOwned: investment.sharesOwned,
        shareClass: shareClass?.name || 'Unknown',
        ownershipPercentage,
        fullyDiluted: totalShares > 0 ? (investment.sharesOwned / capTable.authorizedShares) * 100 : 0,
        pricePerShare: investment.pricePerShare,
        investmentAmount: investment.investmentAmount,
      };
    });

    return {
      entity,
      capTable,
      totalShares,
      totalInvestment,
      availableShares,
      chartData,
      tableData,
    };
  }, [entityId]);
};
