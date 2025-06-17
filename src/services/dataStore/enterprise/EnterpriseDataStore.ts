
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
  BusinessRuleViolation
} from '@/types/unified';
import { 
  IEnterpriseDataStore, 
  EnterpriseDataStoreConfig,
  ValidationError
} from '@/types/enterprise';

import { EntityManager } from './EntityManager';
import { OwnershipManager } from './OwnershipManager';
import { ShareClassManager } from './ShareClassManager';
import { ViewManager } from './ViewManager';
import { TransactionManager } from './TransactionManager';
import { BackupManager } from './BackupManager';
import { AuditManager } from './AuditManager';

export class EnterpriseDataStore implements IEnterpriseDataStore {
  private entityManager: EntityManager;
  private ownershipManager: OwnershipManager;
  private shareClassManager: ShareClassManager;
  private transactionManager: TransactionManager;
  private backupManager: BackupManager;
  private auditManager: AuditManager;
  private config: EnterpriseDataStoreConfig;

  constructor(config: EnterpriseDataStoreConfig) {
    this.config = config;
    this.entityManager = new EntityManager(config);
    this.ownershipManager = new OwnershipManager(config);
    this.shareClassManager = new ShareClassManager(config);
    this.transactionManager = new TransactionManager();
    this.backupManager = new BackupManager();
    this.auditManager = new AuditManager();
    
    console.log('🏢 EnterpriseDataStore initialized with config:', config);
  }

