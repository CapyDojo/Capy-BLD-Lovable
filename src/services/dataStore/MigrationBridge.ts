
import { IEnterpriseDataStore } from '@/types/enterprise';
import { EnterpriseDataStoreFactory } from './EnterpriseDataStoreFactory';

class MigrationBridge {
  private enterpriseStore: IEnterpriseDataStore | null = null;
  private globalMigrationEnabled = false;

  async initializeEnterpriseStore(): Promise<IEnterpriseDataStore> {
    if (!this.enterpriseStore) {
      console.log('🔄 MigrationBridge: Initializing enterprise store...');
      this.enterpriseStore = await EnterpriseDataStoreFactory.createEnterpriseStore('development');
      console.log('✅ MigrationBridge: Enterprise store ready');
    }
    return this.enterpriseStore;
  }

  getEnterpriseStore(): IEnterpriseDataStore {
    if (!this.enterpriseStore) {
      throw new Error('Enterprise store not initialized. Call initializeEnterpriseStore() first.');
    }
    return this.enterpriseStore;
  }

  enableGlobalMigration(): void {
    this.globalMigrationEnabled = true;
    console.log('🚀 MigrationBridge: Global migration enabled - all components will use enterprise store');
  }

  disableGlobalMigration(): void {
    this.globalMigrationEnabled = false;
    console.log('🔄 MigrationBridge: Global migration disabled - components will use legacy stores');
  }

  isGlobalMigrationEnabled(): boolean {
    return this.globalMigrationEnabled;
  }

  getMigrationStatus() {
    return {
      globalMigrationEnabled: this.globalMigrationEnabled,
      enterpriseStoreInitialized: this.enterpriseStore !== null,
      timestamp: new Date()
    };
  }
}

// Create singleton instance
export const migrationBridge = new MigrationBridge();

// Auto-initialize the enterprise store
migrationBridge.initializeEnterpriseStore().then(() => {
  console.log('🎉 MigrationBridge: Auto-initialization complete');
}).catch(error => {
  console.error('❌ MigrationBridge: Auto-initialization failed:', error);
});
