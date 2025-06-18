import { createUnifiedRepository } from '@/services/repositories/unified/UnifiedRepositoryFactory';
import { IUnifiedEntityRepository } from '@/services/repositories/unified/IUnifiedRepository';

interface TestResult {
  success: boolean;
  message: string;
}

export class MigrationTestSuite {
  private repository: IUnifiedEntityRepository;

  constructor(repository: IUnifiedEntityRepository) {
    this.repository = repository;
  }

  static async create(): Promise<MigrationTestSuite> {
    const repository = await createUnifiedRepository('ENTERPRISE');
    return new MigrationTestSuite(repository);
  }

  async runAllTests(): Promise<{ [key: string]: TestResult }> {
    const results: { [key: string]: TestResult } = {
      entityOperations: await this.testEntityOperations(),
      ownershipOperations: await this.testOwnershipOperations(),
    };

    return results;
  }

  // Test 1: Entity Creation and Retrieval
  async testEntityOperations(): Promise<TestResult> {
    try {
      console.log('🧪 Testing entity operations...');
      
      const testEntity = {
        name: 'Test Corporation',
        type: 'Corporation' as const,
        jurisdiction: 'Delaware',
        metadata: {}
      };

      const createdEntity = await this.repository.createEntity(testEntity, 'test-user', 'Test entity creation');
      
      if (!createdEntity || !createdEntity.id) {
        return { success: false, message: 'Failed to create entity' };
      }

      const retrievedEntity = await this.repository.getEntity(createdEntity.id);
      
      if (!retrievedEntity || retrievedEntity.name !== testEntity.name) {
        return { success: false, message: 'Failed to retrieve created entity' };
      }

      // Cleanup
      await this.repository.deleteEntity(createdEntity.id, 'test-user', 'Test cleanup');
      
      return { success: true, message: 'Entity operations working correctly' };
    } catch (error) {
      console.error('❌ Entity operations test failed:', error);
      return { success: false, message: `Entity operations failed: ${error}` };
    }
  }
    
  async testOwnershipOperations(): Promise<TestResult> {
    try {
      console.log('🧪 Testing ownership operations...');
        
      // Create test entities
      const entity1 = await this.repository.createEntity({
        name: 'Test Corporation',
        type: 'Corporation' as const,
        jurisdiction: 'Delaware',
        metadata: {}
      }, 'test-user', 'Test entity 1');

      if (!entity1 || !entity1.id) {
        return { success: false, message: 'Failed to create entity 1' };
      }

      const entity2 = await this.repository.createEntity({
        name: 'Test LLC',
        type: 'LLC' as const,
        jurisdiction: 'Nevada',
        metadata: {}
      }, 'test-user', 'Test entity 2');

      if (!entity2 || !entity2.id) {
        return { success: false, message: 'Failed to create entity 2' };
      }

      // Create a share class for entity1
      const shareClass1 = await this.repository.createShareClass(entity1.id, {
        className: 'Common',
        authorizedShares: 1000,
        pricePerShare: 1.00,
      }, 'test-user', 'Test share class');

      if (!shareClass1 || !shareClass1.id) {
        return { success: false, message: 'Failed to create share class' };
      }

      // Create ownership from entity2 to entity1
      const ownershipData = {
        ownedEntityId: entity1.id,
        ownerEntityId: entity2.id,
        ownerName: entity2.name,
        shares: 100,
        shareClassId: shareClass1.id,
        ownerType: 'Entity' as const
      };

      await this.repository.createOwnership(ownershipData, 'test-user', 'Test ownership creation');

      // Verify ownership
      const capTable = await this.repository.getCapTableView(entity1.id);
      if (!capTable || capTable.ownershipSummary.length === 0) {
        return { success: false, message: 'Failed to create ownership' };
      }

      const ownership = capTable.ownershipSummary.find(o => o.ownerEntityId === entity2.id);
      if (!ownership || ownership.shares !== 100) {
        return { success: false, message: 'Failed to verify ownership' };
      }

      // Cleanup
      await this.repository.deleteOwnership(ownership.ownershipId, 'test-user', 'Test ownership deletion');
      await this.repository.deleteShareClass(shareClass1.id, 'test-user', 'Test share class deletion');
      await this.repository.deleteEntity(entity1.id, 'test-user', 'Test entity 1 deletion');
      await this.repository.deleteEntity(entity2.id, 'test-user', 'Test entity 2 deletion');

      return { success: true, message: 'Ownership operations working correctly' };
    } catch (error) {
      console.error('❌ Ownership operations test failed:', error);
      return { success: false, message: `Ownership operations failed: ${error}` };
    }
  }
}
