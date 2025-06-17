
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
    return this.legacyStore.getEntityById(id) || null;
  }

  async getAllEntities(): Promise<Entity[]> {
    return this.legacyStore.getEntities();
  }

  // Share Class Management - Since DataStore doesn't have direct share class methods, we simulate
  async createShareClass(shareClass: Omit<EntityShareClass, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<EntityShareClass> {
    const newShareClass: EntityShareClass = {
      ...shareClass,
      id: `shareclass_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

  // Ownership Management - Simulate using DataStore's cap table functionality
  async createOwnership(ownership: Omit<UnifiedOwnership, 'id' | 'createdAt' | 'updatedAt' | 'version'>, createdBy: string): Promise<UnifiedOwnership> {
    // Since DataStore doesn't have direct ownership creation, we'll simulate it
    // In a real implementation, this would involve creating stakeholder relationships
    
    // Create a simulated ownership using DataStore's updateOwnership method
    const ownershipPercentage = (ownership.shares / 100); // Assuming shares represent percentage
    
    try {
      this.legacyStore.updateOwnership(ownership.ownerEntityId, ownership.ownedEntityId, ownershipPercentage);
    } catch (error) {
      console.warn('Could not create ownership via DataStore:', error);
    }

    // Create a unified ownership object
    const newOwnership: UnifiedOwnership = {
      id: `ownership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ownerEntityId: ownership.ownerEntityId,
      ownedEntityId: ownership.ownedEntityId,
      shares: ownership.shares,
      shareClassId: ownership.shareClassId,
      effectiveDate: ownership.effectiveDate,
      expiryDate: ownership.expiryDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      createdBy: createdBy,
      updatedBy: createdBy,
      changeReason: ownership.changeReason
    };

    this.emitEvent({
      type: 'OWNERSHIP_CREATED',
      entityId: ownership.ownedEntityId,
      timestamp: new Date(),
      userId: createdBy,
      data: newOwnership
    });

    return newOwnership;
  }

  async updateOwnership(id: string, updates: Partial<UnifiedOwnership>, updatedBy: string, reason?: string): Promise<UnifiedOwnership> {
    // Since DataStore doesn't have getOwnershipById, we'll simulate
    const updatedOwnership: UnifiedOwnership = {
      id,
      ownerEntityId: updates.ownerEntityId || '',
      ownedEntityId: updates.ownedEntityId || '',
      shares: updates.shares || 0,
      shareClassId: updates.shareClassId,
      effectiveDate: updates.effectiveDate || new Date(),
      expiryDate: updates.expiryDate,
      createdAt: new Date(), // We don't have original createdAt
      updatedAt: new Date(),
      version: 1,
      createdBy: updatedBy, // Legacy doesn't track this
      updatedBy: updatedBy,
      changeReason: reason
    };

    // Update via DataStore if we have the necessary info
    if (updates.ownerEntityId && updates.ownedEntityId && updates.shares) {
      const ownershipPercentage = (updates.shares / 100);
      try {
        this.legacyStore.updateOwnership(updates.ownerEntityId, updates.ownedEntityId, ownershipPercentage);
      } catch (error) {
        console.warn('Could not update ownership via DataStore:', error);
      }
    }

    this.emitEvent({
      type: 'OWNERSHIP_UPDATED',
      entityId: updatedOwnership.ownedEntityId,
      timestamp: new Date(),
      userId: updatedBy,
      data: updatedOwnership
    });

    return updatedOwnership;
  }

  async deleteOwnership(id: string, deletedBy: string, reason?: string): Promise<void> {
    // Since DataStore doesn't have direct ownership deletion by ID, we'll simulate
    this.emitEvent({
      type: 'OWNERSHIP_DELETED',
      entityId: '', // We don't have the entityId without the ownership object
      timestamp: new Date(),
      userId: deletedBy
    });
  }

  async getOwnership(id: string): Promise<UnifiedOwnership | null> {
    // DataStore doesn't have getOwnershipById, return null
    return null;
  }

  async getOwnershipsByEntity(entityId: string): Promise<UnifiedOwnership[]> {
    // Since DataStore doesn't have getOwnerships, we'll extract from cap tables
    const capTable = this.legacyStore.getCapTableByEntityId(entityId);
    if (!capTable) return [];

    // Convert cap table investments to unified ownerships
    return capTable.investments.map(investment => ({
      id: investment.id,
      ownerEntityId: investment.shareholderId,
      ownedEntityId: entityId,
      shares: investment.sharesOwned,
      shareClassId: investment.shareClass,
      effectiveDate: new Date(), // Default since not available
      expiryDate: undefined,
      createdAt: new Date(), // Default since not available
      updatedAt: new Date(),
      version: 1,
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

    const capTable = this.legacyStore.getCapTableByEntityId(entityId);
    if (!capTable) {
      return {
        entityId,
        entityName: entity.name,
        totalShares: 0,
        ownershipSummary: [],
        shareClasses: [],
        lastUpdated: new Date()
      };
    }

    const ownershipSummary = capTable.investments.map(investment => {
      const shareholder = this.legacyStore.getShareholders().find(s => s.id === investment.shareholderId);
      return {
        ownershipId: investment.id,
        ownerEntityId: investment.shareholderId,
        ownerName: shareholder?.name || 'Unknown',
        shares: investment.sharesOwned,
        shareClassName: investment.shareClass,
        effectiveDate: new Date(), // Default since not available
        percentage: 0 // Calculated below
      };
    });

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
    const allCapTables = this.legacyStore.getCapTables();

    // Find root entities (entities that are not owned by anyone)
    const ownedEntityIds = new Set(allCapTables.map(ct => ct.entityId));
    const rootEntities = entities.filter(e => !ownedEntityIds.has(e.id));

    const buildNode = (entity: Entity): EntityNode => {
      const capTable = this.legacyStore.getCapTableByEntityId(entity.id);
      const children: EntityNode[] = [];
      
      if (capTable) {
        // Find entities this entity owns
        capTable.investments.forEach(investment => {
          const shareholder = this.legacyStore.getShareholders().find(s => s.id === investment.shareholderId);
          if (shareholder?.entityId) {
            const childEntity = entities.find(e => e.id === shareholder.entityId);
            if (childEntity) {
              children.push(buildNode(childEntity));
            }
          }
        });
      }

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
    const capTable = this.legacyStore.getCapTableByEntityId(entityId);
    const hasInvestments = capTable && capTable.investments.length > 0;
    
    if (hasInvestments) {
      return {
        isValid: false,
        errors: [{
          code: 'ENTITY_HAS_RELATIONSHIPS',
          message: `Cannot delete entity - it has ${capTable!.investments.length} ownership relationships`,
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
