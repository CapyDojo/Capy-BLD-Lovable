
import { dataStore as legacyDataStore } from '../dataStore';
import { EnterpriseDataStoreFactory } from './EnterpriseDataStoreFactory';
import { IEnterpriseDataStore } from '@/types/enterprise';
import { Entity } from '@/types/entity';

/**
 * Migration Bridge - Facilitates gradual transition from legacy DataStore to EnterpriseDataStore
 * This allows components to opt-in to the new system one by one
 */
class MigrationBridge {
  private enterpriseStore: IEnterpriseDataStore;
  private migrationEnabled: boolean = false;
  private migratedComponents: Set<string> = new Set();

  constructor() {
    this.enterpriseStore = EnterpriseDataStoreFactory.createEnterpriseStore('development');
    console.log('🌉 MigrationBridge initialized');
    
    // Pre-sync essential data from legacy to enterprise store
    this.syncLegacyData();
  }

  // Sync existing legacy data to enterprise store
  private async syncLegacyData(): Promise<void> {
    try {
      console.log('🔄 Pre-syncing legacy data to enterprise store...');
      
      const legacyEntities = legacyDataStore.getEntities();
      console.log(`📦 Found ${legacyEntities.length} legacy entities to sync`);
      
      for (const entity of legacyEntities) {
        await this.syncEntityFromLegacy(entity.id);
      }
      
      console.log('✅ Legacy data pre-sync completed');
    } catch (error) {
      console.error('❌ Error during legacy data sync:', error);
    }
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
        // For migration phase, return from legacy store for sync compatibility
        const legacyEntity = legacyDataStore.getEntityById(id);
        if (legacyEntity) {
          // Ensure entity exists in enterprise store (async operation, don't wait)
          this.syncEntityFromLegacy(id).catch(console.warn);
        }
        return legacyEntity;
      },

      getEntity: async (id: string) => {
        // Try enterprise store first
        try {
          return await this.enterpriseStore.getEntity(id);
        } catch (error) {
          // Fallback to legacy store and sync
          const legacyEntity = legacyDataStore.getEntityById(id);
          if (legacyEntity) {
            await this.syncEntityFromLegacy(id);
          }
          return legacyEntity;
        }
      },
      
      // Overloaded updateEntity to handle both signatures
      updateEntity: ((id: string, updates: any, updatedBy?: string, reason?: string) => {
        // Update in legacy store first (for immediate UI updates)
        legacyDataStore.updateEntity(id, updates);
        
        // Then update in enterprise store if migration is enabled
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
        // Subscribe to both stores during migration
        const legacyUnsub = legacyDataStore.subscribe(callback);
        const enterpriseUnsub = this.enterpriseStore.subscribe(() => callback());
        
        return () => {
          legacyUnsub();
          enterpriseUnsub();
        };
      }
    };
    
    return adapter;
  }

  // Migration utilities - sync data from legacy to new store
  async syncEntityFromLegacy(entityId: string): Promise<void> {
    const legacyEntity = legacyDataStore.getEntityById(entityId);
    if (!legacyEntity) {
      console.warn(`⚠️ Entity ${entityId} not found in legacy store`);
      return;
    }

    // Check if entity already exists in new store
    const existingEntity = await this.enterpriseStore.getEntity(entityId);
    if (existingEntity) {
      console.log(`✅ Entity ${entityId} already exists in enterprise store`);
      return;
    }

    try {
      // Create entity in new store with the same ID
      await this.enterpriseStore.createEntity({
        name: legacyEntity.name,
        type: legacyEntity.type,
        jurisdiction: legacyEntity.jurisdiction,
        registrationNumber: legacyEntity.registrationNumber,
        incorporationDate: legacyEntity.incorporationDate,
        address: legacyEntity.address,
        position: legacyEntity.position,
        metadata: legacyEntity.metadata || {}
      }, 'migration-bridge', 'Migrated from legacy system');

      console.log(`✅ Synced entity ${entityId} to enterprise store`);
    } catch (error) {
      console.error(`❌ Failed to sync entity ${entityId}:`, error);
    }
  }

  // Enable global migration (for testing)
  enableGlobalMigration(): void {
    this.migrationEnabled = true;
    console.log('🚀 Global migration enabled');
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
      totalMigratedComponents: this.migratedComponents.size
    };
  }
}

// Export singleton instance
export const migrationBridge = new MigrationBridge();
