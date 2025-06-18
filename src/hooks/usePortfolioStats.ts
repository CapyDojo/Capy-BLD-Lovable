
import { useState, useEffect } from 'react';
import { getUnifiedRepository } from '@/services/repositories/unified';
import { IUnifiedEntityRepository } from '@/services/repositories/unified/IUnifiedRepository';

export const usePortfolioStats = () => {
  const [stats, setStats] = useState({
    totalEntities: 0,
    totalAssets: 0,
    complianceScore: 85,
    pendingTasks: 3,
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
        
        // Calculate total assets based on entity valuations (simplified)
        let totalAssets = 0;
        for (const entity of entities) {
          const capTable = await repository.getCapTableView(entity.id);
          if (capTable && capTable.shareClasses.length > 0) {
            const entityValue = capTable.shareClasses.reduce((sum, sc) => 
              sum + (sc.issuedShares * sc.pricePerShare), 0
            );
            totalAssets += entityValue;
          }
        }

        setStats({
          totalEntities,
          totalAssets,
          complianceScore: 85, // Static for now
          pendingTasks: 3, // Static for now
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
