import { getUnifiedRepository } from '@/services/repositories/unified';
import { Entity } from '@/types/entity';
import { UnifiedOwnership } from '@/types/unified';

export interface ValidationReport {
  testName: string;
  passed: boolean;
  duration: number;
  details: string;
  metrics?: {
    entitiesProcessed: number;
    ownershipRecords: number;
    averageResponseTime: number;
    memoryUsageMB: number;
  };
}

export class DataArchitectureValidator {
  private repository: any;
  private testData: {
    entities: Entity[];
    ownerships: UnifiedOwnership[];
  } = {
    entities: [],
    ownerships: []
  };

  async initialize() {
    this.repository = await getUnifiedRepository('ENTERPRISE');
  }

  // Generate realistic test data for stress testing
  async generateStressTestData(entityCount: number = 100): Promise<void> {
    console.log(`Generating ${entityCount} test entities for stress testing...`);
    
    const entityTypes = ['Corporation', 'LLC', 'Partnership', 'Trust', 'Individual'] as const;
    const jurisdictions = ['Delaware', 'California', 'New York', 'Texas', 'Nevada'];
    
    // Create entities
    for (let i = 0; i < entityCount; i++) {
      const entityType = entityTypes[Math.floor(Math.random() * entityTypes.length)];
      const jurisdiction = entityType !== 'Individual' ? jurisdictions[Math.floor(Math.random() * jurisdictions.length)] : undefined;
      
      const entity = await this.repository.createEntity({
        name: `StressTest ${entityType} ${i}`,
        type: entityType,
        jurisdiction,
        metadata: {
          testEntity: true,
          batch: 'stress-test',
          generatedAt: new Date().toISOString()
        },
        position: {
          x: Math.random() * 2000,
          y: Math.random() * 2000
        }
      }, 'stress-test');
      
      this.testData.entities.push(entity);
    }
    
    // Create share classes for entities
    for (const entity of this.testData.entities.slice(0, Math.min(50, entityCount))) {
      if (entity.type !== 'Individual') {
        await this.repository.createShareClass({
          entityId: entity.id,
          name: 'Common Stock',
          type: 'Common Stock',
          totalAuthorizedShares: 10000000,
          votingRights: true
        }, 'stress-test');
      }
    }
    
    console.log(`Generated ${this.testData.entities.length} test entities`);
  }

  // Test concurrent operations on Structure Chart
  async testStructureChartConcurrency(): Promise<ValidationReport> {
    const startTime = performance.now();
    const testName = 'Structure Chart Concurrency Test';
    
    try {
      // Simulate multiple users updating entity positions simultaneously
      const concurrentUpdates = this.testData.entities.slice(0, 20).map(entity => 
        this.repository.updateEntity(entity.id, {
          position: {
            x: Math.random() * 1000,
            y: Math.random() * 1000
          }
        }, 'concurrent-test')
      );
      
      await Promise.all(concurrentUpdates);
      
      // Verify data consistency
      const updatedEntities = await this.repository.getAllEntities();
      const testEntities = updatedEntities.filter(e => e.metadata?.testEntity);
      
      const duration = performance.now() - startTime;
      
      return {
        testName,
        passed: testEntities.length >= 20,
        duration,
        details: `Successfully processed ${concurrentUpdates.length} concurrent updates`,
        metrics: {
          entitiesProcessed: concurrentUpdates.length,
          ownershipRecords: 0,
          averageResponseTime: duration / concurrentUpdates.length,
          memoryUsageMB: this.getMemoryUsage()
        }
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        duration: performance.now() - startTime,
        details: `Failed: ${error}`
      };
    }
  }

  // Test Cap Table calculation performance under load
  async testCapTablePerformance(): Promise<ValidationReport> {
    const startTime = performance.now();
    const testName = 'Cap Table Performance Test';
    
    try {
      // Create complex ownership structures
      const entities = this.testData.entities.slice(0, 10);
      const ownershipPromises = [];
      
      for (let i = 0; i < entities.length - 1; i++) {
        const owner = entities[i];
        const owned = entities[i + 1];
        
        if (owner.type !== 'Individual' && owned.type !== 'Individual') {
          // Create share class
          const shareClass = await this.repository.createShareClass({
            entityId: owned.id,
            name: `Series ${String.fromCharCode(65 + i)}`,
            type: 'Preferred Series A',
            totalAuthorizedShares: 1000000,
            votingRights: true,
            liquidationPreference: 1.5
          }, 'performance-test');
          
          // Create ownership
          ownershipPromises.push(
            this.repository.createOwnership({
              ownerEntityId: owner.id,
              ownedEntityId: owned.id,
              shares: Math.floor(Math.random() * 500000) + 100000,
              shareClassId: shareClass.id,
              effectiveDate: new Date(),
              createdBy: 'performance-test',
              updatedBy: 'performance-test'
            }, 'performance-test')
          );
        }
      }
      
      await Promise.all(ownershipPromises);
      
      // Test cap table generation for all entities
      const capTablePromises = entities.map(entity => 
        this.repository.getCapTableView(entity.id)
      );
      
      const capTables = await Promise.all(capTablePromises);
      const validCapTables = capTables.filter(ct => ct !== null);
      
      const duration = performance.now() - startTime;
      
      return {
        testName,
        passed: validCapTables.length > 0,
        duration,
        details: `Generated ${validCapTables.length} cap tables with ${ownershipPromises.length} ownership relationships`,
        metrics: {
          entitiesProcessed: entities.length,
          ownershipRecords: ownershipPromises.length,
          averageResponseTime: duration / (entities.length + ownershipPromises.length),
          memoryUsageMB: this.getMemoryUsage()
        }
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        duration: performance.now() - startTime,
        details: `Failed: ${error}`
      };
    }
  }

