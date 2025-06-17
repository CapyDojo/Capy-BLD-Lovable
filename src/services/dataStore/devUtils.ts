
import { migrationBridge } from './MigrationBridge';

// Development utilities for testing the unified architecture

// Enable enterprise store for all components (for testing)
export const enableUnifiedArchitecture = () => {
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
export const getEnterpriseStore = () => {
  return migrationBridge.getEnterpriseStore();
};

// Test the unified ownership model
export const testUnifiedOwnership = async () => {
  const store = getEnterpriseStore();
  
  try {
    // Test getting all entities
    const entities = await store.getAllEntities();
    console.log('📦 Entities in enterprise store:', entities.length);
    
    // Test validation
    const validation = await store.validateBusinessRules();
    console.log('✅ Business rules validation:', validation);
    
    return { entities: entities.length, validation };
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
