
// Simple validation tests for EnterpriseDataStore without Jest dependencies
// This can be run manually to verify the system works correctly

import { EnterpriseDataStore } from './EnterpriseDataStore';
import { EnterpriseDataStoreFactory } from './EnterpriseDataStoreFactory';

export async function runBasicValidationTests(): Promise<boolean> {
  console.log('🧪 Running EnterpriseDataStore validation tests...');
  
  try {
    const dataStore = EnterpriseDataStoreFactory.createEnterpriseStore('test');
    
    // Test 1: Create entity
    console.log('Test 1: Creating entity...');
    const entity = await dataStore.createEntity({
      name: 'Test Corp',
      type: 'Corporation',
      jurisdiction: 'Delaware',
      metadata: {}
    }, 'test-user', 'Initial creation');
    
    if (!entity.id || entity.name !== 'Test Corp') {
      throw new Error('Entity creation failed');
    }
    console.log('✅ Entity created successfully:', entity.id);
    
    // Test 2: Create share class
    console.log('Test 2: Creating share class...');
    const shareClass = await dataStore.createShareClass({
      entityId: entity.id,
      name: 'Common Stock',
      type: 'Common Stock',
      totalAuthorizedShares: 1000,
      votingRights: true
    }, 'test-user');
    
    if (!shareClass.id || shareClass.name !== 'Common Stock') {
      throw new Error('Share class creation failed');
    }
    console.log('✅ Share class created successfully:', shareClass.id);
    
    // Test 3: Data integrity check
    console.log('Test 3: Checking data integrity...');
    const integrityResult = await dataStore.validateDataIntegrity();
    
    if (!integrityResult.isValid) {
      throw new Error('Data integrity check failed: ' + integrityResult.errors.map(e => e.message).join(', '));
    }
    console.log('✅ Data integrity check passed');
    
    console.log('🎉 All validation tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Validation test failed:', error);
    return false;
  }
}

// Export for use in other parts of the app
export { runBasicValidationTests as validateEnterpriseDataStore };