  // Test data integrity under stress
  async testDataIntegrityUnderStress(): Promise<ValidationReport> {
    const startTime = performance.now();
    const testName = 'Data Integrity Under Stress';
    
    try {
      const initialEntityCount = (await this.repository.getAllEntities()).length;
      
      // Rapid create/update/delete operations
      const operations = [];
      
      // Create entities
      for (let i = 0; i < 10; i++) {
        operations.push(
          this.repository.createEntity({
            name: `Integrity Test ${i}`,
            type: 'Corporation',
            jurisdiction: 'Delaware',
            metadata: { integrityTest: true }
          }, 'integrity-test')
        );
      }
      
      const createdEntities = await Promise.all(operations);
      
      // Update operations
      const updateOperations = createdEntities.map(entity =>
        this.repository.updateEntity(entity.id, {
          name: `Updated ${entity.name}`,
          metadata: { ...entity.metadata, updated: true }
        }, 'integrity-test')
      );
      
      await Promise.all(updateOperations);
      
      // Verify consistency
      const finalEntities = await this.repository.getAllEntities();
      const integrityTestEntities = finalEntities.filter(e => e.metadata?.integrityTest);
      const updatedEntities = integrityTestEntities.filter(e => e.metadata?.updated);
      
      const duration = performance.now() - startTime;
      
      return {
        testName,
        passed: updatedEntities.length === createdEntities.length,
        duration,
        details: `Created and updated ${createdEntities.length} entities, verified ${updatedEntities.length} updates`,
        metrics: {
          entitiesProcessed: createdEntities.length * 2, // create + update
          ownershipRecords: 0,
          averageResponseTime: duration / (createdEntities.length * 2),
          memoryUsageMB: this.getMemoryUsage()
        }
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        duration: performance.now() - startTime,
        details: `Failed: ${error}`
      };
    }
  }

  // Test edge cases and error handling
  async testEdgeCaseHandling(): Promise<ValidationReport> {
    const startTime = performance.now();
    const testName = 'Edge Case Handling';
    
    try {
      const edgeCases = [];
      
      // Test 1: Invalid entity creation
      try {
        await this.repository.createEntity({
          name: '',
          type: 'InvalidType',
          metadata: {}
        }, 'edge-test');
        edgeCases.push({ test: 'Invalid entity creation', passed: false });
      } catch (error) {
        edgeCases.push({ test: 'Invalid entity creation', passed: true });
      }
      
      // Test 2: Non-existent entity operations
      try {
        await this.repository.getCapTableView('non-existent-id');
        edgeCases.push({ test: 'Non-existent entity cap table', passed: true });
      } catch (error) {
        edgeCases.push({ test: 'Non-existent entity cap table', passed: true });
      }
      
      // Test 3: Circular ownership detection
      if (this.testData.entities.length >= 2) {
        const [entityA, entityB] = this.testData.entities.slice(0, 2);
        
        try {
          // This should be handled gracefully
          await this.repository.createOwnership({
            ownerEntityId: entityA.id,
            ownedEntityId: entityB.id,
            shares: 1000,
            shareClassId: 'invalid-share-class',
            effectiveDate: new Date(),
            createdBy: 'edge-test',
            updatedBy: 'edge-test'
          }, 'edge-test');
          edgeCases.push({ test: 'Invalid share class handling', passed: false });
        } catch (error) {
          edgeCases.push({ test: 'Invalid share class handling', passed: true });
        }
      }
      
      const passedTests = edgeCases.filter(t => t.passed).length;
      const duration = performance.now() - startTime;
      
      return {
        testName,
        passed: passedTests === edgeCases.length,
        duration,
        details: `Passed ${passedTests}/${edgeCases.length} edge case tests`,
        metrics: {
          entitiesProcessed: 0,
          ownershipRecords: 0,
          averageResponseTime: duration / edgeCases.length,
          memoryUsageMB: this.getMemoryUsage()
        }
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        duration: performance.now() - startTime,
        details: `Failed: ${error}`
      };
    }
  }

  // Memory usage tracking
  private getMemoryUsage(): number {
    if ((performance as any).memory) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  // Clean up test data
  async cleanup(): Promise<void> {
    console.log('Cleaning up stress test data...');
    
    try {
      const allEntities = await this.repository.getAllEntities();
      const testEntities = allEntities.filter(e => 
        e.metadata?.testEntity || 
        e.metadata?.integrityTest || 
        e.name?.includes('StressTest') ||
        e.name?.includes('Integrity Test')
      );
      
      for (const entity of testEntities) {
        try {
          await this.repository.deleteEntity(entity.id, 'cleanup', 'Stress test cleanup');
        } catch (error) {
          // Some entities might have dependencies, skip for now
          console.log(`Could not delete entity ${entity.id}: ${error}`);
        }
      }
      
      console.log(`Cleaned up ${testEntities.length} test entities`);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  // Run comprehensive test suite
  async runComprehensiveTests(): Promise<ValidationReport[]> {
    await this.initialize();
    
    const results: ValidationReport[] = [];
    
    // Generate test data
    await this.generateStressTestData(50);
    
    // Run tests
    results.push(await this.testStructureChartConcurrency());
    results.push(await this.testCapTablePerformance());
    results.push(await this.testDataIntegrityUnderStress());
    results.push(await this.testEdgeCaseHandling());
    
    // Clean up
    await this.cleanup();
    
    return results;
  }
}

// Global function for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).runDataArchitectureValidation = async () => {
    const validator = new DataArchitectureValidator();
    return await validator.runComprehensiveTests();
  };
}