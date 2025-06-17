
import { IUnifiedRepositoryFactory, IUnifiedEntityRepository, RepositoryType } from './IUnifiedRepository';
import { EnterpriseRepositoryAdapter } from './EnterpriseRepositoryAdapter';
import { LegacyRepositoryAdapter } from './LegacyRepositoryAdapter';
import { EnterpriseDataStoreFactory } from '@/services/dataStore/EnterpriseDataStoreFactory';
import { dataStore } from '@/services/dataStore';

export class UnifiedRepositoryFactory implements IUnifiedRepositoryFactory {
  private activeRepository: IUnifiedEntityRepository | null = null;
  private activeType: RepositoryType = 'LEGACY';

  async createRepository(type: RepositoryType): Promise<IUnifiedEntityRepository> {
    console.log(`🏭 UnifiedRepositoryFactory: Creating ${type} repository`);

    let repository: IUnifiedEntityRepository;

    switch (type) {
      case 'ENTERPRISE':
        const enterpriseStore = await EnterpriseDataStoreFactory.createEnterpriseStore('development');
        repository = new EnterpriseRepositoryAdapter(enterpriseStore);
        break;
      
      case 'LEGACY':
        repository = new LegacyRepositoryAdapter(dataStore);
        break;
      
      default:
        throw new Error(`Unknown repository type: ${type}`);
    }

    console.log(`✅ UnifiedRepositoryFactory: ${type} repository created`);
    return repository;
  }

  getActiveRepositoryType(): RepositoryType {
    return this.activeType;
  }

  async switchToRepository(type: RepositoryType): Promise<void> {
    console.log(`🔄 UnifiedRepositoryFactory: Switching to ${type} repository`);

    // Clean up existing repository if needed
    if (this.activeRepository && 'destroy' in this.activeRepository) {
      (this.activeRepository as any).destroy();
    }

    // Create new repository
    this.activeRepository = await this.createRepository(type);
    this.activeType = type;

    console.log(`✅ UnifiedRepositoryFactory: Switched to ${type} repository`);
  }

  async getActiveRepository(): Promise<IUnifiedEntityRepository> {
    if (!this.activeRepository) {
      console.log('🔄 UnifiedRepositoryFactory: No active repository, creating default legacy repository');
      this.activeRepository = await this.createRepository(this.activeType);
    }
    return this.activeRepository;
  }

  // Utility method to migrate data between repositories
  async migrateData(fromType: RepositoryType, toType: RepositoryType): Promise<void> {
    console.log(`🔄 UnifiedRepositoryFactory: Starting data migration from ${fromType} to ${toType}`);

    const sourceRepo = await this.createRepository(fromType);
    const targetRepo = await this.createRepository(toType);

    try {
      // Migrate entities first
      const entities = await sourceRepo.getAllEntities();
      console.log(`📦 Migrating ${entities.length} entities...`);
      
      for (const entity of entities) {
        try {
          await targetRepo.createEntity({
            name: entity.name,
            type: entity.type,
            jurisdiction: entity.jurisdiction,
            registrationNumber: entity.registrationNumber,
            incorporationDate: entity.incorporationDate,
            address: entity.address,
            position: entity.position,
            metadata: entity.metadata
          }, 'migration-system', `Migrated from ${fromType}`);
        } catch (error) {
          console.log(`⚠️ Skipping entity ${entity.name} (likely already exists):`, error);
        }
      }

      console.log('✅ UnifiedRepositoryFactory: Data migration completed');
    } catch (error) {
      console.error('❌ UnifiedRepositoryFactory: Data migration failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const unifiedRepositoryFactory = new UnifiedRepositoryFactory();
