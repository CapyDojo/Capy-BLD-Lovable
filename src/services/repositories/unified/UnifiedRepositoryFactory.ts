
import { IUnifiedEntityRepository } from './IUnifiedRepository';
import { EnterpriseRepositoryAdapter } from './EnterpriseRepositoryAdapter';

export type RepositoryMode = 'LEGACY' | 'ENTERPRISE';

export const createUnifiedRepository = async (mode: RepositoryMode = 'ENTERPRISE'): Promise<IUnifiedEntityRepository> => {
  console.log('🏭 UnifiedRepositoryFactory: Creating repository in mode:', mode);
  
  // Always use Enterprise mode now since legacy is removed
  console.log('🚀 UnifiedRepositoryFactory: Using Enterprise Repository Adapter');
  return new EnterpriseRepositoryAdapter();
};
