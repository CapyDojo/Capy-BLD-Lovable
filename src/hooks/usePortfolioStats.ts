
import { useMemo } from 'react';
import { getAllEntities, getCapTableByEntityId } from '@/data/mockData';
import { useComplianceData } from './useComplianceData';

export const usePortfolioStats = () => {
  const { alerts } = useComplianceData();
  
  const stats = useMemo(() => {
    const allEntities = getAllEntities();
    
    // 1. Total Entities
    const totalEntities = allEntities.length;

    // 2. Total Stakeholders from cap table investments
    const stakeholderIds = new Set<string>();
    allEntities.forEach(entity => {
      const capTable = getCapTableByEntityId(entity.id);
      capTable?.investments.forEach(inv => stakeholderIds.add(inv.shareholderId));
    });
    const totalStakeholders = stakeholderIds.size;

    // 3. Active Compliance Items
    const activeComplianceItems = alerts.filter(
      (alert) => alert.status === 'pending'
    ).length;
    
    // 4. Documents (keeping it static as no data source)
    const totalDocuments = 156;

    return {
      totalEntities,
      totalStakeholders,
      activeComplianceItems,
      totalDocuments,
    };
  }, [alerts]);

  return stats;
};
