
import { Entity, ShareClass } from '@/types/entity';
import { 
  UnifiedOwnership, 
  AuditEntry, 
  ValidationResult, 
  CapTableView, 
  EntityNode, 
  DataTransaction,
  MigrationResult,
  OwnershipQuery,
  EntitySearchQuery,
  BusinessRuleViolation,
  ShareClassSummary
} from '@/types/unified';
import { 
  IEnterpriseDataStore, 
  DataStoreEvent, 
  EnterpriseDataStoreConfig,
  EnterpriseDataError,
  ValidationError,
  CircularOwnershipError,
  ReferentialIntegrityError
} from '@/types/enterprise';
import { BusinessRuleEngine, ValidationContext } from '../validation/BusinessRules';

export class EnterpriseDataStore implements IEnterpriseDataStore {
  private entities: Map<string, Entity> = new Map();
  private ownerships: Map<string, UnifiedOwnership> = new Map();
  private shareClasses: Map<string, ShareClass> = new Map();
  private auditLog: AuditEntry[] = [];
  private transactions: Map<string, DataTransaction> = new Map();
  private eventListeners: ((event: DataStoreEvent) => void)[] = [];
  private businessRules: BusinessRuleEngine;
  private config: EnterpriseDataStoreConfig;

  constructor(config: EnterpriseDataStoreConfig) {
    this.config = config;
    this.businessRules = new BusinessRuleEngine();
    
    console.log('🏢 EnterpriseDataStore initialized with config:', config);
  }

