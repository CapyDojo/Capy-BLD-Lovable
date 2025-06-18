
import { useState, useEffect } from 'react';
import { getUnifiedRepository } from '@/services/repositories/unified';
import { IUnifiedEntityRepository } from '@/services/repositories/unified/IUnifiedRepository';

export const useCapTableRepository = () => {
  const [repository, setRepository] = useState<IUnifiedEntityRepository | null>(null);

  useEffect(() => {
    const initRepository = async () => {
      try {
        console.log('🔄 useCapTableRepository: Initializing unified repository');
        const repo = await getUnifiedRepository('ENTERPRISE');
        setRepository(repo);
        console.log('✅ useCapTableRepository: Unified repository initialized');
      } catch (error) {
        console.error('❌ useCapTableRepository: Failed to initialize repository:', error);
      }
    };

    initRepository();
  }, []);

  return repository;
};
