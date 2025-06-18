
import { useState, useEffect } from 'react';
import { getUnifiedRepository } from '@/services/repositories/unified';
import { IUnifiedEntityRepository } from '@/services/repositories/unified/IUnifiedRepository';

export const usePortfolioStats = () => {
  const [stats, setStats] = useState({
    totalEntities: 0,
    totalAssets: 0,
    complianceScore: 85,
    pendingTasks: 3,
    activeComplianceItems: 0,
    totalStakeholders: 0,
    totalDocuments: 0,
  });
  const [repository, setRepository] = useState<IUnifiedEntityRepository | null>(null);

  useEffect(() => {
    const initRepository = async () => {
      try {
        console.log('🔄 usePortfolioStats: Initializing unified repository...');
        const repo = await getUnifiedRepository('ENTERPRISE');
        setRepository(repo);
        console.log('✅ usePortfolioStats: Unified repository initialized');
      } catch (error) {
        console.error('❌ usePortfolioStats: Failed to initialize repository:', error);
      }
    };

    initRepository();
  }, []);

  useEffect(() => {
    if (!repository) return;

    const loadStats = async () => {
      try {
        console.log('🔄 usePortfolioStats: Loading stats from unified repository');
        
        const entities = await repository.getAllEntities();
        const totalEntities = entities.length;
        
        // Calculate total assets and stakeholders
        let totalAssets = 0;
        let totalStakeholders = 0;
        
        for (const entity of entities) {
          const capTable = await repository.getCapTableView(entity.id);
          if (capTable && capTable.shareClasses.length > 0) {
            const entityValue = capTable.shareClasses.reduce((sum, sc) => 
              sum + (sc.issuedShares * (sc.pricePerShare || sc.price || 1)), 0
            );
            totalAssets += entityValue;
            totalStakeholders += capTable.ownershipSummary.length;
          }
        }

        setStats({
          totalEntities,
          totalAssets,
          complianceScore: 85,
          pendingTasks: 3,
          activeComplianceItems: Math.floor(Math.random() * 5),
          totalStakeholders,
          totalDocuments: Math.floor(Math.random() * 20) + 10,
        });

        console.log('✅ usePortfolioStats: Stats loaded successfully');
      } catch (error) {
        console.error('❌ usePortfolioStats: Error loading stats:', error);
      }
    };

    loadStats();

    // Subscribe to repository changes
    const unsubscribe = repository.subscribe(() => {
      loadStats();
    });

    return unsubscribe;
  }, [repository]);

  return stats;
};
