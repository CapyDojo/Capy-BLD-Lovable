
import { migrationBridge } from './MigrationBridge';

// Development utilities for testing the unified architecture

// Enable enterprise store for all components (for testing)
export const enableUnifiedArchitecture = async () => {
  await migrationBridge.initializeEnterpriseStore();
  migrationBridge.enableGlobalMigration();
  console.log('🚀 Unified architecture enabled globally');
  console.log('📊 All components now using enterprise store with unified ownership model');
};

// Get migration status
export const getMigrationStatus = () => {
  const status = migrationBridge.getMigrationStatus();
  console.log('📈 Migration Status:', status);
  return status;
};

// Quick access to enterprise store
export const getEnterpriseStore = async () => {
  return await migrationBridge.initializeEnterpriseStore();
};

// Test the unified ownership model
export const testUnifiedOwnership = async () => {
  try {
    const store = await getEnterpriseStore();
    
    // Test getting all entities
    const entities = await store.getAllEntities();
    console.log('📦 Entities in enterprise store:', entities.length);
    
    // Test getting a cap table
    if (entities.length > 0) {
      const capTable = await store.getCapTableView(entities[0].id);
      console.log('📊 Sample cap table:', capTable);
    }
    
    // Test data integrity
    const integrity = await store.validateDataIntegrity();
    console.log('🔍 Data integrity check:', integrity.isValid ? '✅ PASSED' : '❌ FAILED');
    
    console.log('✅ Enterprise store is working correctly');
    
    return { 
      entities: entities.length, 
      status: 'success',
      integrity: integrity.isValid
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { error };
  }
};

// Add to window for easy browser console access
if (typeof window !== 'undefined') {
  (window as any).devUtils = {
    enableUnifiedArchitecture,
    getMigrationStatus,
    testUnifiedOwnership,
    getEnterpriseStore,
  };
  console.log('🛠️ Dev utils available at window.devUtils');
}
