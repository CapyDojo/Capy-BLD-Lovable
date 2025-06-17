
import { IUnifiedEntityRepository, IUnifiedRepositoryFactory, RepositoryType } from './IUnifiedRepository';
import { EnterpriseRepositoryAdapter } from './EnterpriseRepositoryAdapter';
import { LegacyRepositoryAdapter } from './LegacyRepositoryAdapter';
import { migrationBridge } from '@/services/dataStore/MigrationBridge';
import { dataStore } from '@/services/dataStore';

export class UnifiedRepositoryFactory implements IUnifiedRepositoryFactory {
  private activeRepositoryType: RepositoryType = 'ENTERPRISE';
  private repositories: Map<RepositoryType, IUnifiedEntityRepository> = new Map();

  async createRepository(type: RepositoryType): Promise<IUnifiedEntityRepository> {
    console.log(`🏭 UnifiedRepositoryFactory: Creating ${type} repository`);
    
    // Return cached repository if it exists
    if (this.repositories.has(type)) {
      console.log(`📋 UnifiedRepositoryFactory: Returning cached ${type} repository`);
      return this.repositories.get(type)!;
    }

    let repository: IUnifiedEntityRepository;

    switch (type) {
      case 'ENTERPRISE':
        const enterpriseStore = await migrationBridge.initializeEnterpriseStore();
        repository = new EnterpriseRepositoryAdapter(enterpriseStore);
        break;
      
      case 'LEGACY':
        repository = new LegacyRepositoryAdapter(dataStore);
        break;
      
      default:
        throw new Error(`Unknown repository type: ${type}`);
    }

    // Cache the repository
    this.repositories.set(type, repository);
    console.log(`✅ UnifiedRepositoryFactory: Created and cached ${type} repository`);
    
    return repository;
  }

  getActiveRepositoryType(): RepositoryType {
    return this.activeRepositoryType;
  }

  async switchToRepository(type: RepositoryType): Promise<void> {
    console.log(`🔄 UnifiedRepositoryFactory: Switching to ${type} repository`);
    this.activeRepositoryType = type;
    
    // Ensure the repository is created
    await this.createRepository(type);
    console.log(`✅ UnifiedRepositoryFactory: Switched to ${type} repository`);
  }

  async getActiveRepository(): Promise<IUnifiedEntityRepository> {
    return this.createRepository(this.activeRepositoryType);
  }
}

// Create and export singleton instance
export const unifiedRepositoryFactory = new UnifiedRepositoryFactory();

// Initialize with enterprise store by default
unifiedRepositoryFactory.switchToRepository('ENTERPRISE').then(() => {
  console.log('🎉 UnifiedRepositoryFactory: Auto-initialized with enterprise store');
}).catch(error => {
  console.error('❌ UnifiedRepositoryFactory: Auto-initialization failed:', error);
});
