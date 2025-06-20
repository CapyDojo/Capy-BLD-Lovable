
import { getUnifiedRepository } from '@/services/repositories/unified';
import { Entity, ShareClass } from '@/types/entity';
import { UnifiedOwnership, CapTableView, EntityNode, ValidationResult } from '@/types/unified';

export class UnifiedEntityService {
  private static instance: UnifiedEntityService;
  
  private constructor() {
    console.log('🏭 UnifiedEntityService: Singleton instance created');
  }

  static getInstance(): UnifiedEntityService {
    if (!this.instance) {
      this.instance = new UnifiedEntityService();
    }
    return this.instance;
  }

  // Entity operations using unified repository
  async createEntity(entityData: Omit<Entity, 'id' | 'createdAt' | 'updatedAt' | 'version'>, createdBy: string = 'user'): Promise<Entity> {
    console.log('🏭 UnifiedEntityService: Creating entity via unified repository:', entityData.name);
    const repository = await getUnifiedRepository('ENTERPRISE');
    return repository.createEntity(entityData, createdBy, 'Created via UnifiedEntityService');
  }

  async updateEntity(id: string, updates: Partial<Entity>, updatedBy: string = 'user'): Promise<Entity> {
    console.log('🏭 UnifiedEntityService: Updating entity via unified repository:', id);
    const repository = await getUnifiedRepository('ENTERPRISE');
    
    // Validate entity exists
    const existing = await repository.getEntity(id);
    if (!existing) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    return repository.updateEntity(id, updates, updatedBy, 'Updated via UnifiedEntityService');
  }

  async deleteEntity(id: string, deletedBy: string = 'user'): Promise<void> {
    console.log('🏭 UnifiedEntityService: Deleting entity via unified repository:', id);
    const repository = await getUnifiedRepository('ENTERPRISE');
    
    // Validate deletion
    const validationResult = await repository.validateEntityDeletion(id);
    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map(e => e.message).join(', ');
      throw new Error(`Cannot delete entity: ${errorMessages}`);
    }

    return repository.deleteEntity(id, deletedBy, 'Deleted via UnifiedEntityService');
  }

  async getEntity(id: string): Promise<Entity | null> {
    const repository = await getUnifiedRepository('ENTERPRISE');
    return repository.getEntity(id);
  }

  async getAllEntities(): Promise<Entity[]> {
    const repository = await getUnifiedRepository('ENTERPRISE');
    return repository.getAllEntities();
  }

  async getAllOwnerships(): Promise<UnifiedOwnership[]> {
    const repository = await getUnifiedRepository('ENTERPRISE');
    return repository.queryOwnerships({});
  }

  // Ownership operations using unified repository
  async createOwnership(
    ownerEntityId: string,
    ownedEntityId: string,
    shares: number,
    shareClassId?: string,
    createdBy: string = 'user'
  ): Promise<UnifiedOwnership> {
    console.log('🏭 UnifiedEntityService: Creating ownership via unified repository');
    const repository = await getUnifiedRepository('ENTERPRISE');
    
    // Validate entities exist
    const owner = await repository.getEntity(ownerEntityId);
    const owned = await repository.getEntity(ownedEntityId);
    
    if (!owner) throw new Error(`Owner entity ${ownerEntityId} not found`);
    if (!owned) throw new Error(`Owned entity ${ownedEntityId} not found`);
    
    // Prevent self-ownership
    if (ownerEntityId === ownedEntityId) {
      throw new Error('Entity cannot own itself');
    }

    // Get or create default share class
    let finalShareClassId = shareClassId;
    if (!finalShareClassId) {
      const shareClasses = await repository.getShareClassesByEntity(ownedEntityId);
      if (shareClasses.length === 0) {
        const defaultShareClass = await this.createDefaultShareClass(ownedEntityId, owned.type, createdBy);
        finalShareClassId = defaultShareClass.id;
      } else {
        finalShareClassId = shareClasses[0].id;
      }
    }

    return repository.createOwnership({
      ownerEntityId,
      ownedEntityId,
      shares,
      shareClassId: finalShareClassId,
      effectiveDate: new Date(),
      createdBy,
      updatedBy: createdBy
    }, createdBy);
  }

  async deleteOwnership(id: string, deletedBy: string = 'user'): Promise<void> {
    console.log('🏭 UnifiedEntityService: Deleting ownership via unified repository:', id);
    const repository = await getUnifiedRepository('ENTERPRISE');
    return repository.deleteOwnership(id, deletedBy, 'Deleted via UnifiedEntityService');
  }

  // Share class operations
  async createDefaultShareClass(entityId: string, entityType: Entity['type'], createdBy: string = 'user'): Promise<ShareClass> {
    console.log('🏭 UnifiedEntityService: Creating default share class for:', entityType);
    const repository = await getUnifiedRepository('ENTERPRISE');
    
    const shareClassConfig = {
      'Corporation': { name: 'Common Stock', type: 'Common Stock' as const, totalShares: 10000000 },
      'LLC': { name: 'Membership Units', type: 'Common Stock' as const, totalShares: 1000000 },
      'Partnership': { name: 'Partnership Interests', type: 'Common Stock' as const, totalShares: 1000000 },
      'Trust': { name: 'Trust Units', type: 'Common Stock' as const, totalShares: 1000000 },
      'Individual': { name: 'N/A', type: 'Common Stock' as const, totalShares: 0 },
    };

    const config = shareClassConfig[entityType];
    
    return repository.createShareClass({
      entityId,
      name: config.name,
      type: config.type,
      totalAuthorizedShares: config.totalShares,
      votingRights: true,
    }, createdBy);
  }

  // Computed views
  async getCapTableView(entityId: string): Promise<CapTableView | null> {
    const repository = await getUnifiedRepository('ENTERPRISE');
    return repository.getCapTableView(entityId);
  }

  async getOwnershipHierarchy(): Promise<EntityNode[]> {
    const repository = await getUnifiedRepository('ENTERPRISE');
    return repository.getOwnershipHierarchy();
  }

  // Validation
  async validateEntityDeletion(entityId: string): Promise<ValidationResult> {
    const repository = await getUnifiedRepository('ENTERPRISE');
    return repository.validateEntityDeletion(entityId);
  }

  // Subsidiary creation helper
  async createSubsidiary(
    parentId: string,
    subsidiaryData: Omit<Entity, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
    ownershipPercentage: number,
    createdBy: string = 'user'
  ): Promise<{ entity: Entity; ownership: UnifiedOwnership }> {
    console.log('🏭 UnifiedEntityService: Creating subsidiary with ownership');
    
    // Validate parent exists
    const parent = await this.getEntity(parentId);
    if (!parent) {
      throw new Error(`Parent entity ${parentId} not found`);
    }

    // Create subsidiary
    const subsidiary = await this.createEntity(subsidiaryData, createdBy);

    // Get default share class for subsidiary
    const shareClasses = await (await getUnifiedRepository('ENTERPRISE')).getShareClassesByEntity(subsidiary.id);
    const shareClass = shareClasses[0]; // We just created it

    // Calculate shares from percentage
    const shares = Math.round((ownershipPercentage / 100) * shareClass.totalAuthorizedShares);

    // Create ownership relationship
    const ownership = await this.createOwnership(parentId, subsidiary.id, shares, shareClass.id, createdBy);

    return { entity: subsidiary, ownership };
  }
}

// Export singleton instance
export const unifiedEntityService = UnifiedEntityService.getInstance();