  // Entity Management with Audit
  async createEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt' | 'version'>, createdBy: string, reason?: string): Promise<Entity> {
    const id = `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newEntity: Entity = {
      ...entity,
      id,
      createdAt: now,
      updatedAt: now,
      version: 1
    };

    // Validation
    if (this.config.enableValidation) {
      const validationResult = await this.validateEntityCreation(newEntity);
      if (!validationResult.isValid) {
        throw new ValidationError('Entity creation validation failed', validationResult, id);
      }
    }

    // Store entity
    this.entities.set(id, newEntity);

    // Create audit entry
    if (this.config.enableAuditLogging) {
      await this.createAuditEntry({
        action: 'CREATE',
        entityType: 'ENTITY',
        entityId: id,
        userId: createdBy,
        newState: newEntity,
        changeReason: reason
      });
    }

    // Emit event
    this.emitEvent({
      type: 'ENTITY_CREATED',
      entityId: id,
      timestamp: now,
      userId: createdBy,
      data: newEntity
    });

    console.log('✅ EnterpriseDataStore: Created entity', newEntity.name, id);
    return newEntity;
  }

  async updateEntity(id: string, updates: Partial<Entity>, updatedBy: string, reason: string): Promise<Entity> {
    const existingEntity = this.entities.get(id);
    if (!existingEntity) {
      throw new EnterpriseDataError(`Entity ${id} not found`, 'ENTITY_NOT_FOUND', id);
    }

    const previousState = { ...existingEntity };
    const updatedEntity: Entity = {
      ...existingEntity,
      ...updates,
      id, // Ensure ID cannot be changed
      updatedAt: new Date(),
      version: existingEntity.version + 1
    };

    // Validation
    if (this.config.enableValidation) {
      const validationResult = await this.validateEntityUpdate(id, updates);
      if (!validationResult.isValid) {
        throw new ValidationError('Entity update validation failed', validationResult, id);
      }
    }

    // Store updated entity
    this.entities.set(id, updatedEntity);

    // Create audit entry
    if (this.config.enableAuditLogging) {
      await this.createAuditEntry({
        action: 'UPDATE',
        entityType: 'ENTITY',
        entityId: id,
        userId: updatedBy,
        previousState,
        newState: updatedEntity,
        changeReason: reason
      });
    }

    // Emit event
    this.emitEvent({
      type: 'ENTITY_UPDATED',
      entityId: id,
      timestamp: new Date(),
      userId: updatedBy,
      data: updatedEntity
    });

    console.log('✅ EnterpriseDataStore: Updated entity', updatedEntity.name, id);
    return updatedEntity;
  }

  async deleteEntity(id: string, deletedBy: string, reason: string): Promise<void> {
    const entity = this.entities.get(id);
    if (!entity) {
      throw new EnterpriseDataError(`Entity ${id} not found`, 'ENTITY_NOT_FOUND', id);
    }

    // Validation - check if entity can be safely deleted
    const validationResult = await this.validateEntityDeletion(id);
    if (!validationResult.isValid) {
      throw new ValidationError('Entity deletion validation failed', validationResult, id);
    }

    const previousState = { ...entity };

    // Delete entity
    this.entities.delete(id);

    // Create audit entry
    if (this.config.enableAuditLogging) {
      await this.createAuditEntry({
        action: 'DELETE',
        entityType: 'ENTITY',
        entityId: id,
        userId: deletedBy,
        previousState,
        changeReason: reason
      });
    }

    // Emit event
    this.emitEvent({
      type: 'ENTITY_DELETED',
      entityId: id,
      timestamp: new Date(),
      userId: deletedBy
    });

    console.log('✅ EnterpriseDataStore: Deleted entity', entity.name, id);
  }

  async getEntity(id: string): Promise<Entity | null> {
    return this.entities.get(id) || null;
  }

  async searchEntities(query: EntitySearchQuery): Promise<Entity[]> {
    const entities = Array.from(this.entities.values());
    
    let filtered = entities;
    
    if (query.name) {
      filtered = filtered.filter(e => 
        e.name.toLowerCase().includes(query.name!.toLowerCase())
      );
    }
    
    if (query.type) {
      filtered = filtered.filter(e => e.type === query.type);
    }
    
    if (query.jurisdiction) {
      filtered = filtered.filter(e => 
        e.jurisdiction?.toLowerCase().includes(query.jurisdiction!.toLowerCase())
      );
    }

    return filtered;
  }

  async getAllEntities(): Promise<Entity[]> {
    return Array.from(this.entities.values());
  }

  // Ownership Management (Single Source of Truth)
  async createOwnership(ownership: Omit<UnifiedOwnership, 'id' | 'createdAt' | 'updatedAt' | 'version'>, createdBy: string): Promise<UnifiedOwnership> {
    const id = `ownership-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newOwnership: UnifiedOwnership = {
      ...ownership,
      id,
      createdBy,
      createdAt: now,
      updatedBy: createdBy,
      updatedAt: now,
      version: 1
    };

    // Validation
    if (this.config.enableValidation) {
      const validationResult = await this.validateOwnershipChange(newOwnership);
      if (!validationResult.isValid) {
        throw new ValidationError('Ownership creation validation failed', validationResult, id);
      }
    }

    // Store ownership
    this.ownerships.set(id, newOwnership);

    // Create audit entry
    if (this.config.enableAuditLogging) {
      await this.createAuditEntry({
        action: 'CREATE',
        entityType: 'OWNERSHIP',
        entityId: id,
        userId: createdBy,
        newState: newOwnership,
        relatedEntityIds: [newOwnership.ownerEntityId, newOwnership.ownedEntityId]
      });
    }

    // Emit event
    this.emitEvent({
      type: 'OWNERSHIP_CREATED',
      entityId: newOwnership.ownedEntityId,
      timestamp: now,
      userId: createdBy,
      data: newOwnership,
      relatedEntityIds: [newOwnership.ownerEntityId, newOwnership.ownedEntityId]
    });

