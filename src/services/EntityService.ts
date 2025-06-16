
import { Entity, OwnershipRelationship, ShareClass, OwnershipSummary } from '@/types/entity';
import { EntityRepository, OwnershipRepository, ShareClassRepository } from './repositories/interfaces';

export class EntityService {
  constructor(
    private entityRepo: EntityRepository,
    private ownershipRepo: OwnershipRepository,
    private shareClassRepo: ShareClassRepository
  ) {}

  // Entity operations
  async createEntity(entityData: Omit<Entity, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Entity> {
    const id = `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const entity = await this.entityRepo.create({
      ...entityData,
      id,
      metadata: entityData.metadata || {},
    });

    // Create default share class for corporate entities
    if (entity.type !== 'Individual') {
      await this.createDefaultShareClass(entity.id, entity.type);
    }

    return entity;
  }

  async updateEntity(id: string, updates: Partial<Entity>): Promise<Entity> {
    // Validate entity exists
    const existing = await this.entityRepo.findById(id);
    if (!existing) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    return await this.entityRepo.update(id, updates);
  }

  async deleteEntity(id: string): Promise<void> {
    // Validate entity exists
    const existing = await this.entityRepo.findById(id);
    if (!existing) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    // Check for dependent ownerships
    const ownerships = await this.ownershipRepo.findByEntity(id);
    if (ownerships.length > 0) {
      console.log(`🗑️ Cleaning up ${ownerships.length} ownership relationships for entity ${id}`);
    }

    // Transactional deletion
    await this.ownershipRepo.deleteByEntity(id);
    
    // Delete share classes
    const shareClasses = await this.shareClassRepo.findByEntity(id);
    for (const shareClass of shareClasses) {
      await this.shareClassRepo.delete(shareClass.id);
    }
    
    await this.entityRepo.delete(id);
    console.log('✅ Entity and all dependencies deleted:', id);
  }

  async createOwnership(
    ownerEntityId: string,
    ownedEntityId: string,
    shares: number,
    shareClassId?: string
  ): Promise<OwnershipRelationship> {
    // Validate entities exist
    const owner = await this.entityRepo.findById(ownerEntityId);
    const owned = await this.entityRepo.findById(ownedEntityId);
    
    if (!owner) throw new Error(`Owner entity ${ownerEntityId} not found`);
    if (!owned) throw new Error(`Owned entity ${ownedEntityId} not found`);
    
    // Prevent self-ownership
    if (ownerEntityId === ownedEntityId) {
      throw new Error('Entity cannot own itself');
    }

    // Get or create share class
    let finalShareClassId = shareClassId;
    if (!finalShareClassId) {
      const shareClasses = await this.shareClassRepo.findByEntity(ownedEntityId);
      if (shareClasses.length === 0) {
        const defaultShareClass = await this.createDefaultShareClass(ownedEntityId, owned.type);
        finalShareClassId = defaultShareClass.id;
      } else {
        finalShareClassId = shareClasses[0].id; // Use first available
      }
    }

    const id = `ownership-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return await this.ownershipRepo.create({
      id,
      ownerEntityId,
      ownedEntityId,
      shares,
      shareClassId: finalShareClassId,
      effectiveDate: new Date(),
    });
  }

  async createSubsidiary(
    parentId: string,
    subsidiaryData: Omit<Entity, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
    ownershipPercentage: number
  ): Promise<{ entity: Entity; ownership: OwnershipRelationship }> {
    // Validate parent exists
    const parent = await this.entityRepo.findById(parentId);
    if (!parent) {
      throw new Error(`Parent entity ${parentId} not found`);
    }

    // Create subsidiary
    const subsidiary = await this.createEntity(subsidiaryData);

    // Get default share class for subsidiary
    const shareClasses = await this.shareClassRepo.findByEntity(subsidiary.id);
    const shareClass = shareClasses[0]; // We just created it

    // Calculate shares from percentage
    const shares = Math.round((ownershipPercentage / 100) * shareClass.totalAuthorizedShares);

    // Create ownership relationship
    const ownership = await this.createOwnership(parentId, subsidiary.id, shares, shareClass.id);

    return { entity: subsidiary, ownership };
  }

  async getOwnershipSummary(entityId: string): Promise<OwnershipSummary> {
    const entity = await this.entityRepo.findById(entityId);
    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }

    const ownerships = await this.ownershipRepo.findByOwned(entityId);
    const shareClasses = await this.shareClassRepo.findByEntity(entityId);
    const allEntities = await this.entityRepo.findAll();

    let totalShares = 0;
    const ownershipDetails = [];

    for (const ownership of ownerships) {
      const owner = allEntities.find(e => e.id === ownership.ownerEntityId);
      const shareClass = shareClasses.find(sc => sc.id === ownership.shareClassId);
      
      if (owner && shareClass) {
        totalShares += ownership.shares;
        
        ownershipDetails.push({
          ownershipId: ownership.id,
          ownerEntityId: owner.id,
          ownerName: owner.name,
          shares: ownership.shares,
          percentage: 0, // Will calculate after we know total
          shareClassName: shareClass.name,
        });
      }
    }

    // Calculate percentages
    ownershipDetails.forEach(detail => {
      detail.percentage = totalShares > 0 ? (detail.shares / totalShares) * 100 : 0;
    });

    // Calculate available shares
    const maxAuthorizedShares = shareClasses.reduce((max, sc) => Math.max(max, sc.totalAuthorizedShares), 0);
    const availableShares = maxAuthorizedShares - totalShares;

    return {
      entityId,
      totalShares,
      ownerships: ownershipDetails,
      availableShares,
    };
  }

  private async createDefaultShareClass(entityId: string, entityType: Entity['type']): Promise<ShareClass> {
    const shareClassMap = {
      'Corporation': { name: 'Common Stock', totalShares: 10000000 },
      'LLC': { name: 'Membership Units', totalShares: 1000000 },
      'Partnership': { name: 'Partnership Interests', totalShares: 1000000 },
      'Trust': { name: 'Trust Units', totalShares: 1000000 },
      'Individual': { name: 'N/A', totalShares: 0 }, // Individuals don't have share classes
    };

    const config = shareClassMap[entityType];
    const id = `shareclass-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return await this.shareClassRepo.create({
      id,
      entityId,
      name: config.name,
      totalAuthorizedShares: config.totalShares,
      votingRights: true,
    });
  }

  // Additional helper methods
  async getAllEntities(): Promise<Entity[]> {
    return await this.entityRepo.findAll();
  }

  async getEntityById(id: string): Promise<Entity | null> {
    return await this.entityRepo.findById(id);
  }

  async getAllOwnerships(): Promise<OwnershipRelationship[]> {
    return await this.ownershipRepo.findAll();
  }
}
