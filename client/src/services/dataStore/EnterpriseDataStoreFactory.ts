
import { EnterpriseDataStore } from './enterprise/EnterpriseDataStore';
import { IEnterpriseDataStore, EnterpriseDataStoreConfig } from '@/types/enterprise';
import { 
  mockEntities, 
  mockShareClasses, 
  mockOwnerships 
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
      
      // Track ID mappings from mock data to actual created entities
      const entityIdMap = new Map<string, string>();
      const shareClassIdMap = new Map<string, string>();
      
      // Load entities first
      for (const entity of mockEntities) {
        try {
          const createdEntity = await store.createEntity({
            name: entity.name,
            type: entity.type,
            jurisdiction: entity.jurisdiction,
            registrationNumber: entity.registrationNumber,
            incorporationDate: entity.incorporationDate,
            address: entity.address,
            position: entity.position,
            metadata: entity.metadata || {}
          }, 'unified-mock-data', 'Initial mock data load');
          
          // Map the mock ID to the actual created ID
          entityIdMap.set(entity.id, createdEntity.id);
        } catch (error) {
          console.log(`📝 Entity ${entity.name} creation issue:`, error);
        }
      }
      
      // Load share classes second, using actual entity IDs
      for (const shareClass of mockShareClasses) {
        try {
          const actualEntityId = entityIdMap.get(shareClass.entityId);
          if (!actualEntityId) {
            console.log(`📝 Cannot create share class ${shareClass.name}: entity ${shareClass.entityId} not found`);
            continue;
          }
          
          const createdShareClass = await store.createShareClass({
            entityId: actualEntityId,
            name: shareClass.name,
            type: shareClass.type,
            totalAuthorizedShares: shareClass.totalAuthorizedShares,
            votingRights: shareClass.votingRights,
            liquidationPreference: shareClass.liquidationPreference
          }, 'unified-mock-data');
          
          // Map the mock ID to the actual created ID
          shareClassIdMap.set(shareClass.id, createdShareClass.id);
        } catch (error) {
          console.log(`📝 Share class ${shareClass.name} creation issue:`, error);
        }
      }
      
      // Load ownerships last, using actual entity and share class IDs
      for (const ownership of mockOwnerships) {
        try {
          const actualOwnerEntityId = entityIdMap.get(ownership.ownerEntityId);
          const actualOwnedEntityId = entityIdMap.get(ownership.ownedEntityId);
          const actualShareClassId = shareClassIdMap.get(ownership.shareClassId);
          
          if (!actualOwnerEntityId || !actualOwnedEntityId || !actualShareClassId) {
            console.log(`📝 Cannot create ownership ${ownership.id}: missing dependencies`);
            continue;
          }
          
          await store.createOwnership({
            ownerEntityId: actualOwnerEntityId,
            ownedEntityId: actualOwnedEntityId,
            shares: ownership.shares,
            shareClassId: actualShareClassId,
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
