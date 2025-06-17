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
        name: 'Enterprise Store Initialization',
        description: 'Verify enterprise store is properly initialized with audit logging and validation',
        test: async () => {
          const enterpriseStore = migrationBridge.getEnterpriseStore();
          
          // Test that enterprise store has all required enterprise features
          const hasAuditCapability = typeof enterpriseStore.getAuditTrail === 'function';
          const hasValidationCapability = typeof enterpriseStore.validateDataIntegrity === 'function';
          const hasTransactionCapability = typeof enterpriseStore.beginTransaction === 'function';
          const hasEventSystem = typeof enterpriseStore.subscribe === 'function';
          
          console.log('🏢 Enterprise capabilities check:');
          console.log('  Audit Trail:', hasAuditCapability);
          console.log('  Data Validation:', hasValidationCapability);
          console.log('  Transactions:', hasTransactionCapability);
          console.log('  Event System:', hasEventSystem);
          
          return hasAuditCapability && hasValidationCapability && hasTransactionCapability && hasEventSystem;
        }
      },
      {
        name: 'Data Integrity Validation',
        description: 'Verify enterprise store maintains referential integrity and business rules',
        test: async () => {
          const enterpriseStore = migrationBridge.getEnterpriseStore();
          const integrityResult = await enterpriseStore.validateDataIntegrity();
          
          console.log('🔒 Data integrity check:', integrityResult.isValid);
          if (!integrityResult.isValid) {
            console.log('❌ Integrity errors:', integrityResult.errors);
          }
          
          return integrityResult.isValid;
        }
      },
      {
        name: 'Audit Trail Capability',
        description: 'Test comprehensive audit logging for legal compliance',
        test: async () => {
          const enterpriseStore = migrationBridge.getEnterpriseStore();
          
          // Create a test entity to generate audit trail
          const testEntity = await enterpriseStore.createEntity({
            name: 'Audit Test Entity',
            type: 'Corporation',
            jurisdiction: 'Delaware',
            metadata: { purpose: 'Audit trail testing' }
          }, 'compliance-officer', 'Testing audit capabilities');
          
          // Get audit trail for this entity
          const auditTrail = await enterpriseStore.getAuditTrail(testEntity.id);
          
          console.log('📋 Audit trail entries for test entity:', auditTrail.length);
          
          // Verify audit entry has required fields for legal compliance
          if (auditTrail.length > 0) {
            const entry = auditTrail[0];
            const hasRequiredFields = entry.userId && entry.timestamp && entry.action && 
                                     entry.entityType && entry.entityId && entry.newState;
            
            console.log('✅ Audit entry has required compliance fields:', hasRequiredFields);
            return hasRequiredFields;
          }
          
          return false;
        }
      },
      {
        name: 'Business Rules Enforcement',
        description: 'Verify enterprise-grade business rule validation',
        test: async () => {
          const enterpriseStore = migrationBridge.getEnterpriseStore();
          
          // Create test entities for business rule testing
          const parentEntity = await enterpriseStore.createEntity({
            name: 'Parent Corporation',
            type: 'Corporation',
            jurisdiction: 'Delaware',
            metadata: {}
          }, 'legal-admin', 'Business rules testing');
          
          const childEntity = await enterpriseStore.createEntity({
            name: 'Subsidiary Corp',
            type: 'Corporation', 
            jurisdiction: 'Delaware',
            metadata: {}
          }, 'legal-admin', 'Business rules testing');
          
          // Create share class for ownership
          const shareClass = await enterpriseStore.createShareClass({
            entityId: childEntity.id,
            name: 'Common Stock',
            type: 'Common Stock',
            totalAuthorizedShares: 1000,
            votingRights: true
          }, 'legal-admin');
          
          // Test circular ownership prevention
          try {
            // This should work: Parent owns Child
            await enterpriseStore.createOwnership({
              ownerEntityId: parentEntity.id,
              ownedEntityId: childEntity.id,
              shares: 500,
              shareClassId: shareClass.id,
              effectiveDate: new Date()
            }, 'legal-admin');
            
            // This should fail: Child owns Parent (circular)
            const circularValidation = await enterpriseStore.validateCircularOwnership(childEntity.id, parentEntity.id);
            
            console.log('🔄 Circular ownership prevention working:', !circularValidation.isValid);
            return !circularValidation.isValid; // Should be invalid (prevented)
            
          } catch (error) {
            console.log('❌ Business rules test error:', error);
            return false;
          }
        }
      },
      {
        name: 'Cap Table Accuracy',
        description: 'Verify cap table calculations match professional standards',
        test: async () => {
          const enterpriseStore = migrationBridge.getEnterpriseStore();
          
          // Create test entity and ownership structure
          const entity = await enterpriseStore.createEntity({
            name: 'Test Portfolio Company',
            type: 'Corporation',
            jurisdiction: 'Delaware',
            metadata: {}
          }, 'portfolio-manager', 'Cap table testing');
          
          const shareClass = await enterpriseStore.createShareClass({
            entityId: entity.id,
            name: 'Series A Preferred',
            type: 'Preferred Series A',
            totalAuthorizedShares: 10000,
            votingRights: true
          }, 'portfolio-manager');
          
          // Create multiple ownership records
          const investor1 = await enterpriseStore.createEntity({
            name: 'Venture Capital Fund I',
            type: 'Partnership',
            jurisdiction: 'Delaware',
            metadata: {}
          }, 'portfolio-manager', 'Cap table testing');
          
          const investor2 = await enterpriseStore.createEntity({
            name: 'Strategic Investor Corp',
            type: 'Corporation',
            jurisdiction: 'New York',
            metadata: {}
          }, 'portfolio-manager', 'Cap table testing');
          
          await enterpriseStore.createOwnership({
            ownerEntityId: investor1.id,
            ownedEntityId: entity.id,
            shares: 6000,
            shareClassId: shareClass.id,
            effectiveDate: new Date()
          }, 'portfolio-manager');
          
          await enterpriseStore.createOwnership({
            ownerEntityId: investor2.id,
            ownedEntityId: entity.id,
            shares: 4000,
            shareClassId: shareClass.id,
            effectiveDate: new Date()
          }, 'portfolio-manager');
          
          // Get cap table and verify calculations
          const capTable = await enterpriseStore.getCapTableView(entity.id);
          
          if (!capTable) return false;
          
          const totalShares = capTable.totalShares;
          const expectedTotal = 10000; // 6000 + 4000
          const percentagesSum = capTable.ownershipSummary.reduce((sum, o) => sum + o.percentage, 0);
          
          console.log('📊 Cap table validation:');
          console.log('  Total shares:', totalShares, 'Expected:', expectedTotal);
          console.log('  Percentages sum:', percentagesSum.toFixed(1), '%');
          console.log('  Ownership records:', capTable.ownershipSummary.length);
          
          return totalShares === expectedTotal && 
                 Math.abs(percentagesSum - 100) < 0.1 && // Allow for rounding
                 capTable.ownershipSummary.length === 2;
        }
      },
      {
        name: 'Transaction Management',
        description: 'Test enterprise transaction support for complex operations',
        test: async () => {
          const enterpriseStore = migrationBridge.getEnterpriseStore();
          
          // Begin transaction
          const transaction = await enterpriseStore.beginTransaction('transaction-test-user');
          
          console.log('💼 Transaction started:', transaction.id);
          
          // Verify transaction is tracked
          const activeTransactions = await enterpriseStore.getActiveTransactions();
          const isTracked = activeTransactions.some(tx => tx.id === transaction.id);
          
          // Commit transaction
          await enterpriseStore.commitTransaction(transaction.id);
          
          // Verify transaction is no longer active
          const remainingActive = await enterpriseStore.getActiveTransactions();
          const isCompleted = !remainingActive.some(tx => tx.id === transaction.id);
          
          console.log('✅ Transaction management test - Tracked:', isTracked, 'Completed:', isCompleted);
          
          return isTracked && isCompleted;
        }
      },
      {
        name: 'Real-time Event System',
        description: 'Verify enterprise event system for UI reactivity',
        test: async () => {
          return new Promise((resolve) => {
            const enterpriseStore = migrationBridge.getEnterpriseStore();
            let eventReceived = false;
            
            const unsubscribe = enterpriseStore.subscribe((event) => {
              console.log('📡 Enterprise event received:', event.type, 'for entity:', event.entityId);
              eventReceived = true;
              unsubscribe();
              resolve(true);
            });
            
            // Trigger an event by creating an entity
            enterpriseStore.createEntity({
              name: 'Event Test Entity',
              type: 'Corporation',
              jurisdiction: 'Test',
              metadata: {}
            }, 'event-test-user', 'Testing event system');
            
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
        name: 'Enterprise Feature Coverage',
        description: 'Verify all enterprise features required for legal professionals',
        test: async () => {
          const enterpriseStore = migrationBridge.getEnterpriseStore();
          
          // Check for all required enterprise methods
          const requiredMethods = [
            'createEntity', 'updateEntity', 'deleteEntity',
            'createOwnership', 'updateOwnership', 'deleteOwnership', 
            'createShareClass', 'updateShareClass', 'deleteShareClass',
            'getCapTableView', 'getOwnershipHierarchy',
            'validateDataIntegrity', 'checkBusinessRules',
            'getAuditTrail', 'exportAuditReport',
            'beginTransaction', 'commitTransaction', 'rollbackTransaction',
            'subscribe', 'migrateFromLegacySystem'
          ];
          
          const missingMethods = requiredMethods.filter(method => 
            typeof enterpriseStore[method] !== 'function'
          );
          
          console.log('🏢 Enterprise feature coverage:');
          console.log('  Required methods:', requiredMethods.length);
          console.log('  Available methods:', requiredMethods.length - missingMethods.length);
          if (missingMethods.length > 0) {
            console.log('  Missing methods:', missingMethods);
          }
          
          return missingMethods.length === 0;
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

console.log('🧪 Enterprise Validation Suite loaded!');
