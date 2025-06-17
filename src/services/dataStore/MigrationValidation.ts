
import { migrationBridge } from './MigrationBridge';
import { dataStore } from '../dataStore';
import { runBasicValidationTests } from './EnterpriseDataStore.validation';

export interface ValidationTest {
  name: string;
  description: string;
  test: () => Promise<boolean>;
  result?: boolean;
  error?: string;
}

export class MigrationValidationSuite {
  private tests: ValidationTest[] = [];

  constructor() {
    this.initializeTests();
  }

  private initializeTests() {
    this.tests = [
      {
        name: 'Migration Bridge Initialization',
        description: 'Verify migration bridge is properly initialized',
        test: async () => {
          const status = migrationBridge.getMigrationStatus();
          return typeof status === 'object' && 
                 typeof status.globalEnabled === 'boolean' &&
                 Array.isArray(status.migratedComponents);
        }
      },
      {
        name: 'Enterprise Store Basic Validation',
        description: 'Run basic enterprise store validation tests',
        test: async () => {
          return await runBasicValidationTests();
        }
      },
      {
        name: 'Legacy Data Store Functionality',
        description: 'Verify legacy data store has entities',
        test: async () => {
          const entities = dataStore.getEntities();
          console.log('📊 Legacy entities count:', entities.length);
          return entities.length > 0;
        }
      },
      {
        name: 'Entity Migration Sync',
        description: 'Test syncing entities from legacy to enterprise store',
        test: async () => {
          const legacyEntities = dataStore.getEntities();
          if (legacyEntities.length === 0) {
            console.log('⚠️ No legacy entities to sync');
            return true; // Pass if no entities to sync
          }
          
          const testEntityId = legacyEntities[0].id;
          await migrationBridge.syncEntityFromLegacy(testEntityId);
          
          const enterpriseStore = migrationBridge.getEnterpriseStore();
          const syncedEntity = await enterpriseStore.getEntity(testEntityId);
          
          return syncedEntity !== null && syncedEntity.name === legacyEntities[0].name;
        }
      },
      {
        name: 'Component Migration Toggle',
        description: 'Test enabling migration for specific component',
        test: async () => {
          migrationBridge.enableMigrationFor('TestComponent');
          const status = migrationBridge.getMigrationStatus();
          return status.migratedComponents.includes('TestComponent');
        }
      },
      {
        name: 'Store Selection Logic',
        description: 'Verify correct store is returned based on migration status',
        test: async () => {
          const legacyStore = migrationBridge.getStoreFor('NonMigratedComponent');
          const enterpriseStore = migrationBridge.getStoreFor('TestComponent'); // Enabled in previous test
          
          return legacyStore === migrationBridge.getLegacyStore() &&
                 enterpriseStore === migrationBridge.getEnterpriseStore();
        }
      },
      {
        name: 'Cap Table View Generation',
        description: 'Test enterprise store cap table view generation',
        test: async () => {
          const enterpriseStore = migrationBridge.getEnterpriseStore();
          const entities = dataStore.getEntities();
          
          if (entities.length === 0) {
            console.log('⚠️ No entities available for cap table test');
            return true;
          }
          
          const testEntityId = entities[0].id;
          await migrationBridge.syncEntityFromLegacy(testEntityId);
          
          const capTable = await enterpriseStore.getCapTableView(testEntityId);
          return capTable !== null && capTable.entityId === testEntityId;
        }
      },
      {
        name: 'Data Integrity Check',
        description: 'Verify enterprise store data integrity',
        test: async () => {
          const enterpriseStore = migrationBridge.getEnterpriseStore();
          const integrityResult = await enterpriseStore.validateDataIntegrity();
          return integrityResult.isValid;
        }
      },
      {
        name: 'Event System Test',
        description: 'Test enterprise store event subscription',
        test: async () => {
          return new Promise((resolve) => {
            const enterpriseStore = migrationBridge.getEnterpriseStore();
            let eventReceived = false;
            
            const unsubscribe = enterpriseStore.subscribe((event) => {
              console.log('📡 Test event received:', event.type);
              eventReceived = true;
              unsubscribe();
              resolve(true);
            });
            
            // Create a test entity to trigger an event
            enterpriseStore.createEntity({
              name: 'Test Entity for Event',
              type: 'Corporation',
              jurisdiction: 'Test',
              metadata: {}
            }, 'test-user', 'Event system test');
            
            // Timeout after 2 seconds
            setTimeout(() => {
              if (!eventReceived) {
                unsubscribe();
                resolve(false);
              }
            }, 2000);
          });
        }
      },
      {
        name: 'Migration Status Reporting',
        description: 'Verify migration status reporting works correctly',
        test: async () => {
          const status = migrationBridge.getMigrationStatus();
          console.log('📊 Migration Status:', status);
          
          return typeof status.globalEnabled === 'boolean' &&
                 Array.isArray(status.migratedComponents) &&
                 typeof status.totalMigratedComponents === 'number' &&
                 status.totalMigratedComponents === status.migratedComponents.length;
        }
      }
    ];
  }

  async runAllTests(): Promise<{ passed: number; failed: number; results: ValidationTest[] }> {
    console.log('🧪 Starting Migration Validation Suite...');
    console.log('=' .repeat(60));
    
    let passed = 0;
    let failed = 0;
    
    for (const test of this.tests) {
      console.log(`\n🔬 Running: ${test.name}`);
      console.log(`📝 ${test.description}`);
      
      try {
        const startTime = Date.now();
        test.result = await test.test();
        const duration = Date.now() - startTime;
        
        if (test.result) {
          console.log(`✅ PASSED (${duration}ms)`);
          passed++;
        } else {
          console.log(`❌ FAILED (${duration}ms)`);
          failed++;
        }
      } catch (error) {
        console.log(`💥 ERROR:`, error);
        test.result = false;
        test.error = error instanceof Error ? error.message : String(error);
        failed++;
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log(`🏁 Test Suite Complete:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${((passed / this.tests.length) * 100).toFixed(1)}%`);
    
    return {
      passed,
      failed,
      results: this.tests
    };
  }

  async runSingleTest(testName: string): Promise<ValidationTest | null> {
    const test = this.tests.find(t => t.name === testName);
    if (!test) {
      console.log(`❌ Test "${testName}" not found`);
      return null;
    }
    
    console.log(`🔬 Running single test: ${test.name}`);
    try {
      test.result = await test.test();
      console.log(test.result ? '✅ PASSED' : '❌ FAILED');
    } catch (error) {
      test.result = false;
      test.error = error instanceof Error ? error.message : String(error);
      console.log(`💥 ERROR:`, error);
    }
    
    return test;
  }

  getTestNames(): string[] {
    return this.tests.map(t => t.name);
  }

  getResults(): ValidationTest[] {
    return this.tests;
  }
}

// Global instance for easy access in console
export const migrationValidator = new MigrationValidationSuite();

console.log('🧪 Migration Validation Suite loaded!');
