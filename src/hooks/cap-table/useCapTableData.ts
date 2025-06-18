
import { useState, useEffect } from 'react';
import { IUnifiedEntityRepository } from '@/services/repositories/unified/IUnifiedRepository';

export const useCapTableData = (repository: IUnifiedEntityRepository | null, entityId: string, refreshTrigger: number) => {
  const [capTableView, setCapTableView] = useState(null);
  const [entity, setEntity] = useState(null);

  useEffect(() => {
    if (!repository) return;

    const loadData = async () => {
      try {
        console.log('🔄 useCapTableData: Loading data for entity:', entityId);
        
        const entityData = await repository.getEntity(entityId);
        const capTable = await repository.getCapTableView(entityId);
        
        setEntity(entityData);
        setCapTableView(capTable);
        
        console.log('✅ useCapTableData: Data loaded successfully');
      } catch (error) {
        console.error('❌ useCapTableData: Error loading data:', error);
      }
    };

    loadData();

    // Subscribe to repository changes
    const unsubscribe = repository.subscribe((event) => {
      console.log('📡 useCapTableData: Received repository event:', event.type, event.entityId);
      if (event.entityId === entityId) {
        loadData();
      }
    });

    return unsubscribe;
  }, [repository, entityId, refreshTrigger]);

  return { entity, capTableView };
};
