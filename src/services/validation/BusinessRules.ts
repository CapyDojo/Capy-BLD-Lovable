
// PHASE 1: Business Rule Validation Engine
// This defines the business rules that will protect data integrity

import { UnifiedOwnership, BusinessRule, BusinessRuleViolation, ValidationResult } from '@/types/unified';
import { Entity, ShareClass } from '@/types/entity';

export class BusinessRuleEngine {
  private rules: Map<BusinessRule, (context: ValidationContext) => BusinessRuleViolation[]> = new Map();

  constructor() {
    this.initializeRules();
  }

  private initializeRules() {
    this.rules.set('NO_CIRCULAR_OWNERSHIP', this.validateNoCircularOwnership.bind(this));
    this.rules.set('NO_OVER_ALLOCATION', this.validateNoOverAllocation.bind(this));
    this.rules.set('OWNER_ENTITY_EXISTS', this.validateOwnerEntityExists.bind(this));
    this.rules.set('OWNED_ENTITY_EXISTS', this.validateOwnedEntityExists.bind(this));
    this.rules.set('SHARE_CLASS_EXISTS', this.validateShareClassExists.bind(this));
    this.rules.set('NO_ORPHANED_ENTITIES', this.validateNoOrphanedEntities.bind(this));
    this.rules.set('POSITIVE_SHARES_ONLY', this.validatePositiveSharesOnly.bind(this));
    this.rules.set('FUTURE_EFFECTIVE_DATE_ALLOWED', this.validateEffectiveDate.bind(this));
  }

  validateAll(context: ValidationContext): ValidationResult {
    const violations: BusinessRuleViolation[] = [];
    const warnings: BusinessRuleViolation[] = [];

    for (const [rule, validator] of this.rules) {
      const ruleViolations = validator(context);
      ruleViolations.forEach(violation => {
        if (violation.severity === 'ERROR') {
          violations.push(violation);
        } else {
          warnings.push(violation);
        }
      });
    }

    return {
      isValid: violations.length === 0,
      errors: violations.map(v => ({
        code: v.rule,
        message: v.message,
        field: 'ownership',
        relatedEntityId: v.affectedEntities[0]
      })),
      warnings: warnings.map(v => ({
        code: v.rule,
        message: v.message,
        field: 'ownership'
      }))
    };
  }

  validateRule(rule: BusinessRule, context: ValidationContext): BusinessRuleViolation[] {
    const validator = this.rules.get(rule);
    if (!validator) {
      throw new Error(`Unknown business rule: ${rule}`);
    }
    return validator(context);
  }

  private validateNoCircularOwnership(context: ValidationContext): BusinessRuleViolation[] {
    const { newOwnership, allOwnerships } = context;
    if (!newOwnership) return [];

    // Build ownership graph
    const ownershipGraph = new Map<string, string[]>();
    
    // Add existing ownerships
    allOwnerships.forEach(ownership => {
      if (!ownershipGraph.has(ownership.ownerEntityId)) {
        ownershipGraph.set(ownership.ownerEntityId, []);
      }
      ownershipGraph.get(ownership.ownerEntityId)!.push(ownership.ownedEntityId);
    });

    // Add the new ownership we're testing
    if (!ownershipGraph.has(newOwnership.ownerEntityId)) {
      ownershipGraph.set(newOwnership.ownerEntityId, []);
    }
    ownershipGraph.get(newOwnership.ownerEntityId)!.push(newOwnership.ownedEntityId);

    // Check for cycles using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (entityId: string): boolean => {
      if (recursionStack.has(entityId)) {
        return true; // Found a cycle
      }
      if (visited.has(entityId)) {
        return false; // Already processed
      }

      visited.add(entityId);
      recursionStack.add(entityId);

      const ownedEntities = ownershipGraph.get(entityId) || [];
      for (const ownedEntityId of ownedEntities) {
        if (hasCycle(ownedEntityId)) {
          return true;
        }
      }

      recursionStack.delete(entityId);
      return false;
    };

    // Check if adding this ownership creates a cycle
    if (hasCycle(newOwnership.ownerEntityId)) {
      return [{
        rule: 'NO_CIRCULAR_OWNERSHIP',
        severity: 'ERROR',
        message: `Creating this ownership would result in circular ownership: ${newOwnership.ownerEntityId} would eventually own itself`,
        affectedEntities: [newOwnership.ownerEntityId, newOwnership.ownedEntityId],
        suggestedAction: 'Remove or modify the ownership relationship to prevent the cycle'
      }];
    }

