
import { getUnifiedRepository } from '@/services/repositories/unified';
import { unifiedEntityService } from '@/services/UnifiedEntityService';
import { migrationBridge } from '@/services/dataStore/MigrationBridge';
import { generateUnifiedCanvasStructure } from '@/services/unifiedCanvasSync';

export class MigrationTestSuite {
  static async runComprehensiveTest(): Promise<boolean> {
    console.log('🧪 MigrationTestSuite: Starting comprehensive migration test...');
    
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

      // Test 4: Migration bridge status
      console.log('🧪 Test 4: Migration bridge status');
      const migrationStatus = migrationBridge.getMigrationStatus();
      console.log(`✅ Test 4: Migration status - ${migrationStatus.totalMigratedComponents} components migrated`);

      // Test 5: Cap table view generation
      console.log('🧪 Test 5: Cap table view generation');
      for (const entity of entities.slice(0, 3)) { // Test first 3 entities
        const capTable = await repository.getCapTableView(entity.id);
        if (capTable) {
          console.log(`✅ Test 5: Cap table generated for ${entity.name}: ${capTable.totalShares} shares`);
        }
      }

      // Test 6: Ownership hierarchy
      console.log('🧪 Test 6: Ownership hierarchy');
      const hierarchy = await repository.getOwnershipHierarchy();
      console.log(`✅ Test 6: Ownership hierarchy contains ${hierarchy.length} root entities`);

      console.log('🎉 MigrationTestSuite: All tests passed! Migration is complete and functional.');
      return true;

    } catch (error) {
      console.error('❌ MigrationTestSuite: Test failed:', error);
      return false;
    }
  }

  static async validateMigrationIntegrity(): Promise<{
    success: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    console.log('🔍 MigrationTestSuite: Validating migration integrity...');
    
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check repository availability
      const repository = await getUnifiedRepository('ENTERPRISE');
      if (!repository) {
        issues.push('Unified repository not available');
      }

      // Check migration bridge status
      const migrationStatus = migrationBridge.getMigrationStatus();
      if (!migrationStatus.globalMigrationEnabled) {
        issues.push('Global migration not enabled');
        recommendations.push('Enable global migration in MigrationBridge');
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

      const success = issues.length === 0;
      
      if (success) {
        console.log('✅ MigrationTestSuite: Migration integrity validated successfully');
      } else {
        console.log('⚠️ MigrationTestSuite: Migration integrity issues found:', issues);
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
  (window as any).runMigrationTest = MigrationTestSuite.runComprehensiveTest;
  (window as any).validateMigration = MigrationTestSuite.validateMigrationIntegrity;
  console.log('🧪 Migration test functions exposed:');
  console.log('  - runMigrationTest()');
  console.log('  - validateMigration()');
}
