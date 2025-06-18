
// PHASE 1: Unified Data Model - Single Source of Truth
// This replaces the current dual entity/cap-table system

import { Entity, ShareClass } from './entity';

// Single unified ownership model (replaces both OwnershipRelationship and Investment)
export interface UnifiedOwnership {
  id: string;
  ownerEntityId: string;    // References Entity.id
  ownedEntityId: string;    // References Entity.id  
  shares: number;           // Source of truth for ownership
  shareClassId: string;     // References ShareClass.id
  effectiveDate: Date;
  expiryDate?: Date;
  
  // Audit fields
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
  version: number;
  changeReason?: string;
}

// Audit trail for legal compliance
export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;           // Who made the change
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'ENTITY' | 'OWNERSHIP' | 'SHARE_CLASS';
  entityId: string;         // What was changed
  relatedEntityIds?: string[]; // Related entities affected
  previousState?: any;      // Before state (for rollback)
  newState?: any;          // After state
  changeReason?: string;    // Why the change was made
  validationsPassed: string[]; // What validations were checked
}

// Validation system
export interface ValidationError {
  code: string;
  message: string;
  field: string;
  relatedEntityId?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// Business rules for data integrity
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

// Computed views (always fresh from source data)
export interface ShareClassSummary {
  id: string;
  name: string;
  className?: string; // Alternative name field
  type: string;
  authorizedShares: number;
  issuedShares: number;
  votingRights: boolean;
  pricePerShare?: number; // Price information
  price?: number; // Alternative price field
}

export interface OwnershipSummary {
  ownershipId: string;
  ownerEntityId: string;
  ownerName: string;
  shares: number;
  shareClassName: string;
  effectiveDate: Date;
  percentage: number;
  pricePerShare?: number; // Add price information
}

export interface CapTableView {
  entityId: string;
  entityName: string;
  totalShares: number;
  authorizedShares?: number; // Add authorized shares
  ownershipSummary: OwnershipSummary[];
  shareClasses: ShareClassSummary[];
  lastUpdated: Date;
}

export interface EntityNode {
  entityId: string;
  entityName: string;
  entityType: string;
  children: EntityNode[];
  totalOwnedEntities: number;
}

// Transaction management
export interface DataTransaction {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  operations: TransactionOperation[];
  status: 'PENDING' | 'COMMITTED' | 'ROLLED_BACK';
}

export interface TransactionOperation {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'ENTITY' | 'OWNERSHIP' | 'SHARE_CLASS';
  entityId: string;
  data: any;
}

// Migration support
export interface MigrationResult {
  success: boolean;
  backupLocation?: string;
  entitiesMigrated: number;
  ownershipsMigrated: number;
  shareClassesMigrated: number;
  errors: string[];
  duration: number;
}

// Query interfaces
export interface EntitySearchQuery {
  name?: string;
  type?: string;
  jurisdiction?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface OwnershipQuery {
  ownerEntityId?: string;
  ownedEntityId?: string;
  shareClassId?: string;
  effectiveAfter?: Date;
  effectiveBefore?: Date;
  minShares?: number;
  maxShares?: number;
}
