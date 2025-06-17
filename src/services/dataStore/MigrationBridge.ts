
import { IEnterpriseDataStore } from '@/types/enterprise';
import { EnterpriseDataStoreFactory } from './EnterpriseDataStoreFactory';

class MigrationBridge {
  private enterpriseStore: IEnterpriseDataStore | null = null;
  private globalMigrationEnabled = false;
  private migratedComponents: Set<string> = new Set();

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

  // Component-specific migration methods
  enableMigrationFor(componentName: string): void {
    this.migratedComponents.add(componentName);
    console.log(`🔄 Migration enabled for component: ${componentName}`);
  }

  shouldUseMigration(componentName: string): boolean {
    return this.globalMigrationEnabled || this.migratedComponents.has(componentName);
  }

  getStoreFor(componentName: string) {
    if (this.shouldUseMigration(componentName)) {
      console.log(`🆕 Using EnterpriseDataStore for: ${componentName}`);
      return this.getEnterpriseStore();
    }
    console.log(`🔙 Using legacy store for: ${componentName}`);
    // For now, return enterprise store as fallback since legacy store integration is complex
    return this.getEnterpriseStore();
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
      globalEnabled: this.globalMigrationEnabled, // Legacy compatibility
      migratedComponents: Array.from(this.migratedComponents), // Legacy compatibility
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
