
// PHASE 1: Enterprise Data Store Interface Definitions
// This defines the contract for the new enterprise-grade data store

import { Entity, ShareClass } from './entity';
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
} from './unified';

export interface IEnterpriseDataStore {
  // Entity Management with Audit
  createEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt' | 'version'>, createdBy: string, reason?: string): Promise<Entity>;
  updateEntity(id: string, updates: Partial<Entity>, updatedBy: string, reason: string): Promise<Entity>;
  deleteEntity(id: string, deletedBy: string, reason: string): Promise<void>;
  getEntity(id: string): Promise<Entity | null>;
  searchEntities(query: EntitySearchQuery): Promise<Entity[]>;
  getAllEntities(): Promise<Entity[]>;

  // Ownership Management (Single Source of Truth)
  createOwnership(ownership: Omit<UnifiedOwnership, 'id' | 'createdAt' | 'updatedAt' | 'version'>, createdBy: string): Promise<UnifiedOwnership>;
  updateOwnership(id: string, updates: Partial<UnifiedOwnership>, updatedBy: string, reason: string): Promise<UnifiedOwnership>;
  deleteOwnership(id: string, deletedBy: string, reason: string): Promise<void>;
  getOwnership(id: string): Promise<UnifiedOwnership | null>;
  queryOwnerships(query: OwnershipQuery): Promise<UnifiedOwnership[]>;
  getOwnershipsByEntity(entityId: string): Promise<UnifiedOwnership[]>;

  // Share Class Management
  createShareClass(shareClass: Omit<ShareClass, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<ShareClass>;
  updateShareClass(id: string, updates: Partial<ShareClass>, updatedBy: string, reason: string): Promise<ShareClass>;
  deleteShareClass(id: string, deletedBy: string, reason: string): Promise<void>;
  getShareClass(id: string): Promise<ShareClass | null>;
  getShareClassesByEntity(entityId: string): Promise<ShareClass[]>;

  // Computed Views (Always Fresh from Source Data)
  getCapTableView(entityId: string): Promise<CapTableView | null>;
  getOwnershipHierarchy(): Promise<EntityNode[]>;
  getEntityOwnershipChain(entityId: string): Promise<EntityNode[]>;

  // Validation and Business Rules
  validateEntityDeletion(entityId: string): Promise<ValidationResult>;
  validateOwnershipChange(ownership: Partial<UnifiedOwnership>): Promise<ValidationResult>;
  validateShareClassDeletion(shareClassId: string): Promise<ValidationResult>;
  checkBusinessRules(entityId?: string): Promise<BusinessRuleViolation[]>;
  validateCircularOwnership(ownerEntityId: string, ownedEntityId: string): Promise<ValidationResult>;

  // Audit and Compliance
  getAuditTrail(entityId?: string, fromDate?: Date, toDate?: Date): Promise<AuditEntry[]>;
  getChangeHistory(entityId: string, entityType: 'ENTITY' | 'OWNERSHIP' | 'SHARE_CLASS'): Promise<AuditEntry[]>;
  exportAuditReport(fromDate: Date, toDate: Date): Promise<Blob>;

  // Transaction Management
  beginTransaction(userId: string): Promise<DataTransaction>;
  commitTransaction(transactionId: string): Promise<void>;
  rollbackTransaction(transactionId: string, reason: string): Promise<void>;
  getActiveTransactions(): Promise<DataTransaction[]>;

  // Data Migration and Backup
  migrateFromLegacySystem(backupFirst: boolean): Promise<MigrationResult>;
  createBackup(): Promise<string>; // Returns backup location/id
  restoreFromBackup(backupId: string): Promise<void>;
  validateDataIntegrity(): Promise<ValidationResult>;

  // Event Subscription (for UI updates)
  subscribe(callback: (event: DataStoreEvent) => void): () => void;
  unsubscribe(callback: (event: DataStoreEvent) => void): void;
}

// Event system for reactive UI updates
export interface DataStoreEvent {
  type: 'ENTITY_CREATED' | 'ENTITY_UPDATED' | 'ENTITY_DELETED' |
        'OWNERSHIP_CREATED' | 'OWNERSHIP_UPDATED' | 'OWNERSHIP_DELETED' |
        'SHARE_CLASS_CREATED' | 'SHARE_CLASS_UPDATED' | 'SHARE_CLASS_DELETED' |
        'VALIDATION_ERROR' | 'TRANSACTION_COMMITTED' | 'TRANSACTION_ROLLED_BACK';
  entityId: string;
  timestamp: Date;
  userId: string;
  data?: any;
  relatedEntityIds?: string[];
}

// Configuration for the enterprise data store
export interface EnterpriseDataStoreConfig {
  enableAuditLogging: boolean;
  enableTransactions: boolean;
  enableValidation: boolean;
  autoBackup: boolean;
  backupInterval: number; // minutes
  maxAuditRetention: number; // days
  enableCircularOwnershipDetection: boolean;
  strictValidation: boolean; // Block all invalid operations vs warnings
  enableRealTimeValidation: boolean;
}

// Error types for the enterprise system
export class EnterpriseDataError extends Error {
  constructor(
    message: string,
    public code: string,
    public entityId?: string,
    public validationErrors?: ValidationResult
  ) {
    super(message);
    this.name = 'EnterpriseDataError';
  }
}

export class ValidationError extends EnterpriseDataError {
  constructor(message: string, validationResult: ValidationResult, entityId?: string) {
    super(message, 'VALIDATION_FAILED', entityId, validationResult);
    this.name = 'ValidationError';
  }
}

export class CircularOwnershipError extends EnterpriseDataError {
  constructor(ownerEntityId: string, ownedEntityId: string) {
    super(
      `Circular ownership detected: ${ownerEntityId} → ${ownedEntityId}`,
      'CIRCULAR_OWNERSHIP',
      ownerEntityId
    );
    this.name = 'CircularOwnershipError';
  }
}

export class ReferentialIntegrityError extends EnterpriseDataError {
  constructor(message: string, entityId: string, relatedEntityIds: string[]) {
    super(message, 'REFERENTIAL_INTEGRITY_VIOLATION', entityId);
    this.name = 'ReferentialIntegrityError';
  }
}