    console.log('✅ EnterpriseDataStore: Created ownership', id);
    return newOwnership;
  }

  async updateOwnership(id: string, updates: Partial<UnifiedOwnership>, updatedBy: string, reason: string): Promise<UnifiedOwnership> {
    const existingOwnership = this.ownerships.get(id);
    if (!existingOwnership) {
      throw new EnterpriseDataError(`Ownership ${id} not found`, 'OWNERSHIP_NOT_FOUND', id);
    }

    const previousState = { ...existingOwnership };
    const updatedOwnership: UnifiedOwnership = {
      ...existingOwnership,
      ...updates,
      id, // Ensure ID cannot be changed
      updatedBy,
      updatedAt: new Date(),
      version: existingOwnership.version + 1
    };

    // Validation
    if (this.config.enableValidation) {
      const validationResult = await this.validateOwnershipChange(updatedOwnership);
      if (!validationResult.isValid) {
        throw new ValidationError('Ownership update validation failed', validationResult, id);
      }
    }

    // Store updated ownership
    this.ownerships.set(id, updatedOwnership);

    // Create audit entry
    if (this.config.enableAuditLogging) {
      await this.createAuditEntry({
        action: 'UPDATE',
        entityType: 'OWNERSHIP',
        entityId: id,
        userId: updatedBy,
        previousState,
        newState: updatedOwnership,
        changeReason: reason,
        relatedEntityIds: [updatedOwnership.ownerEntityId, updatedOwnership.ownedEntityId]
      });
    }

    // Emit event
    this.emitEvent({
      type: 'OWNERSHIP_UPDATED',
      entityId: updatedOwnership.ownedEntityId,
      timestamp: new Date(),
      userId: updatedBy,
      data: updatedOwnership,
      relatedEntityIds: [updatedOwnership.ownerEntityId, updatedOwnership.ownedEntityId]
    });

    console.log('✅ EnterpriseDataStore: Updated ownership', id);
    return updatedOwnership;
  }

  async deleteOwnership(id: string, deletedBy: string, reason: string): Promise<void> {
    const ownership = this.ownerships.get(id);
    if (!ownership) {
      throw new EnterpriseDataError(`Ownership ${id} not found`, 'OWNERSHIP_NOT_FOUND', id);
    }

    const previousState = { ...ownership };

    // Delete ownership
    this.ownerships.delete(id);

    // Create audit entry
    if (this.config.enableAuditLogging) {
      await this.createAuditEntry({
        action: 'DELETE',
        entityType: 'OWNERSHIP',
        entityId: id,
        userId: deletedBy,
        previousState,
        changeReason: reason,
        relatedEntityIds: [ownership.ownerEntityId, ownership.ownedEntityId]
      });
    }

    // Emit event
    this.emitEvent({
      type: 'OWNERSHIP_DELETED',
      entityId: ownership.ownedEntityId,
      timestamp: new Date(),
      userId: deletedBy,
      relatedEntityIds: [ownership.ownerEntityId, ownership.ownedEntityId]
    });

    console.log('✅ EnterpriseDataStore: Deleted ownership', id);
  }

  async getOwnership(id: string): Promise<UnifiedOwnership | null> {
    return this.ownerships.get(id) || null;
  }

  async queryOwnerships(query: OwnershipQuery): Promise<UnifiedOwnership[]> {
    const ownerships = Array.from(this.ownerships.values());
    
    let filtered = ownerships;
    
    if (query.ownerEntityId) {
      filtered = filtered.filter(o => o.ownerEntityId === query.ownerEntityId);
    }
    
    if (query.ownedEntityId) {
      filtered = filtered.filter(o => o.ownedEntityId === query.ownedEntityId);
    }
    
    if (query.shareClassId) {
      filtered = filtered.filter(o => o.shareClassId === query.shareClassId);
    }

    return filtered;
  }

  async getOwnershipsByEntity(entityId: string): Promise<UnifiedOwnership[]> {
    return Array.from(this.ownerships.values()).filter(o => 
      o.ownerEntityId === entityId || o.ownedEntityId === entityId
    );
  }

  // Share Class Management
  async createShareClass(shareClass: Omit<ShareClass, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<ShareClass> {
    const id = `shareclass-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newShareClass: ShareClass = {
      ...shareClass,
      id,
      createdAt: now,
      updatedAt: now
    };

    // Store share class
    this.shareClasses.set(id, newShareClass);

    console.log('✅ EnterpriseDataStore: Created share class', newShareClass.name, id);
    return newShareClass;
  }

  async updateShareClass(id: string, updates: Partial<ShareClass>, updatedBy: string, reason: string): Promise<ShareClass> {
    const existingShareClass = this.shareClasses.get(id);
    if (!existingShareClass) {
      throw new EnterpriseDataError(`Share class ${id} not found`, 'SHARE_CLASS_NOT_FOUND', id);
    }

    const updatedShareClass: ShareClass = {
      ...existingShareClass,
      ...updates,
      id,
      updatedAt: new Date()
    };

    this.shareClasses.set(id, updatedShareClass);
    return updatedShareClass;
  }

  async deleteShareClass(id: string, deletedBy: string, reason: string): Promise<void> {
    const shareClass = this.shareClasses.get(id);
    if (!shareClass) {
      throw new EnterpriseDataError(`Share class ${id} not found`, 'SHARE_CLASS_NOT_FOUND', id);
    }

    // Validation - check if share class is referenced by any ownerships
    const referencingOwnerships = Array.from(this.ownerships.values())
      .filter(o => o.shareClassId === id);
    
    if (referencingOwnerships.length > 0) {
      throw new ReferentialIntegrityError(
        `Cannot delete share class ${id} - it is referenced by ${referencingOwnerships.length} ownership records`,
        id,
        referencingOwnerships.map(o => o.id)
      );
    }

    this.shareClasses.delete(id);
    console.log('✅ EnterpriseDataStore: Deleted share class', id);
  }

  async getShareClass(id: string): Promise<ShareClass | null> {
    return this.shareClasses.get(id) || null;
  }

  async getShareClassesByEntity(entityId: string): Promise<ShareClass[]> {
    return Array.from(this.shareClasses.values()).filter(sc => sc.entityId === entityId);
  }

  // Computed Views (Always Fresh from Source Data)
  async getCapTableView(entityId: string): Promise<CapTableView | null> {
    const entity = this.entities.get(entityId);
    if (!entity) return null;

    const ownerships = Array.from(this.ownerships.values())
      .filter(o => o.ownedEntityId === entityId);

    const shareClassEntries = Array.from(this.shareClasses.values())
      .filter(sc => sc.entityId === entityId);

    // Build share class summaries with issued shares calculation
    const shareClassSummaries: ShareClassSummary[] = shareClassEntries.map(sc => {
      const issuedShares = ownerships
        .filter(o => o.shareClassId === sc.id)
        .reduce((sum, o) => sum + o.shares, 0);
      
      return {
        id: sc.id,
        name: sc.name,
        type: sc.type,
        authorizedShares: sc.totalAuthorizedShares,
        issuedShares,
        votingRights: sc.votingRights
      };
    });

    // Calculate totals and build ownership summary
    const ownershipSummary = ownerships.map(ownership => {
      const owner = this.entities.get(ownership.ownerEntityId);
      const shareClass = this.shareClasses.get(ownership.shareClassId);
      
      return {
        ownershipId: ownership.id,
        ownerEntityId: ownership.ownerEntityId,
        ownerName: owner?.name || 'Unknown',
        shares: ownership.shares,
        shareClassName: shareClass?.name || 'Unknown',
        effectiveDate: ownership.effectiveDate,
        percentage: 0 // Will be calculated below
      };
    });

    const totalShares = ownerships.reduce((sum, o) => sum + o.shares, 0);
    
    // Calculate percentages
    ownershipSummary.forEach(summary => {
      summary.percentage = totalShares > 0 ? (summary.shares / totalShares) * 100 : 0;
    });

    return {
      entityId,
      entityName: entity.name,
      totalShares,
      ownershipSummary,
      shareClasses: shareClassSummaries,
      lastUpdated: new Date()
    };
  }

  async getOwnershipHierarchy(): Promise<EntityNode[]> {
    // Build hierarchy tree from ownership relationships
    const entities = Array.from(this.entities.values());
    const ownerships = Array.from(this.ownerships.values());

    // Find root entities (entities that are not owned by anyone)
    const ownedEntityIds = new Set(ownerships.map(o => o.ownedEntityId));
    const rootEntities = entities.filter(e => !ownedEntityIds.has(e.id));

    const buildNode = (entity: Entity): EntityNode => {
      const children = ownerships
        .filter(o => o.ownerEntityId === entity.id)
        .map(o => {
          const childEntity = this.entities.get(o.ownedEntityId);
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

  async getEntityOwnershipChain(entityId: string): Promise<EntityNode[]> {
    const chain: EntityNode[] = [];
    let currentEntityId = entityId;

    while (currentEntityId) {
      const entity = this.entities.get(currentEntityId);
      if (!entity) break;

      const owners = Array.from(this.ownerships.values())
        .filter(o => o.ownedEntityId === currentEntityId);

      const node: EntityNode = {
        entityId: entity.id,
        entityName: entity.name,
        entityType: entity.type,
        children: [],
        totalOwnedEntities: 0
      };

      chain.unshift(node);

      // Move up the chain (assuming single ownership for simplicity)
      currentEntityId = owners[0]?.ownerEntityId || '';
    }

    return chain;
  }

  // Validation and Business Rules
  async validateEntityDeletion(entityId: string): Promise<ValidationResult> {
    const ownerships = Array.from(this.ownerships.values());
    
    // Check if entity owns other entities
    const ownsOthers = ownerships.filter(o => o.ownerEntityId === entityId);
    if (ownsOthers.length > 0) {
      return {
        isValid: false,
        errors: [{
          code: 'ENTITY_OWNS_OTHERS',
          message: `Cannot delete entity - it owns ${ownsOthers.length} other entities`,
          field: 'entity'
        }],
        warnings: []
      };
    }

    // Check if entity is owned by others
    const ownedByOthers = ownerships.filter(o => o.ownedEntityId === entityId);
    if (ownedByOthers.length > 0) {
      return {
        isValid: false,
        errors: [{
          code: 'ENTITY_OWNED_BY_OTHERS',
          message: `Cannot delete entity - it is owned by ${ownedByOthers.length} other entities`,
          field: 'entity'
        }],
        warnings: []
      };
    }

    return { isValid: true, errors: [], warnings: [] };
  }

  async validateOwnershipChange(ownership: Partial<UnifiedOwnership>): Promise<ValidationResult> {
    if (!ownership.ownerEntityId || !ownership.ownedEntityId || !ownership.shareClassId || !ownership.shares) {
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

    const context: ValidationContext = {
      newOwnership: ownership as UnifiedOwnership,
      entities: Array.from(this.entities.values()),
      allOwnerships: Array.from(this.ownerships.values()),
      shareClasses: Array.from(this.shareClasses.values()),
      operation: 'CREATE'
    };

    return this.businessRules.validateAll(context);
  }

  async validateShareClassDeletion(shareClassId: string): Promise<ValidationResult> {
    const referencingOwnerships = Array.from(this.ownerships.values())
      .filter(o => o.shareClassId === shareClassId);
    
    if (referencingOwnerships.length > 0) {
      return {
        isValid: false,
        errors: [{
          code: 'SHARE_CLASS_IN_USE',
          message: `Cannot delete share class - it is used by ${referencingOwnerships.length} ownership records`,
          field: 'shareClass'
        }],
        warnings: []
      };
    }

    return { isValid: true, errors: [], warnings: [] };
  }

  async checkBusinessRules(entityId?: string): Promise<BusinessRuleViolation[]> {
    // Implementation placeholder - would check all business rules
    return [];
  }

  async validateCircularOwnership(ownerEntityId: string, ownedEntityId: string): Promise<ValidationResult> {
    const context: ValidationContext = {
      newOwnership: {
        id: 'temp',
        ownerEntityId,
        ownedEntityId,
        shares: 1,
        shareClassId: 'temp',
        effectiveDate: new Date(),
        createdBy: 'system',
        createdAt: new Date(),
        updatedBy: 'system',
        updatedAt: new Date(),
        version: 1
      },
      entities: Array.from(this.entities.values()),
      allOwnerships: Array.from(this.ownerships.values()),
      shareClasses: Array.from(this.shareClasses.values()),
      operation: 'CREATE'
    };

    const violations = this.businessRules.validateRule('NO_CIRCULAR_OWNERSHIP', context);
    
    if (violations.length > 0) {
      return {
        isValid: false,
        errors: violations.map(v => ({
          code: v.rule,
          message: v.message,
          field: 'ownership'
        })),
        warnings: []
      };
    }

    return { isValid: true, errors: [], warnings: [] };
  }

  // Helper methods for validation
  private async validateEntityCreation(entity: Entity): Promise<ValidationResult> {
    // Basic entity validation
    if (!entity.name?.trim()) {
      return {
        isValid: false,
        errors: [{
          code: 'INVALID_ENTITY_NAME',
          message: 'Entity name is required',
          field: 'name'
        }],
        warnings: []
      };
    }

    return { isValid: true, errors: [], warnings: [] };
  }

  private async validateEntityUpdate(id: string, updates: Partial<Entity>): Promise<ValidationResult> {
    if (updates.name !== undefined && !updates.name?.trim()) {
      return {
        isValid: false,
        errors: [{
          code: 'INVALID_ENTITY_NAME',
          message: 'Entity name cannot be empty',
          field: 'name'
        }],
        warnings: []
      };
    }

    return { isValid: true, errors: [], warnings: [] };
  }

  // Audit and Compliance
  async getAuditTrail(entityId?: string, fromDate?: Date, toDate?: Date): Promise<AuditEntry[]> {
    let filtered = [...this.auditLog];

    if (entityId) {
      filtered = filtered.filter(entry => 
        entry.entityId === entityId || 
        entry.relatedEntityIds?.includes(entityId)
      );
    }

    if (fromDate) {
      filtered = filtered.filter(entry => entry.timestamp >= fromDate);
    }

    if (toDate) {
      filtered = filtered.filter(entry => entry.timestamp <= toDate);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getChangeHistory(entityId: string, entityType: 'ENTITY' | 'OWNERSHIP' | 'SHARE_CLASS'): Promise<AuditEntry[]> {
    return this.auditLog.filter(entry => 
      entry.entityId === entityId && entry.entityType === entityType
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async exportAuditReport(fromDate: Date, toDate: Date): Promise<Blob> {
    const auditEntries = await this.getAuditTrail(undefined, fromDate, toDate);
    const reportData = {
      reportGenerated: new Date(),
      dateRange: { from: fromDate, to: toDate },
      totalEntries: auditEntries.length,
      entries: auditEntries
    };

    const jsonString = JSON.stringify(reportData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  // Transaction Management (simplified implementation)
  async beginTransaction(userId: string): Promise<DataTransaction> {
    const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transaction: DataTransaction = {
      id: transactionId,
      userId,
      startTime: new Date(),
      operations: [],
      status: 'PENDING'
    };

    this.transactions.set(transactionId, transaction);
    console.log('🔄 EnterpriseDataStore: Transaction started', transactionId);
    return transaction;
  }

  async commitTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new EnterpriseDataError(`Transaction ${transactionId} not found`, 'TRANSACTION_NOT_FOUND');
    }

    transaction.status = 'COMMITTED';
    transaction.endTime = new Date();

    console.log('✅ EnterpriseDataStore: Transaction committed', transactionId);
  }

  async rollbackTransaction(transactionId: string, reason: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new EnterpriseDataError(`Transaction ${transactionId} not found`, 'TRANSACTION_NOT_FOUND');
    }

    transaction.status = 'ROLLED_BACK';
    transaction.endTime = new Date();

    console.log('🔄 EnterpriseDataStore: Transaction rolled back', transactionId, reason);
  }

  async getActiveTransactions(): Promise<DataTransaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.status === 'PENDING');
  }

  // Data Migration and Backup (simplified implementation)
  async migrateFromLegacySystem(backupFirst: boolean): Promise<MigrationResult> {
    console.log('🔄 EnterpriseDataStore: Starting legacy system migration...');
    
    const startTime = new Date();
    let backupLocation = '';

    if (backupFirst) {
      backupLocation = await this.createBackup();
    }

    return {
      success: true,
      backupLocation,
      entitiesMigrated: 0,
      ownershipsMigrated: 0,
      shareClassesMigrated: 0,
      errors: [],
      duration: Date.now() - startTime.getTime()
    };
  }

  async createBackup(): Promise<string> {
    const backupId = `backup-${Date.now()}`;
    const backupData = {
      entities: Array.from(this.entities.entries()),
      ownerships: Array.from(this.ownerships.entries()),
      shareClasses: Array.from(this.shareClasses.entries()),
      auditLog: this.auditLog,
      timestamp: new Date()
    };

    // In a real implementation, this would save to external storage
    localStorage.setItem(`enterprise-backup-${backupId}`, JSON.stringify(backupData));
    console.log('💾 EnterpriseDataStore: Backup created', backupId);
    
    return backupId;
  }

  async restoreFromBackup(backupId: string): Promise<void> {
    const backupData = localStorage.getItem(`enterprise-backup-${backupId}`);
    if (!backupData) {
      throw new EnterpriseDataError(`Backup ${backupId} not found`, 'BACKUP_NOT_FOUND');
    }

    const data = JSON.parse(backupData);
    
    this.entities = new Map(data.entities);
    this.ownerships = new Map(data.ownerships);
    this.shareClasses = new Map(data.shareClasses);
    this.auditLog = data.auditLog || [];

    console.log('📥 EnterpriseDataStore: Restored from backup', backupId);
  }

  async validateDataIntegrity(): Promise<ValidationResult> {
    const errors: ValidationResult['errors'] = [];

    // Check referential integrity
    for (const ownership of this.ownerships.values()) {
      if (!this.entities.has(ownership.ownerEntityId)) {
        errors.push({
          code: 'INVALID_OWNER_REFERENCE',
          message: `Ownership ${ownership.id} references non-existent owner entity ${ownership.ownerEntityId}`,
          field: 'ownerEntityId'
        });
      }

      if (!this.entities.has(ownership.ownedEntityId)) {
        errors.push({
          code: 'INVALID_OWNED_REFERENCE',
          message: `Ownership ${ownership.id} references non-existent owned entity ${ownership.ownedEntityId}`,
          field: 'ownedEntityId'
        });
      }

      if (!this.shareClasses.has(ownership.shareClassId)) {
        errors.push({
          code: 'INVALID_SHARE_CLASS_REFERENCE',
          message: `Ownership ${ownership.id} references non-existent share class ${ownership.shareClassId}`,
          field: 'shareClassId'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  // Event Subscription (for UI updates)
  subscribe(callback: (event: DataStoreEvent) => void): () => void {
    this.eventListeners.push(callback);
    console.log('🔗 EnterpriseDataStore: New subscriber added, total:', this.eventListeners.length);
    
    return () => {
      this.eventListeners = this.eventListeners.filter(listener => listener !== callback);
      console.log('🔗 EnterpriseDataStore: Subscriber removed, total:', this.eventListeners.length);
    };
  }

  unsubscribe(callback: (event: DataStoreEvent) => void): void {
    this.eventListeners = this.eventListeners.filter(listener => listener !== callback);
  }

  // Private helper methods
  private emitEvent(event: DataStoreEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('❌ EnterpriseDataStore: Error in event listener:', error);
      }
    });
  }

  private async createAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp' | 'validationsPassed'>): Promise<AuditEntry> {
    const auditEntry: AuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      validationsPassed: [] // TODO: Track which validations were performed
    };

    this.auditLog.push(auditEntry);
    return auditEntry;
  }
}
