
import { UnifiedOwnership, OwnershipQuery, ValidationResult } from '@/types/unified';
import { 
  EnterpriseDataError, 
  ValidationError 
} from '@/types/enterprise';
import { BaseEnterpriseStore } from './BaseEnterpriseStore';
import { ValidationContext, BusinessRuleEngine } from '@/services/validation/BusinessRules';
import { Entity, ShareClass } from '@/types/entity';

export class OwnershipManager extends BaseEnterpriseStore {
  private ownerships: Map<string, UnifiedOwnership> = new Map();
  private businessRules: BusinessRuleEngine;

  constructor(config: any) {
    super(config);
    this.businessRules = new BusinessRuleEngine();
  }

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

    console.log('✅ OwnershipManager: Created ownership', id);
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

    console.log('✅ OwnershipManager: Updated ownership', id);
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

    console.log('✅ OwnershipManager: Deleted ownership', id);
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

  async validateOwnershipChange(ownership: Partial<UnifiedOwnership>, entities?: Entity[], shareClasses?: ShareClass[]): Promise<ValidationResult> {
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

    if (entities && shareClasses) {
      const context: ValidationContext = {
        newOwnership: ownership as UnifiedOwnership,
        entities,
        allOwnerships: Array.from(this.ownerships.values()),
        shareClasses,
        operation: 'CREATE'
      };

      return this.businessRules.validateAll(context);
    }

    return { isValid: true, errors: [], warnings: [] };
  }

  async validateCircularOwnership(ownerEntityId: string, ownedEntityId: string, entities: Entity[], shareClasses: ShareClass[]): Promise<ValidationResult> {
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
      entities,
      allOwnerships: Array.from(this.ownerships.values()),
      shareClasses,
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

  // Method to restore ownerships from backup
  restoreOwnerships(ownershipsData: [string, UnifiedOwnership][]): void {
    this.ownerships = new Map(ownershipsData);
  }

  // Method to export ownerships for backup
  exportOwnerships(): [string, UnifiedOwnership][] {
    return Array.from(this.ownerships.entries());
  }
}
