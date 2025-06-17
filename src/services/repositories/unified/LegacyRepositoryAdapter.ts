
import { IUnifiedEntityRepository, RepositoryEvent } from './IUnifiedRepository';
import { DataStore } from '@/services/dataStore/DataStore';
import { Entity, ShareClass as EntityShareClass, OwnershipRelationship } from '@/types/entity';
import { ShareClass as CapTableShareClass } from '@/types/capTable';
import { UnifiedOwnership, CapTableView, EntityNode, ValidationResult } from '@/types/unified';

export class LegacyRepositoryAdapter implements IUnifiedEntityRepository {
  private eventListeners: ((event: RepositoryEvent) => void)[] = [];

  constructor(private legacyStore: DataStore) {
    console.log('🔗 LegacyRepositoryAdapter initialized with legacy store');
  }

  // Entity Management - using correct DataStore methods
  async createEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt' | 'version'>, createdBy: string, reason?: string): Promise<Entity> {
    // Create a full entity with generated fields
    const newEntity: Entity = {
      ...entity,
      id: `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };
    
    this.legacyStore.addEntity(newEntity);
    
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
    const existingEntity = this.legacyStore.getEntityById(id);
    if (!existingEntity) {
      throw new Error(`Entity with id ${id} not found`);
    }

    const updatedEntity: Entity = {
      ...existingEntity,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
      version: existingEntity.version + 1
    };

    this.legacyStore.updateEntity(id, updatedEntity);
    
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
    this.legacyStore.deleteEntity(id);
    
    this.emitEvent({
      type: 'ENTITY_DELETED',
      entityId: id,
      timestamp: new Date(),
      userId: deletedBy
    });
  }

  async getEntity(id: string): Promise<Entity | null> {
    return this.legacyStore.getEntityById(id);
  }

  async getAllEntities(): Promise<Entity[]> {
    return this.legacyStore.getEntities();
  }

  // Share Class Management - Convert between capTable.ShareClass and entity.ShareClass
  async createShareClass(shareClass: Omit<EntityShareClass, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<EntityShareClass> {
    // Convert to CapTable format for storage
    const capTableShareClass: CapTableShareClass = {
      id: `shareclass_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: shareClass.name,
      type: shareClass.type,
      votingRights: shareClass.votingRights,
      liquidationPreference: shareClass.liquidationPreference,
      dividendRate: shareClass.dividendRate
    };

    // Store in legacy format (assuming DataStore has a method to add share classes to cap tables)
    // For now, we'll create the entity format directly
    const newShareClass: EntityShareClass = {
      ...shareClass,
      id: capTableShareClass.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.emitEvent({
      type: 'SHARE_CLASS_CREATED',
      entityId: shareClass.entityId,
      timestamp: new Date(),
      userId: createdBy,
      data: newShareClass
    });

    return newShareClass;
  }

