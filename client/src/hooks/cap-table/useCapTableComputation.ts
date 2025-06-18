
import { useMemo } from 'react';

export const useCapTableComputation = (entity: any, capTableView: any, refreshTrigger: number) => {
  return useMemo(() => {
    if (!entity || !capTableView) {
      console.log('❌ useCapTableComputation: Missing entity or cap table data');
      return null;
    }

    console.log('🔄 useCapTableComputation: Computing data for entity:', entity.id, 'refresh trigger:', refreshTrigger);

    const totalShares = capTableView.totalShares;
    const availableShares = Math.max(0, (capTableView.authorizedShares || totalShares) - totalShares);

    // Build table data from ownership summary
    const tableData = capTableView.ownershipSummary.map((ownership) => {
      const totalInvestmentAmount = ownership.shares * (ownership.pricePerShare || 1);

      return {
        id: ownership.ownershipId,
        name: ownership.ownerName,
        type: 'Individual',
        entityId: ownership.ownerEntityId,
        sharesOwned: ownership.shares,
        shareClass: ownership.shareClassName,
        ownershipPercentage: ownership.percentage,
        fullyDiluted: (capTableView.authorizedShares || totalShares) > 0 ? 
          (ownership.shares / (capTableView.authorizedShares || totalShares)) * 100 : 0,
        pricePerShare: ownership.pricePerShare || 1,
        investmentAmount: totalInvestmentAmount,
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
      const availablePercentage = ((capTableView.authorizedShares || totalShares) > 0) ? 
        (availableShares / (capTableView.authorizedShares || totalShares)) * 100 : 0;
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

    return {
      entity,
      capTable: capTableView,
      totalShares,
      totalInvestment,
      availableShares,
      chartData,
      tableData,
    };
  }, [entity, capTableView, refreshTrigger]);
};
