import { EnterpriseDataStore } from './enterprise/EnterpriseDataStore';
import { IEnterpriseDataStore, EnterpriseDataStoreConfig } from '@/types/enterprise';
import { 
  unifiedMockEntities, 
  unifiedMockShareClasses, 
  unifiedMockOwnerships 
} from '@/data/unifiedMockData';

export class EnterpriseDataStoreFactory {
  static async createEnterpriseStore(environment: 'development' | 'production' | 'test'): Promise<IEnterpriseDataStore> {
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
      
      // Load entities first
      for (const entity of unifiedMockEntities) {
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
          console.log(`📝 Entity ${entity.name} creation issue:`, error);
        }
      }
      
      // Load share classes second
      for (const shareClass of unifiedMockShareClasses) {
        try {
          await store.createShareClass({
            entityId: shareClass.entityId,
            name: shareClass.name,
            type: shareClass.type,
            totalAuthorizedShares: shareClass.totalAuthorizedShares,
            votingRights: shareClass.votingRights,
            liquidationPreference: shareClass.liquidationPreference
          }, 'unified-mock-data');
        } catch (error) {
          console.log(`📝 Share class ${shareClass.name} creation issue:`, error);
        }
      }
      
      // Load ownerships last (requires entities and share classes to exist)
      for (const ownership of unifiedMockOwnerships) {
        try {
          await store.createOwnership({
            ownerEntityId: ownership.ownerEntityId,
            ownedEntityId: ownership.ownedEntityId,
            shares: ownership.shares,
            shareClassId: ownership.shareClassId,
            effectiveDate: ownership.effectiveDate,
            changeReason: ownership.changeReason,
            createdBy: ownership.createdBy || 'unified-mock-data',
            updatedBy: ownership.updatedBy || 'unified-mock-data'
          }, ownership.createdBy || 'unified-mock-data');
        } catch (error) {
          console.log(`📝 Ownership ${ownership.id} creation issue:`, error);
        }
      }
      
      console.log('✅ Enterprise store initialized with unified mock data');
    }
    
    return store;
  }
}
