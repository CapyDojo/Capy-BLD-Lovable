
import { IUnifiedEntityRepository, RepositoryEvent } from './IUnifiedRepository';
import { DataStore } from '@/services/dataStore/DataStore';
import { Entity, ShareClass, OwnershipRelationship } from '@/types/entity';
import { UnifiedOwnership, CapTableView, EntityNode, ValidationResult } from '@/types/unified';

export class LegacyRepositoryAdapter implements IUnifiedEntityRepository {
  private eventListeners: ((event: RepositoryEvent) => void)[] = [];

  constructor(private legacyStore: DataStore) {
    console.log('🔗 LegacyRepositoryAdapter initialized with legacy store');
  }

  // Entity Management
  async createEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt' | 'version'>, createdBy: string, reason?: string): Promise<Entity> {
    const newEntity = await this.legacyStore.createEntity(entity);
    
    this.emitEvent({
      type: 'ENTITY_CREATED',
      entityId: newEntity.id,
      timestamp: new Date(),
      userId: createdBy,
      data: newEntity
    });

    return newEntity;
  }

  async updateEntity(id: string, updates: Partial<Entity>, updatedBy: string, reason?: string): Promise<Entity> {
    const updatedEntity = await this.legacyStore.updateEntity(id, updates);
    
    this.emitEvent({
      type: 'ENTITY_UPDATED',
      entityId: id,
      timestamp: new Date(),
      userId: updatedBy,
      data: updatedEntity
    });

    return updatedEntity;
  }

  async deleteEntity(id: string, deletedBy: string, reason?: string): Promise<void> {
    await this.legacyStore.deleteEntity(id);
    
    this.emitEvent({
      type: 'ENTITY_DELETED',
      entityId: id,
      timestamp: new Date(),
      userId: deletedBy
    });
  }

  async getEntity(id: string): Promise<Entity | null> {
    return this.legacyStore.getEntity(id);
  }

  async getAllEntities(): Promise<Entity[]> {
    return this.legacyStore.getAllEntities();
  }

  // Share Class Management
  async createShareClass(shareClass: Omit<ShareClass, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<ShareClass> {
    const newShareClass = await this.legacyStore.createShareClass(shareClass);
    
    this.emitEvent({
      type: 'SHARE_CLASS_CREATED',
      entityId: shareClass.entityId,
      timestamp: new Date(),
      userId: createdBy,
      data: newShareClass
    });

    return newShareClass;
  }

  async updateShareClass(id: string, updates: Partial<ShareClass>, updatedBy: string, reason?: string): Promise<ShareClass> {
    const updatedShareClass = await this.legacyStore.updateShareClass(id, updates);
    
    this.emitEvent({
      type: 'SHARE_CLASS_UPDATED',
      entityId: updatedShareClass.entityId,
      timestamp: new Date(),
      userId: updatedBy,
      data: updatedShareClass
    });

    return updatedShareClass;
  }

  async deleteShareClass(id: string, deletedBy: string, reason?: string): Promise<void> {
    const shareClass = await this.legacyStore.getShareClass(id);
    await this.legacyStore.deleteShareClass(id);
    
    if (shareClass) {
      this.emitEvent({
        type: 'SHARE_CLASS_DELETED',
        entityId: shareClass.entityId,
        timestamp: new Date(),
        userId: deletedBy
      });
    }
  }

  async getShareClass(id: string): Promise<ShareClass | null> {
    return this.legacyStore.getShareClass(id);
  }

  async getShareClassesByEntity(entityId: string): Promise<ShareClass[]> {
    return this.legacyStore.getShareClassesByEntity(entityId);
  }

  // Ownership Management (Unified) - Convert between legacy and unified formats
  async createOwnership(ownership: Omit<UnifiedOwnership, 'id' | 'createdAt' | 'updatedAt' | 'version'>, createdBy: string): Promise<UnifiedOwnership> {
    // Convert UnifiedOwnership to legacy OwnershipRelationship format
    const legacyOwnership: Omit<OwnershipRelationship, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
      ownerEntityId: ownership.ownerEntityId,
      ownedEntityId: ownership.ownedEntityId,
      shares: ownership.shares,
      shareClassId: ownership.shareClassId,
      effectiveDate: ownership.effectiveDate,
      expiryDate: ownership.expiryDate
    };

    const createdOwnership = await this.legacyStore.createOwnership(legacyOwnership);
    
    // Convert back to UnifiedOwnership format
    const unifiedOwnership: UnifiedOwnership = {
      ...createdOwnership,
      createdBy: createdBy,
      updatedBy: createdBy,
      changeReason: ownership.changeReason
    };

    this.emitEvent({
      type: 'OWNERSHIP_CREATED',
      entityId: ownership.ownedEntityId,
      timestamp: new Date(),
      userId: createdBy,
      data: unifiedOwnership
    });

    return unifiedOwnership;
  }

  async updateOwnership(id: string, updates: Partial<UnifiedOwnership>, updatedBy: string, reason?: string): Promise<UnifiedOwnership> {
    // Convert to legacy format for the update
    const legacyUpdates: Partial<OwnershipRelationship> = {
      ownerEntityId: updates.ownerEntityId,
      ownedEntityId: updates.ownedEntityId,
      shares: updates.shares,
      shareClassId: updates.shareClassId,
      effectiveDate: updates.effectiveDate,
      expiryDate: updates.expiryDate
    };

    const updatedOwnership = await this.legacyStore.updateOwnership(id, legacyUpdates);
    
    // Convert back to UnifiedOwnership format
    const unifiedOwnership: UnifiedOwnership = {
      ...updatedOwnership,
      createdBy: updatedBy, // Legacy doesn't track this, use updatedBy
      updatedBy: updatedBy,
      changeReason: reason
    };

    this.emitEvent({
      type: 'OWNERSHIP_UPDATED',
      entityId: updatedOwnership.ownedEntityId,
      timestamp: new Date(),
      userId: updatedBy,
      data: unifiedOwnership
    });

    return unifiedOwnership;
  }

  async deleteOwnership(id: string, deletedBy: string, reason?: string): Promise<void> {
    const ownership = await this.legacyStore.getOwnership(id);
    await this.legacyStore.deleteOwnership(id);
    
    if (ownership) {
      this.emitEvent({
        type: 'OWNERSHIP_DELETED',
        entityId: ownership.ownedEntityId,
        timestamp: new Date(),
        userId: deletedBy
      });
    }
  }

  async getOwnership(id: string): Promise<UnifiedOwnership | null> {
    const legacyOwnership = await this.legacyStore.getOwnership(id);
    if (!legacyOwnership) return null;

    // Convert to unified format
    return {
      ...legacyOwnership,
      createdBy: 'legacy-system', // Legacy doesn't track this
      updatedBy: 'legacy-system',
      changeReason: undefined
    };
  }

  async getOwnershipsByEntity(entityId: string): Promise<UnifiedOwnership[]> {
    const legacyOwnerships = await this.legacyStore.getOwnershipsByEntity(entityId);
    
    // Convert all to unified format
    return legacyOwnerships.map(ownership => ({
      ...ownership,
      createdBy: 'legacy-system',
      updatedBy: 'legacy-system',
      changeReason: undefined
    }));
  }

  // Computed Views - Use legacy store's cap table logic
  async getCapTableView(entityId: string): Promise<CapTableView | null> {
    // Build cap table view from legacy data
    const entity = await this.legacyStore.getEntity(entityId);
    if (!entity) return null;

    const ownerships = await this.legacyStore.getOwnershipsByEntity(entityId);
    const shareClasses = await this.legacyStore.getShareClassesByEntity(entityId);

    const ownershipSummary = ownerships
      .filter(o => o.ownedEntityId === entityId)
      .map(ownership => ({
        ownershipId: ownership.id,
        ownerEntityId: ownership.ownerEntityId,
        ownerName: 'Unknown', // Legacy store doesn't provide easy access to owner names
        shares: ownership.shares,
        shareClassName: 'Unknown', // Would need to lookup share class
        effectiveDate: ownership.effectiveDate,
        percentage: 0 // Calculated below
      }));

    const totalShares = ownershipSummary.reduce((sum, o) => sum + o.shares, 0);
    
    // Calculate percentages
    ownershipSummary.forEach(summary => {
      summary.percentage = totalShares > 0 ? (summary.shares / totalShares) * 100 : 0;
    });

    return {
      entityId,
      entityName: entity.name,
      totalShares,
      ownershipSummary,
      shareClasses: shareClasses.map(sc => ({
        id: sc.id,
        name: sc.name,
        type: sc.type,
        authorizedShares: sc.totalAuthorizedShares,
        issuedShares: ownerships.filter(o => o.shareClassId === sc.id).reduce((sum, o) => sum + o.shares, 0),
        votingRights: sc.votingRights
      })),
      lastUpdated: new Date()
    };
  }

  async getOwnershipHierarchy(): Promise<EntityNode[]> {
    // Simplified hierarchy from legacy data
    const entities = await this.legacyStore.getAllEntities();
    const allOwnerships = await this.legacyStore.getAllOwnerships();

    // Find root entities (entities that are not owned by anyone)
    const ownedEntityIds = new Set(allOwnerships.map(o => o.ownedEntityId));
    const rootEntities = entities.filter(e => !ownedEntityIds.has(e.id));

    const buildNode = (entity: Entity): EntityNode => {
      const children = allOwnerships
        .filter(o => o.ownerEntityId === entity.id)
        .map(o => {
          const childEntity = entities.find(e => e.id === o.ownedEntityId);
          return childEntity ? buildNode(childEntity) : null;
        })
        .filter(Boolean) as EntityNode[];

      return {
        entityId: entity.id,
        entityName: entity.name,
        entityType: entity.type,
        children,
        totalOwnedEntities: children.length
      };
    };

    return rootEntities.map(buildNode);
  }

  // Validation - Basic validation from legacy store
  async validateEntityDeletion(entityId: string): Promise<ValidationResult> {
    const ownerships = await this.legacyStore.getOwnershipsByEntity(entityId);
    
    if (ownerships.length > 0) {
      return {
        isValid: false,
        errors: [{
          code: 'ENTITY_HAS_RELATIONSHIPS',
          message: `Cannot delete entity - it has ${ownerships.length} ownership relationships`,
          field: 'entity'
        }],
        warnings: []
      };
    }

    return { isValid: true, errors: [], warnings: [] };
  }

  async validateOwnershipChange(ownership: Partial<UnifiedOwnership>): Promise<ValidationResult> {
    // Basic validation
    if (!ownership.ownerEntityId || !ownership.ownedEntityId || !ownership.shares) {
      return {
        isValid: false,
        errors: [{
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Missing required ownership fields',
          field: 'ownership'
        }],
        warnings: []
      };
    }

    return { isValid: true, errors: [], warnings: [] };
  }

  // Event Subscription
  subscribe(callback: (event: RepositoryEvent) => void): () => void {
    this.eventListeners.push(callback);
    console.log('🔗 LegacyRepositoryAdapter: New subscriber added, total:', this.eventListeners.length);
    
    return () => {
      this.eventListeners = this.eventListeners.filter(listener => listener !== callback);
      console.log('🔗 LegacyRepositoryAdapter: Subscriber removed, total:', this.eventListeners.length);
    };
  }

  unsubscribe(callback: (event: RepositoryEvent) => void): void {
    this.eventListeners = this.eventListeners.filter(listener => listener !== callback);
  }

  // Private helper methods
  private emitEvent(event: RepositoryEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('❌ LegacyRepositoryAdapter: Error in event listener:', error);
      }
    });
  }
}
