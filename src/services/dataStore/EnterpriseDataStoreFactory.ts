
import { EnterpriseDataStore } from './EnterpriseDataStore';
import { IEnterpriseDataStore, EnterpriseDataStoreConfig } from '@/types/enterprise';
import { 
  unifiedMockEntities, 
  unifiedMockShareClasses, 
  unifiedMockOwnerships,
  unifiedMockAuditEntries 
} from '@/data/unifiedMockData';

export class EnterpriseDataStoreFactory {
  static createEnterpriseStore(environment: 'development' | 'production' | 'test'): IEnterpriseDataStore {
    const config: EnterpriseDataStoreConfig = {
      enableAuditLogging: true,
      enableTransactions: true,
      enableValidation: true,
      autoBackup: environment === 'production',
      backupInterval: environment === 'production' ? 60 : 1440, // 1 hour prod, 24 hours dev
      maxAuditRetention: 365, // 1 year
      enableCircularOwnershipDetection: true,
      strictValidation: environment === 'production',
      enableRealTimeValidation: true
    };

    console.log(`🏭 Creating EnterpriseDataStore for ${environment} environment`);
    
    const store = new EnterpriseDataStore(config);
    
    // Initialize with unified mock data for development
    if (environment === 'development') {
      console.log('🌱 Initializing enterprise store with unified mock data...');
      
      // Load entities
      unifiedMockEntities.forEach(async (entity) => {
        try {
          await store.createEntity({
            name: entity.name,
            type: entity.type,
            jurisdiction: entity.jurisdiction,
            registrationNumber: entity.registrationNumber,
            incorporationDate: entity.incorporationDate,
            address: entity.address,
            position: entity.position,
            metadata: entity.metadata || {}
          }, 'unified-mock-data', 'Initial mock data load');
        } catch (error) {
          // Entity might already exist, that's okay
          console.log(`📝 Entity ${entity.id} already exists or failed to create:`, error);
        }
      });
      
      console.log('✅ Enterprise store initialized with unified mock data');
    }
    
    return store;
  }
}
