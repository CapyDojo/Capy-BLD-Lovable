
import { IUnifiedEntityRepository } from './IUnifiedRepository';
import { EnterpriseRepositoryAdapter } from './EnterpriseRepositoryAdapter';
import { EnterpriseDataStoreFactory } from '@/services/dataStore/EnterpriseDataStoreFactory';

export type RepositoryMode = 'ENTERPRISE';

export const createUnifiedRepository = async (mode: RepositoryMode = 'ENTERPRISE'): Promise<IUnifiedEntityRepository> => {
  console.log('🏭 UnifiedRepositoryFactory: Creating repository in mode:', mode);
  
  console.log('🚀 UnifiedRepositoryFactory: Using Enterprise Repository Adapter');
  const enterpriseStore = await EnterpriseDataStoreFactory.createEnterpriseStore('development');
  return new EnterpriseRepositoryAdapter(enterpriseStore);
};

export class UnifiedRepositoryFactory {
  private activeRepository: IUnifiedEntityRepository | null = null;

  async createRepository(type: 'ENTERPRISE' = 'ENTERPRISE'): Promise<IUnifiedEntityRepository> {
    console.log('🏭 UnifiedRepositoryFactory: Creating repository of type:', type);
    
    const enterpriseStore = await EnterpriseDataStoreFactory.createEnterpriseStore('development');
    this.activeRepository = new EnterpriseRepositoryAdapter(enterpriseStore);
    return this.activeRepository;
  }

  async getActiveRepository(): Promise<IUnifiedEntityRepository> {
    if (!this.activeRepository) {
      this.activeRepository = await this.createRepository('ENTERPRISE');
    }
    return this.activeRepository;
  }
}
