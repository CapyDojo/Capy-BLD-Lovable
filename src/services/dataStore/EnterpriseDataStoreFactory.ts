
import { EnterpriseDataStore } from './EnterpriseDataStore';
import { IEnterpriseDataStore, EnterpriseDataStoreConfig } from '@/types/enterprise';

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
    return new EnterpriseDataStore(config);
  }
}
