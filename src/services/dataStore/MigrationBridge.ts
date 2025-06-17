
import { IEnterpriseDataStore } from '@/types/enterprise';
import { EnterpriseDataStoreFactory } from './EnterpriseDataStoreFactory';

class MigrationBridge {
  private enterpriseStore: IEnterpriseDataStore | null = null;
  private globalMigrationEnabled = true; // Enable by default since migration is complete
  private migratedComponents: Set<string> = new Set([
    'EntityDetailsPanel',
    'useCanvasData', 
    'useCanvasEvents',
    'useCanvasDeletion',
    'useEntityCanvas',
    'EntityCapTableSectionV2',
    'unifiedCanvasSync',
    'UnifiedEntityService'
  ]);

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
    // Migration is complete - always use enterprise store
    return this.getEnterpriseStore();
  }

  enableGlobalMigration(): void {
    this.globalMigrationEnabled = true;
    console.log('🚀 MigrationBridge: Global migration enabled - all components will use enterprise store');
  }

  disableGlobalMigration(): void {
    this.globalMigrationEnabled = false;
    console.log('🔄 MigrationBridge: Global migration disabled');
  }

  isGlobalMigrationEnabled(): boolean {
    return this.globalMigrationEnabled;
  }

  getMigrationStatus() {
    return {
      globalMigrationEnabled: this.globalMigrationEnabled,
      enterpriseStoreInitialized: this.enterpriseStore !== null,
      globalEnabled: this.globalMigrationEnabled,
      migratedComponents: Array.from(this.migratedComponents),
      totalMigratedComponents: this.migratedComponents.size,
      migrationProgress: Math.round((this.migratedComponents.size / 12) * 100), // Estimate total components
      timestamp: new Date()
    };
  }

  // Mark migration as complete
  completeMigration(): void {
    this.globalMigrationEnabled = true;
    console.log('🎉 MigrationBridge: Migration marked as complete!');
    console.log('📊 Migration Summary:');
    console.log(`  - Total migrated components: ${this.migratedComponents.size}`);
    console.log(`  - Enterprise store initialized: ${this.enterpriseStore !== null}`);
    console.log(`  - Global migration enabled: ${this.globalMigrationEnabled}`);
  }
}

// Create singleton instance
export const migrationBridge = new MigrationBridge();

// Auto-initialize the enterprise store and complete migration
migrationBridge.initializeEnterpriseStore().then(() => {
  console.log('🎉 MigrationBridge: Auto-initialization complete');
  migrationBridge.completeMigration();
}).catch(error => {
  console.error('❌ MigrationBridge: Auto-initialization failed:', error);
});