  // Entity Management with Audit
  async createEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt' | 'version'>, createdBy: string, reason?: string): Promise<Entity> {
    return this.entityManager.createEntity(entity, createdBy, reason);
  }

  async updateEntity(id: string, updates: Partial<Entity>, updatedBy: string, reason: string): Promise<Entity> {
    return this.entityManager.updateEntity(id, updates, updatedBy, reason);
  }

  async deleteEntity(id: string, deletedBy: string, reason: string): Promise<void> {
    // Validation - check if entity can be safely deleted
    const validationResult = await this.validateEntityDeletion(id);
    if (!validationResult.isValid) {
      throw new ValidationError('Entity deletion validation failed', validationResult, id);
    }

    return this.entityManager.deleteEntity(id, deletedBy, reason);
  }

  async getEntity(id: string): Promise<Entity | null> {
    return this.entityManager.getEntity(id);
  }

  async searchEntities(query: EntitySearchQuery): Promise<Entity[]> {
    return this.entityManager.searchEntities(query);
  }

  async getAllEntities(): Promise<Entity[]> {
    return this.entityManager.getAllEntities();
  }

  // Ownership Management (Single Source of Truth)
  async createOwnership(ownership: Omit<UnifiedOwnership, 'id' | 'createdAt' | 'updatedAt' | 'version'>, createdBy: string): Promise<UnifiedOwnership> {
    const entities = await this.getAllEntities();
    const shareClasses = await this.shareClassManager.exportShareClasses();
    
    // Additional validation with current data
    const validationResult = await this.ownershipManager.validateOwnershipChange(ownership, entities, shareClasses.map(([_, sc]) => sc));
    if (this.config.enableValidation && !validationResult.isValid) {
      throw new ValidationError('Ownership creation validation failed', validationResult);
    }

    return this.ownershipManager.createOwnership(ownership, createdBy);
  }

  async updateOwnership(id: string, updates: Partial<UnifiedOwnership>, updatedBy: string, reason: string): Promise<UnifiedOwnership> {
    return this.ownershipManager.updateOwnership(id, updates, updatedBy, reason);
  }

  async deleteOwnership(id: string, deletedBy: string, reason: string): Promise<void> {
    return this.ownershipManager.deleteOwnership(id, deletedBy, reason);
  }

  async getOwnership(id: string): Promise<UnifiedOwnership | null> {
    return this.ownershipManager.getOwnership(id);
  }

  async queryOwnerships(query: OwnershipQuery): Promise<UnifiedOwnership[]> {
    return this.ownershipManager.queryOwnerships(query);
  }

  async getOwnershipsByEntity(entityId: string): Promise<UnifiedOwnership[]> {
    return this.ownershipManager.getOwnershipsByEntity(entityId);
  }

  // Share Class Management
  async createShareClass(shareClass: Omit<ShareClass, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<ShareClass> {
    return this.shareClassManager.createShareClass(shareClass, createdBy);
  }

  async updateShareClass(id: string, updates: Partial<ShareClass>, updatedBy: string, reason: string): Promise<ShareClass> {
    return this.shareClassManager.updateShareClass(id, updates, updatedBy, reason);
  }

  async deleteShareClass(id: string, deletedBy: string, reason: string): Promise<void> {
    const ownerships = this.ownershipManager.exportOwnerships();
    return this.shareClassManager.deleteShareClass(id, deletedBy, reason, ownerships.map(([_, o]) => o));
  }

  async getShareClass(id: string): Promise<ShareClass | null> {
    return this.shareClassManager.getShareClass(id);
  }

  async getShareClassesByEntity(entityId: string): Promise<ShareClass[]> {
    return this.shareClassManager.getShareClassesByEntity(entityId);
  }

  // Computed Views (Always Fresh from Source Data)
  async getCapTableView(entityId: string): Promise<CapTableView | null> {
    const entities = new Map(this.entityManager.exportEntities());
    const ownerships = new Map(this.ownershipManager.exportOwnerships());
    const shareClasses = new Map(this.shareClassManager.exportShareClasses());
    
    return ViewManager.getCapTableView(entityId, entities, ownerships, shareClasses);
  }

  async getOwnershipHierarchy(): Promise<EntityNode[]> {
    const entities = new Map(this.entityManager.exportEntities());
    const ownerships = new Map(this.ownershipManager.exportOwnerships());
    
    return ViewManager.getOwnershipHierarchy(entities, ownerships);
  }

  async getEntityOwnershipChain(entityId: string): Promise<EntityNode[]> {
    const entities = new Map(this.entityManager.exportEntities());
    const ownerships = new Map(this.ownershipManager.exportOwnerships());
    
    return ViewManager.getEntityOwnershipChain(entityId, entities, ownerships);
  }

  // Validation and Business Rules
  async validateEntityDeletion(entityId: string): Promise<ValidationResult> {
    const ownerships = this.ownershipManager.exportOwnerships().map(([_, o]) => o);
    
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
    const entities = await this.getAllEntities();
    const shareClasses = this.shareClassManager.exportShareClasses().map(([_, sc]) => sc);
    
    return this.ownershipManager.validateOwnershipChange(ownership, entities, shareClasses);
  }

  async validateShareClassDeletion(shareClassId: string): Promise<ValidationResult> {
    const ownerships = this.ownershipManager.exportOwnerships().map(([_, o]) => o);
    return this.shareClassManager.validateShareClassDeletion(shareClassId, ownerships);
  }

  async checkBusinessRules(entityId?: string): Promise<BusinessRuleViolation[]> {
    // Implementation placeholder - would check all business rules
    return [];
  }

  async validateCircularOwnership(ownerEntityId: string, ownedEntityId: string): Promise<ValidationResult> {
    const entities = await this.getAllEntities();
    const shareClasses = this.shareClassManager.exportShareClasses().map(([_, sc]) => sc);
    
    return this.ownershipManager.validateCircularOwnership(ownerEntityId, ownedEntityId, entities, shareClasses);
  }

  // Audit and Compliance
  async getAuditTrail(entityId?: string, fromDate?: Date, toDate?: Date): Promise<AuditEntry[]> {
    return this.auditManager.getAuditTrail(entityId, fromDate, toDate);
  }

  async getChangeHistory(entityId: string, entityType: 'ENTITY' | 'OWNERSHIP' | 'SHARE_CLASS'): Promise<AuditEntry[]> {
    return this.auditManager.getChangeHistory(entityId, entityType);
  }

  async exportAuditReport(fromDate: Date, toDate: Date): Promise<Blob> {
    return this.auditManager.exportAuditReport(fromDate, toDate);
  }

  // Transaction Management
  async beginTransaction(userId: string): Promise<DataTransaction> {
    return this.transactionManager.beginTransaction(userId);
  }

  async commitTransaction(transactionId: string): Promise<void> {
    return this.transactionManager.commitTransaction(transactionId);
  }

  async rollbackTransaction(transactionId: string, reason: string): Promise<void> {
    return this.transactionManager.rollbackTransaction(transactionId, reason);
  }

  async getActiveTransactions(): Promise<DataTransaction[]> {
    return this.transactionManager.getActiveTransactions();
  }

  // Data Migration and Backup
  async migrateFromLegacySystem(backupFirst: boolean): Promise<MigrationResult> {
    return this.backupManager.migrateFromLegacySystem(backupFirst);
  }

  async createBackup(): Promise<string> {
    const entities = this.entityManager.exportEntities();
    const ownerships = this.ownershipManager.exportOwnerships();
    const shareClasses = this.shareClassManager.exportShareClasses();
    const auditLog = this.auditManager.exportAuditLog();
    
    return this.backupManager.createBackup(entities, ownerships, shareClasses, auditLog);
  }

  async restoreFromBackup(backupId: string): Promise<void> {
    const data = await this.backupManager.restoreFromBackup(backupId);
    
    this.entityManager.restoreEntities(data.entities);
    this.ownershipManager.restoreOwnerships(data.ownerships);
    this.shareClassManager.restoreShareClasses(data.shareClasses);
    this.auditManager.restoreAuditLog(data.auditLog);

    console.log('📥 EnterpriseDataStore: Restored from backup', backupId);
  }

  async validateDataIntegrity(): Promise<ValidationResult> {
    const errors: ValidationResult['errors'] = [];
    const entities = new Map(this.entityManager.exportEntities());
    const ownerships = this.ownershipManager.exportOwnerships().map(([_, o]) => o);
    const shareClasses = new Map(this.shareClassManager.exportShareClasses());

    // Check referential integrity
    for (const ownership of ownerships) {
      if (!entities.has(ownership.ownerEntityId)) {
        errors.push({
          code: 'INVALID_OWNER_REFERENCE',
          message: `Ownership ${ownership.id} references non-existent owner entity ${ownership.ownerEntityId}`,
          field: 'ownerEntityId'
        });
      }

      if (!entities.has(ownership.ownedEntityId)) {
        errors.push({
          code: 'INVALID_OWNED_REFERENCE',
          message: `Ownership ${ownership.id} references non-existent owned entity ${ownership.ownedEntityId}`,
          field: 'ownedEntityId'
        });
      }

      if (!shareClasses.has(ownership.shareClassId)) {
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
  subscribe(callback: (event: any) => void): () => void {
    // Delegate to entity manager since it extends BaseEnterpriseStore
    return this.entityManager.subscribe(callback);
  }

  unsubscribe(callback: (event: any) => void): void {
    this.entityManager.unsubscribe(callback);
  }
}
