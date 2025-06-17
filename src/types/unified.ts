
// PHASE 1: New Unified Data Models for Enterprise Architecture
// This file defines the new unified data model that will replace the current dual system

export interface UnifiedOwnership {
  id: string;
  ownerEntityId: string;    // References Entity.id - who owns
  ownedEntityId: string;    // References Entity.id - what is owned  
  shares: number;           // Source of truth for ownership amount
  shareClassId: string;     // References ShareClass.id
  effectiveDate: Date;      // When ownership became effective
  expiryDate?: Date;        // Optional expiry for time-bound ownership
  
  // Audit fields for legal compliance
  createdBy: string;        // User who created this ownership
  createdAt: Date;
  updatedBy: string;        // User who last updated this
  updatedAt: Date;
  version: number;          // For optimistic locking
  changeReason?: string;    // Why this change was made
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;           // Who made the change
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'ENTITY' | 'OWNERSHIP' | 'SHARE_CLASS';
  entityId: string;         // What was changed
  relatedEntityIds?: string[]; // Related entities affected
  previousState?: any;      // Before state (for rollback capability)
  newState?: any;          // After state
  changeReason?: string;    // Why the change was made
  validationsPassed: string[]; // What validations were checked
  ipAddress?: string;       // For security audit
  userAgent?: string;       // Browser/client info
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  relatedEntityId?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
}

// Computed view types - these are generated from the unified ownership data
export interface CapTableView {
  entityId: string;
  entityName: string;
  authorizedShares: number;
  totalIssuedShares: number;
  availableShares: number;
  shareClasses: ShareClassSummary[];
  ownerships: OwnershipSummary[];
  lastUpdated: Date;
  calculatedAt: Date; // When this view was computed
}

export interface ShareClassSummary {
  id: string;
  name: string;
  type: string;
  authorizedShares: number;
  issuedShares: number;
  votingRights: boolean;
  liquidationPreference?: number;
  dividendRate?: number;
}

export interface OwnershipSummary {
  ownershipId: string;
  ownerEntityId: string;
  ownerName: string;
  ownerType: string;
  shares: number;
  percentage: number;        // Calculated as shares / totalIssuedShares
  fullyDilutedPercentage: number; // Calculated as shares / authorizedShares
  shareClassId: string;
  shareClassName: string;
  effectiveDate: Date;
  expiryDate?: Date;
}

// Hierarchy view for ownership chain visualization
export interface EntityNode {
  entityId: string;
  entityName: string;
  entityType: string;
  level: number;            // Hierarchy level (0 = root entities)
  parentOwners: string[];   // Entity IDs that own this entity
  childEntities: string[];  // Entity IDs that this entity owns
  totalShares: number;
  ownedShares: number;      // How many shares this entity holds in others
}

// Transaction support for atomic operations
export interface DataTransaction {
  id: string;
  userId: string;
  startedAt: Date;
  operations: TransactionOperation[];
  status: 'PENDING' | 'COMMITTED' | 'ROLLED_BACK';
  completedAt?: Date;
  rollbackReason?: string;
}

export interface TransactionOperation {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'ENTITY' | 'OWNERSHIP' | 'SHARE_CLASS';
  entityId: string;
  previousState?: any;
  newState?: any;
  order: number; // Execution order within transaction
}

// Migration types for converting from old system
export interface MigrationResult {
  success: boolean;
  entitiesMigrated: number;
  ownershipsMigrated: number;
  shareClassesMigrated: number;
  conflictsFound: MigrationConflict[];
  warnings: string[];
  backupLocation: string;
}

export interface MigrationConflict {
  type: 'OWNERSHIP_MISMATCH' | 'MISSING_ENTITY' | 'INVALID_SHARES' | 'CIRCULAR_OWNERSHIP';
  description: string;
  oldSystemData: any;
  suggestedResolution: string;
  affectedEntityIds: string[];
}

// Business rule validation types
export type BusinessRule = 
  | 'NO_CIRCULAR_OWNERSHIP'
  | 'NO_OVER_ALLOCATION'
  | 'OWNER_ENTITY_EXISTS'
  | 'OWNED_ENTITY_EXISTS'
  | 'SHARE_CLASS_EXISTS'
  | 'NO_ORPHANED_ENTITIES'
  | 'POSITIVE_SHARES_ONLY'
  | 'FUTURE_EFFECTIVE_DATE_ALLOWED';

export interface BusinessRuleViolation {
  rule: BusinessRule;
  severity: 'ERROR' | 'WARNING';
  message: string;
  affectedEntities: string[];
  suggestedAction: string;
}

// Search and query types for the new system
export interface OwnershipQuery {
  ownerEntityId?: string;
  ownedEntityId?: string;
  shareClassId?: string;
  minShares?: number;
  maxShares?: number;
  effectiveAfter?: Date;
  effectiveBefore?: Date;
  includeExpired?: boolean;
}

export interface EntitySearchQuery {
  name?: string;
  type?: string;
  jurisdiction?: string;
  hasOwnerships?: boolean;
  isOwned?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}
