
import { dataStore as legacyDataStore } from '../dataStore';
import { EnterpriseDataStoreFactory } from './EnterpriseDataStoreFactory';
import { IEnterpriseDataStore } from '@/types/enterprise';

/**
 * Simplified Migration Bridge - For transitioning components to enterprise architecture
 * No legacy data migration needed since we're using fresh unified mock data
 */
class MigrationBridge {
  private enterpriseStore: IEnterpriseDataStore;
  private migrationEnabled: boolean = false;
  private migratedComponents: Set<string> = new Set();

  constructor() {
    this.enterpriseStore = EnterpriseDataStoreFactory.createEnterpriseStore('development');
    console.log('🌉 MigrationBridge initialized with unified architecture');
  }

  // Enable migration for specific components
  enableMigrationFor(componentName: string): void {
    this.migratedComponents.add(componentName);
    console.log(`🔄 Migration enabled for component: ${componentName}`);
  }

  // Check if a component should use the new store
  shouldUseMigration(componentName: string): boolean {
    return this.migrationEnabled || this.migratedComponents.has(componentName);
  }

  // Get the appropriate store for a component
  getStoreFor(componentName: string) {
    if (this.shouldUseMigration(componentName)) {
      console.log(`🆕 Using EnterpriseDataStore for: ${componentName}`);
      return this.createAdaptedEnterpriseStore();
    }
    console.log(`🔙 Using legacy DataStore for: ${componentName}`);
    return legacyDataStore;
  }

  // Create an adapter that provides legacy-compatible methods for enterprise store
  private createAdaptedEnterpriseStore() {
    const adapter = {
      // Enterprise store methods (async)
      ...this.enterpriseStore,
      
      // Legacy-compatible synchronous methods (adapted)
      getEntityById: (id: string) => {
        // For migrated components, we should ideally use async methods
        // But for compatibility during transition, return null and log warning
        console.warn(`⚠️ Synchronous getEntityById called for ${id} - consider using async getEntity instead`);
        return null; // Force components to use proper async methods
      },

      // Overloaded updateEntity to handle both signatures  
      updateEntity: ((id: string, updates: any, updatedBy?: string, reason?: string) => {
        // Update only in enterprise store (no legacy store for unified architecture)
        const enterprisePromise = this.enterpriseStore.updateEntity(
          id, 
          updates, 
          updatedBy || 'user', 
          reason || 'Entity updated'
        );
        
        enterprisePromise.catch(error => {
          console.warn('⚠️ Enterprise store update failed:', error);
        });

        // Return promise for compatibility with async callers
        return enterprisePromise;
      }) as any,
      
      subscribe: (callback: () => void) => {
        // Subscribe only to enterprise store
        return this.enterpriseStore.subscribe(() => callback());
      }
    };
    
    return adapter;
  }

  // Enable global migration (switch all components to enterprise store)
  enableGlobalMigration(): void {
    this.migrationEnabled = true;
    console.log('🚀 Global migration enabled - all components using enterprise store');
  }

  // Disable global migration
  disableGlobalMigration(): void {
    this.migrationEnabled = false;
    console.log('🛑 Global migration disabled');
  }

  // Get enterprise store directly (for components that have fully migrated)
  getEnterpriseStore(): IEnterpriseDataStore {
    return this.enterpriseStore;
  }

  // Get legacy store directly (for fallback)
  getLegacyStore() {
    return legacyDataStore;
  }

  // Migration status
  getMigrationStatus() {
    return {
      globalEnabled: this.migrationEnabled,
      migratedComponents: Array.from(this.migratedComponents),
      totalMigratedComponents: this.migratedComponents.size,
      usingUnifiedArchitecture: true
    };
  }
}

// Export singleton instance
export const migrationBridge = new MigrationBridge();
