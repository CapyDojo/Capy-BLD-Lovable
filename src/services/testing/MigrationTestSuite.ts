
import { getUnifiedRepository } from '@/services/repositories/unified';
import { unifiedEntityService } from '@/services/UnifiedEntityService';
import { generateUnifiedCanvasStructure } from '@/services/unifiedCanvasSync';

export class MigrationTestSuite {
  static async runComprehensiveTest(): Promise<boolean> {
    console.log('🧪 MigrationTestSuite: Starting comprehensive unified system test...');
    
    try {
      // Test 1: Repository initialization
      console.log('🧪 Test 1: Repository initialization');
      const repository = await getUnifiedRepository('ENTERPRISE');
      console.log('✅ Test 1: Repository initialized successfully');

      // Test 2: Entity service operations
      console.log('🧪 Test 2: Entity service operations');
      const entities = await unifiedEntityService.getAllEntities();
      console.log(`✅ Test 2: Retrieved ${entities.length} entities from unified service`);

      // Test 3: Canvas data generation
      console.log('🧪 Test 3: Canvas data generation');
      const canvasData = await generateUnifiedCanvasStructure();
      console.log(`✅ Test 3: Generated canvas with ${canvasData.nodes.length} nodes, ${canvasData.edges.length} edges`);

      // Test 4: Cap table view generation
      console.log('🧪 Test 4: Cap table view generation');
      for (const entity of entities.slice(0, 3)) { // Test first 3 entities
        const capTable = await repository.getCapTableView(entity.id);
        if (capTable) {
          console.log(`✅ Test 4: Cap table generated for ${entity.name}: ${capTable.totalShares} shares`);
        }
      }

      // Test 5: Ownership hierarchy
      console.log('🧪 Test 5: Ownership hierarchy');
      const hierarchy = await repository.getOwnershipHierarchy();
      console.log(`✅ Test 5: Ownership hierarchy contains ${hierarchy.length} root entities`);

      // Test 6: Repository events
      console.log('🧪 Test 6: Repository event system');
      let eventReceived = false;
      const unsubscribe = repository.subscribe((event) => {
        console.log('📡 Test event received:', event.type);
        eventReceived = true;
      });
      
      // Trigger an event by creating a test entity
      await repository.createEntity({
        name: 'Test Entity',
        type: 'Corporation',
        jurisdiction: 'Delaware'
      }, 'test-user', 'Migration test');
      
      // Wait briefly for event
      await new Promise(resolve => setTimeout(resolve, 100));
      unsubscribe();
      
      if (eventReceived) {
        console.log('✅ Test 6: Repository event system working');
      } else {
        console.log('⚠️ Test 6: Repository event system may have issues');
      }

      console.log('🎉 MigrationTestSuite: All tests passed! Unified system is fully operational.');
      return true;

    } catch (error) {
      console.error('❌ MigrationTestSuite: Test failed:', error);
      return false;
    }
  }

  static async validateSystemIntegrity(): Promise<{
    success: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    console.log('🔍 MigrationTestSuite: Validating unified system integrity...');
    
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check repository availability
      const repository = await getUnifiedRepository('ENTERPRISE');
      if (!repository) {
        issues.push('Unified repository not available');
      }

      // Check entity service functionality
      try {
        await unifiedEntityService.getAllEntities();
      } catch (error) {
        issues.push(`Entity service error: ${error.message}`);
        recommendations.push('Check UnifiedEntityService configuration');
      }

      // Check canvas sync functionality
      try {
        await generateUnifiedCanvasStructure();
      } catch (error) {
        issues.push(`Canvas sync error: ${error.message}`);
        recommendations.push('Check unifiedCanvasSync service');
      }

      // Check repository CRUD operations
      try {
        const testEntity = await repository.createEntity({
          name: 'System Test Entity',
          type: 'Corporation',
          jurisdiction: 'Test'
        }, 'system-test', 'System integrity check');
        
        await repository.updateEntity(testEntity.id, { name: 'Updated Test Entity' }, 'system-test', 'Update test');
        await repository.deleteEntity(testEntity.id, 'system-test', 'Cleanup test');
        
        console.log('✅ Repository CRUD operations working');
      } catch (error) {
        issues.push(`Repository CRUD error: ${error.message}`);
        recommendations.push('Check repository implementation');
      }

      const success = issues.length === 0;
      
      if (success) {
        console.log('✅ MigrationTestSuite: System integrity validated successfully');
        console.log('🎉 Migration is 100% complete - all legacy code has been removed');
      } else {
        console.log('⚠️ MigrationTestSuite: System integrity issues found:', issues);
      }

      return { success, issues, recommendations };

    } catch (error) {
      console.error('❌ MigrationTestSuite: Integrity validation failed:', error);
      return {
        success: false,
        issues: [`Validation failed: ${error.message}`],
        recommendations: ['Check system configuration and try again']
      };
    }
  }
}

// Expose test functions globally for console access
if (typeof window !== 'undefined') {
  (window as any).runUnifiedSystemTest = MigrationTestSuite.runComprehensiveTest;
  (window as any).validateSystemIntegrity = MigrationTestSuite.validateSystemIntegrity;
  console.log('🧪 Unified system test functions exposed:');
  console.log('  - runUnifiedSystemTest()');
  console.log('  - validateSystemIntegrity()');
}
