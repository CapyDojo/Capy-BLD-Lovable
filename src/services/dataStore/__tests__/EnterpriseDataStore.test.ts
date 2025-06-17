
import { EnterpriseDataStore } from '../EnterpriseDataStore';
import { EnterpriseDataStoreFactory } from '../EnterpriseDataStoreFactory';
import { Entity } from '@/types/entity';

describe('EnterpriseDataStore', () => {
  let dataStore: EnterpriseDataStore;
  
  beforeEach(() => {
    dataStore = EnterpriseDataStoreFactory.createEnterpriseStore('test');
  });

  describe('Entity Management', () => {
    test('should create entity with audit trail', async () => {
      const entityData = {
        name: 'Test Corp',
        type: 'Corporation' as const,
        jurisdiction: 'Delaware',
        metadata: {}
      };

      const entity = await dataStore.createEntity(entityData, 'test-user', 'Initial creation');
      
      expect(entity.id).toBeDefined();
      expect(entity.name).toBe('Test Corp');
      expect(entity.createdAt).toBeDefined();
      expect(entity.version).toBe(1);

      // Verify audit trail
      const auditTrail = await dataStore.getAuditTrail(entity.id);
      expect(auditTrail).toHaveLength(1);
      expect(auditTrail[0].action).toBe('CREATE');
      expect(auditTrail[0].userId).toBe('test-user');
    });

    test('should update entity and increment version', async () => {
      const entity = await dataStore.createEntity({
        name: 'Test Corp',
        type: 'Corporation',
        metadata: {}
      }, 'test-user');

      const updatedEntity = await dataStore.updateEntity(
        entity.id,
        { name: 'Updated Corp' },
        'test-user',
        'Name change'
      );

      expect(updatedEntity.name).toBe('Updated Corp');
      expect(updatedEntity.version).toBe(2);
      expect(updatedEntity.updatedAt.getTime()).toBeGreaterThan(entity.createdAt.getTime());
    });

    test('should prevent deletion of entity with ownerships', async () => {
      // Create entities
      const ownerEntity = await dataStore.createEntity({
        name: 'Owner Corp',
        type: 'Corporation',
        metadata: {}
      }, 'test-user');

      const ownedEntity = await dataStore.createEntity({
        name: 'Owned Corp',
        type: 'Corporation',
        metadata: {}
      }, 'test-user');

      // Create share class
      const shareClass = await dataStore.createShareClass({
        entityId: ownedEntity.id,
        name: 'Common Stock',
        type: 'Common Stock',
        totalAuthorizedShares: 1000,
        votingRights: true
      }, 'test-user');

      // Create ownership
      await dataStore.createOwnership({
        ownerEntityId: ownerEntity.id,
        ownedEntityId: ownedEntity.id,
        shares: 100,
        shareClassId: shareClass.id,
        effectiveDate: new Date()
      }, 'test-user');

      // Try to delete owner entity - should fail
      await expect(
        dataStore.deleteEntity(ownerEntity.id, 'test-user', 'Cleanup')
      ).rejects.toThrow('Entity deletion validation failed');

      // Try to delete owned entity - should fail
      await expect(
        dataStore.deleteEntity(ownedEntity.id, 'test-user', 'Cleanup')
      ).rejects.toThrow('Entity deletion validation failed');
    });
  });

  describe('Ownership Management', () => {
    test('should create and validate ownership relationships', async () => {
      // Create entities and share class
      const ownerEntity = await dataStore.createEntity({
        name: 'Owner Corp',
        type: 'Corporation',
        metadata: {}
      }, 'test-user');

      const ownedEntity = await dataStore.createEntity({
        name: 'Owned Corp', 
        type: 'Corporation',
        metadata: {}
      }, 'test-user');

      const shareClass = await dataStore.createShareClass({
        entityId: ownedEntity.id,
        name: 'Common Stock',
        type: 'Common Stock',
        totalAuthorizedShares: 1000,
        votingRights: true
      }, 'test-user');

      // Create ownership
      const ownership = await dataStore.createOwnership({
        ownerEntityId: ownerEntity.id,
        ownedEntityId: ownedEntity.id,
        shares: 100,
        shareClassId: shareClass.id,
        effectiveDate: new Date()
      }, 'test-user');

      expect(ownership.id).toBeDefined();
      expect(ownership.shares).toBe(100);
      expect(ownership.createdBy).toBe('test-user');

      // Verify cap table view
      const capTable = await dataStore.getCapTableView(ownedEntity.id);
      expect(capTable).toBeDefined();
      expect(capTable!.totalShares).toBe(100);
      expect(capTable!.ownershipSummary).toHaveLength(1);
      expect(capTable!.ownershipSummary[0].ownerName).toBe('Owner Corp');
      expect(capTable!.ownershipSummary[0].percentage).toBe(100);
    });

    test('should prevent circular ownership', async () => {
      // Create entities
      const entityA = await dataStore.createEntity({
        name: 'Entity A',
        type: 'Corporation',
        metadata: {}
      }, 'test-user');

      const entityB = await dataStore.createEntity({
        name: 'Entity B',
        type: 'Corporation', 
        metadata: {}
      }, 'test-user');

      // Create share classes
      const shareClassA = await dataStore.createShareClass({
        entityId: entityA.id,
        name: 'Common Stock',
        type: 'Common Stock',
        totalAuthorizedShares: 1000,
        votingRights: true
      }, 'test-user');

      const shareClassB = await dataStore.createShareClass({
        entityId: entityB.id,
        name: 'Common Stock',
        type: 'Common Stock',
        totalAuthorizedShares: 1000,
        votingRights: true
      }, 'test-user');

      // Create A owns B
      await dataStore.createOwnership({
        ownerEntityId: entityA.id,
        ownedEntityId: entityB.id,
        shares: 100,
        shareClassId: shareClassB.id,
        effectiveDate: new Date()
      }, 'test-user');

      // Try to create B owns A (circular) - should fail
      await expect(
        dataStore.createOwnership({
          ownerEntityId: entityB.id,
          ownedEntityId: entityA.id,
          shares: 100,
          shareClassId: shareClassA.id,
          effectiveDate: new Date()
        }, 'test-user')
      ).rejects.toThrow('Ownership creation validation failed');
    });
  });

  describe('Business Rules', () => {
    test('should validate share allocation limits', async () => {
      const ownerEntity = await dataStore.createEntity({
        name: 'Owner Corp',
        type: 'Corporation',
        metadata: {}
      }, 'test-user');

      const ownedEntity = await dataStore.createEntity({
        name: 'Owned Corp',
        type: 'Corporation',
        metadata: {}
      }, 'test-user');

      const shareClass = await dataStore.createShareClass({
        entityId: ownedEntity.id,
        name: 'Common Stock',
        type: 'Common Stock',
        totalAuthorizedShares: 100, // Only 100 shares authorized
        votingRights: true
      }, 'test-user');

      // Try to create ownership with more shares than authorized
      await expect(
        dataStore.createOwnership({
          ownerEntityId: ownerEntity.id,
          ownedEntityId: ownedEntity.id,
          shares: 150, // More than authorized
          shareClassId: shareClass.id,
          effectiveDate: new Date()
        }, 'test-user')
      ).rejects.toThrow('Ownership creation validation failed');
    });
  });

  describe('Data Integrity', () => {
    test('should validate data integrity', async () => {
      const result = await dataStore.validateDataIntegrity();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