    return [];
  }

  private validateNoOverAllocation(context: ValidationContext): BusinessRuleViolation[] {
    const { newOwnership, allOwnerships, shareClasses } = context;
    if (!newOwnership) return [];

    const shareClass = shareClasses.find(sc => sc.id === newOwnership.shareClassId);
    if (!shareClass) return []; // This will be caught by SHARE_CLASS_EXISTS rule

    // Calculate total shares for this entity and share class
    const totalShares = allOwnerships
      .filter(o => o.ownedEntityId === newOwnership.ownedEntityId && o.shareClassId === newOwnership.shareClassId)
      .reduce((sum, o) => sum + o.shares, 0) + newOwnership.shares;

    if (totalShares > shareClass.totalAuthorizedShares) {
      return [{
        rule: 'NO_OVER_ALLOCATION',
        severity: 'ERROR',
        message: `Total shares (${totalShares}) would exceed authorized shares (${shareClass.totalAuthorizedShares}) for share class ${shareClass.name}`,
        affectedEntities: [newOwnership.ownedEntityId],
        suggestedAction: `Reduce shares to ${shareClass.totalAuthorizedShares - (totalShares - newOwnership.shares)} or increase authorized shares`
      }];
    }

    return [];
  }

  private validateOwnerEntityExists(context: ValidationContext): BusinessRuleViolation[] {
    const { newOwnership, entities } = context;
    if (!newOwnership) return [];

    const ownerExists = entities.some(e => e.id === newOwnership.ownerEntityId);
    if (!ownerExists) {
      return [{
        rule: 'OWNER_ENTITY_EXISTS',
        severity: 'ERROR',
        message: `Owner entity ${newOwnership.ownerEntityId} does not exist`,
        affectedEntities: [newOwnership.ownerEntityId],
        suggestedAction: 'Create the owner entity first or use a valid entity ID'
      }];
    }

    return [];
  }

  private validateOwnedEntityExists(context: ValidationContext): BusinessRuleViolation[] {
    const { newOwnership, entities } = context;
    if (!newOwnership) return [];

    const ownedExists = entities.some(e => e.id === newOwnership.ownedEntityId);
    if (!ownedExists) {
      return [{
        rule: 'OWNED_ENTITY_EXISTS',
        severity: 'ERROR',
        message: `Owned entity ${newOwnership.ownedEntityId} does not exist`,
        affectedEntities: [newOwnership.ownedEntityId],
        suggestedAction: 'Create the owned entity first or use a valid entity ID'
      }];
    }

    return [];
  }

  private validateShareClassExists(context: ValidationContext): BusinessRuleViolation[] {
    const { newOwnership, shareClasses } = context;
    if (!newOwnership) return [];

    const shareClassExists = shareClasses.some(sc => sc.id === newOwnership.shareClassId);
    if (!shareClassExists) {
      return [{
        rule: 'SHARE_CLASS_EXISTS',
        severity: 'ERROR',
        message: `Share class ${newOwnership.shareClassId} does not exist`,
        affectedEntities: [newOwnership.ownedEntityId],
        suggestedAction: 'Create the share class first or use a valid share class ID'
      }];
    }

    return [];
  }

  private validateNoOrphanedEntities(context: ValidationContext): BusinessRuleViolation[] {
    // This rule is checked during entity deletion
    // Will be implemented when we add the deletion validation logic
    return [];
  }

  private validatePositiveSharesOnly(context: ValidationContext): BusinessRuleViolation[] {
    const { newOwnership } = context;
    if (!newOwnership) return [];

    if (newOwnership.shares <= 0) {
      return [{
        rule: 'POSITIVE_SHARES_ONLY',
        severity: 'ERROR',
        message: `Shares must be positive, got ${newOwnership.shares}`,
        affectedEntities: [newOwnership.ownedEntityId],
        suggestedAction: 'Set shares to a positive number'
      }];
    }

    return [];
  }

  private validateEffectiveDate(context: ValidationContext): BusinessRuleViolation[] {
    const { newOwnership } = context;
    if (!newOwnership) return [];

    const now = new Date();
    const effectiveDate = new Date(newOwnership.effectiveDate);

    // Allow future dates but warn if too far in the future
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    
    if (effectiveDate > oneYearFromNow) {
      return [{
        rule: 'FUTURE_EFFECTIVE_DATE_ALLOWED',
        severity: 'WARNING',
        message: `Effective date ${effectiveDate.toDateString()} is more than one year in the future`,
        affectedEntities: [newOwnership.ownedEntityId],
        suggestedAction: 'Verify this is the intended effective date'
      }];
    }

    return [];
  }
}

export interface ValidationContext {
  newOwnership?: UnifiedOwnership;
  entities: Entity[];
  allOwnerships: UnifiedOwnership[];
  shareClasses: ShareClass[];
  currentUserId?: string;
  operation?: 'CREATE' | 'UPDATE' | 'DELETE';
}