  async updateShareClass(id: string, updates: Partial<EntityShareClass>, updatedBy: string, reason?: string): Promise<EntityShareClass> {
    // Since DataStore doesn't have direct share class methods, we'll simulate
    const updatedShareClass: EntityShareClass = {
      id,
      entityId: updates.entityId || '',
      name: updates.name || '',
      type: updates.type || 'Common Stock',
      totalAuthorizedShares: updates.totalAuthorizedShares || 0,
      votingRights: updates.votingRights ?? true,
      liquidationPreference: updates.liquidationPreference,
      dividendRate: updates.dividendRate,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
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
    // Since we can't directly delete from DataStore, we'll just emit the event
    this.emitEvent({
      type: 'SHARE_CLASS_DELETED',
      entityId: '', // We don't have the entityId without querying first
      timestamp: new Date(),
      userId: deletedBy
    });
  }

  async getShareClass(id: string): Promise<EntityShareClass | null> {
    // DataStore doesn't have direct share class access, return null for now
    return null;
  }

  async getShareClassesByEntity(entityId: string): Promise<EntityShareClass[]> {
    // DataStore doesn't have direct share class access, return empty array
    return [];
  }

  // Ownership Management - convert between legacy and unified formats
  async createOwnership(ownership: Omit<UnifiedOwnership, 'id' | 'createdAt' | 'updatedAt' | 'version'>, createdBy: string): Promise<UnifiedOwnership> {
    // Create a full ownership relationship
    const newOwnership: OwnershipRelationship = {
      id: `ownership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ownerEntityId: ownership.ownerEntityId,
      ownedEntityId: ownership.ownedEntityId,
      shares: ownership.shares,
      shareClassId: ownership.shareClassId,
      effectiveDate: ownership.effectiveDate,
      expiryDate: ownership.expiryDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };

    this.legacyStore.addOwnership(newOwnership);
    
    // Convert to UnifiedOwnership format
    const unifiedOwnership: UnifiedOwnership = {
      ...newOwnership,
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
    const existingOwnership = this.legacyStore.getOwnershipById(id);
    if (!existingOwnership) {
      throw new Error(`Ownership with id ${id} not found`);
    }

    // Update the ownership
    const updatedOwnership: OwnershipRelationship = {
      ...existingOwnership,
      ownerEntityId: updates.ownerEntityId ?? existingOwnership.ownerEntityId,
      ownedEntityId: updates.ownedEntityId ?? existingOwnership.ownedEntityId,
      shares: updates.shares ?? existingOwnership.shares,
      shareClassId: updates.shareClassId ?? existingOwnership.shareClassId,
      effectiveDate: updates.effectiveDate ?? existingOwnership.effectiveDate,
      expiryDate: updates.expiryDate ?? existingOwnership.expiryDate,
      updatedAt: new Date(),
      version: existingOwnership.version + 1
    };

    this.legacyStore.updateOwnership(id, updatedOwnership);
    
    // Convert to UnifiedOwnership format
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
    const ownership = this.legacyStore.getOwnershipById(id);
    this.legacyStore.deleteOwnership(id);
    
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
    const legacyOwnership = this.legacyStore.getOwnershipById(id);
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
    const allOwnerships = this.legacyStore.getOwnerships();
    const entityOwnerships = allOwnerships.filter(o => 
      o.ownerEntityId === entityId || o.ownedEntityId === entityId
    );
    
    // Convert all to unified format
    return entityOwnerships.map(ownership => ({
      ...ownership,
      createdBy: 'legacy-system',
      updatedBy: 'legacy-system',
      changeReason: undefined
    }));
  }

  // Computed Views - Use legacy store's cap table logic
  async getCapTableView(entityId: string): Promise<CapTableView | null> {
    // Build cap table view from legacy data
    const entity = this.legacyStore.getEntityById(entityId);
    if (!entity) return null;

    const allOwnerships = this.legacyStore.getOwnerships();
    const ownerships = allOwnerships.filter(o => o.ownedEntityId === entityId);

    const ownershipSummary = ownerships.map(ownership => ({
      ownershipId: ownership.id,
      ownerEntityId: ownership.ownerEntityId,
      ownerName: this.legacyStore.getEntityById(ownership.ownerEntityId)?.name || 'Unknown',
      shares: ownership.shares,
      shareClassName: 'Common Stock', // Default since we don't have share class data
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
      shareClasses: [], // Empty since we don't have share class data from legacy store
      lastUpdated: new Date()
    };
  }

  async getOwnershipHierarchy(): Promise<EntityNode[]> {
    // Simplified hierarchy from legacy data
    const entities = this.legacyStore.getEntities();
    const allOwnerships = this.legacyStore.getOwnerships();

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
    const allOwnerships = this.legacyStore.getOwnerships();
    const ownerships = allOwnerships.filter(o => 
      o.ownerEntityId === entityId || o.ownedEntityId === entityId
    );
    
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
