
import { EnterpriseDataStore } from './EnterpriseDataStore';
import { EnterpriseDataStoreConfig } from '@/types/enterprise';

export class EnterpriseDataStoreFactory {
  static createProductionConfig(): EnterpriseDataStoreConfig {
    return {
      enableAuditLogging: true,
      enableTransactions: true,
      enableValidation: true,
      autoBackup: true,
      backupInterval: 60, // 1 hour
      maxAuditRetention: 2555, // 7 years for legal compliance
      enableCircularOwnershipDetection: true,
      strictValidation: true,
      enableRealTimeValidation: true
    };
  }

  static createDevelopmentConfig(): EnterpriseDataStoreConfig {
    return {
      enableAuditLogging: true,
      enableTransactions: false,
      enableValidation: true,
      autoBackup: false,
      backupInterval: 0,
      maxAuditRetention: 30, // 30 days for development
      enableCircularOwnershipDetection: true,
      strictValidation: false, // Allow warnings to pass
      enableRealTimeValidation: true
    };
  }

  static createTestConfig(): EnterpriseDataStoreConfig {
    return {
      enableAuditLogging: false,
      enableTransactions: false,
      enableValidation: false,
      autoBackup: false,
      backupInterval: 0,
      maxAuditRetention: 1,
      enableCircularOwnershipDetection: false,
      strictValidation: false,
      enableRealTimeValidation: false
    };
  }

  static createEnterpriseStore(environment: 'production' | 'development' | 'test' = 'development'): EnterpriseDataStore {
    let config: EnterpriseDataStoreConfig;

    switch (environment) {
      case 'production':
        config = this.createProductionConfig();
        break;
      case 'test':
        config = this.createTestConfig();
        break;
      default:
        config = this.createDevelopmentConfig();
    }

    console.log('🏭 EnterpriseDataStoreFactory: Creating store for', environment, 'environment');
    return new EnterpriseDataStore(config);
  }
}
