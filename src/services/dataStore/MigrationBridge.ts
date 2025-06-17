
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
  }

  // Enable migration for specific components
  enableMigrationFor(componentName: string): void {
    this.migratedComponents.add(componentName);
    console.log(`🔄 Migration enabled for component: ${componentName}`);
  }

  // Check if a component should use the new store
  shouldUseMigration(componentName: string): boolean {
    return this.migrationEnabled && this.migratedComponents.has(componentName);
  }

  // Get the appropriate store for a component
  getStoreFor(componentName: string) {
    if (this.shouldUseMigration(componentName)) {
      console.log(`🆕 Using EnterpriseDataStore for: ${componentName}`);
      return this.enterpriseStore;
    }
    console.log(`🔙 Using legacy DataStore for: ${componentName}`);
    return legacyDataStore;
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

    // Create entity in new store
    const newEntity = await this.enterpriseStore.createEntity({
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
