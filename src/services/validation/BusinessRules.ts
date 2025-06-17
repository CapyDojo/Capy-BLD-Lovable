
import { Entity, ShareClass } from '@/types/entity';
import { UnifiedOwnership, ValidationResult, BusinessRuleViolation } from '@/types/unified';

export interface ValidationContext {
  newOwnership: UnifiedOwnership;
  entities: Entity[];
  allOwnerships: UnifiedOwnership[];
  shareClasses: ShareClass[];
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
}

export class BusinessRuleEngine {
  validateAll(context: ValidationContext): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];

    // Run all business rule validations
    const rules = [
      'NO_CIRCULAR_OWNERSHIP',
      'OWNER_ENTITY_EXISTS', 
      'OWNED_ENTITY_EXISTS',
      'SHARE_CLASS_EXISTS',
      'POSITIVE_SHARES_ONLY'
    ];

    for (const rule of rules) {
      const violations = this.validateRule(rule, context);
      violations.forEach(violation => {
        if (violation.severity === 'ERROR') {
          errors.push({
            code: violation.rule,
            message: violation.message,
            field: 'ownership'
          });
        } else {
          warnings.push({
            code: violation.rule,
            message: violation.message,
            field: 'ownership'
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateRule(rule: string, context: ValidationContext): BusinessRuleViolation[] {
    switch (rule) {
      case 'NO_CIRCULAR_OWNERSHIP':
        return this.checkCircularOwnership(context);
      case 'OWNER_ENTITY_EXISTS':
        return this.checkOwnerExists(context);
      case 'OWNED_ENTITY_EXISTS':
        return this.checkOwnedExists(context);
      case 'SHARE_CLASS_EXISTS':
        return this.checkShareClassExists(context);
      case 'POSITIVE_SHARES_ONLY':
        return this.checkPositiveShares(context);
      default:
        return [];
    }
  }

  private checkCircularOwnership(context: ValidationContext): BusinessRuleViolation[] {
    const { newOwnership, allOwnerships } = context;
    
    // Check if creating this ownership would create a cycle
    const wouldCreateCycle = this.detectCycle(
      newOwnership.ownerEntityId,
      newOwnership.ownedEntityId,
      allOwnerships
    );

    if (wouldCreateCycle) {
      return [{
        rule: 'NO_CIRCULAR_OWNERSHIP',
        severity: 'ERROR',
        message: `Creating this ownership would result in circular ownership`,
        affectedEntities: [newOwnership.ownerEntityId, newOwnership.ownedEntityId],
        suggestedAction: 'Review ownership structure to prevent cycles'
      }];
    }

    return [];
  }

  private detectCycle(
    startEntity: string,
    targetEntity: string,
    ownerships: UnifiedOwnership[],
    visited: Set<string> = new Set()
  ): boolean {
    if (startEntity === targetEntity) return true;
    if (visited.has(startEntity)) return false;

    visited.add(startEntity);

    // Find all entities that the start entity owns
    const ownedEntities = ownerships
      .filter(o => o.ownerEntityId === startEntity)
      .map(o => o.ownedEntityId);

    for (const ownedEntity of ownedEntities) {
      if (this.detectCycle(ownedEntity, targetEntity, ownerships, new Set(visited))) {
        return true;
      }
    }

    return false;
  }

  private checkOwnerExists(context: ValidationContext): BusinessRuleViolation[] {
    const { newOwnership, entities } = context;
    const ownerExists = entities.some(e => e.id === newOwnership.ownerEntityId);

    if (!ownerExists) {
      return [{
        rule: 'OWNER_ENTITY_EXISTS',
        severity: 'ERROR',
        message: `Owner entity ${newOwnership.ownerEntityId} does not exist`,
        affectedEntities: [newOwnership.ownerEntityId],
        suggestedAction: 'Create the owner entity first or use a valid owner ID'
      }];
    }

    return [];
  }

  private checkOwnedExists(context: ValidationContext): BusinessRuleViolation[] {
    const { newOwnership, entities } = context;
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

  private checkShareClassExists(context: ValidationContext): BusinessRuleViolation[] {
    const { newOwnership, shareClasses } = context;
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

  private checkPositiveShares(context: ValidationContext): BusinessRuleViolation[] {
    const { newOwnership } = context;

    if (newOwnership.shares <= 0) {
      return [{
        rule: 'POSITIVE_SHARES_ONLY',
        severity: 'ERROR',
        message: 'Share count must be positive',
        affectedEntities: [newOwnership.ownedEntityId],
        suggestedAction: 'Enter a positive number of shares'
      }];
    }

    return [];
  }
}
