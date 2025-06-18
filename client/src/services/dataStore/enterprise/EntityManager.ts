
import { Entity } from '@/types/entity';
import { EntitySearchQuery, ValidationResult } from '@/types/unified';
import { 
  EnterpriseDataError, 
  ValidationError,
  DataStoreEvent 
} from '@/types/enterprise';
import { BaseEnterpriseStore } from './BaseEnterpriseStore';

export class EntityManager extends BaseEnterpriseStore {
  private entities: Map<string, Entity> = new Map();

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

    console.log('✅ EntityManager: Created entity', newEntity.name, id);
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

    console.log('✅ EntityManager: Updated entity', updatedEntity.name, id);
    return updatedEntity;
  }

  async deleteEntity(id: string, deletedBy: string, reason: string): Promise<void> {
    const entity = this.entities.get(id);
    if (!entity) {
      throw new EnterpriseDataError(`Entity ${id} not found`, 'ENTITY_NOT_FOUND', id);
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

    console.log('✅ EntityManager: Deleted entity', entity.name, id);
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

  // Validation methods
  private async validateEntityCreation(entity: Entity): Promise<ValidationResult> {
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

  // Method to restore entities from backup
  restoreEntities(entitiesData: [string, Entity][]): void {
    this.entities = new Map(entitiesData);
  }

  // Method to export entities for backup
  exportEntities(): [string, Entity][] {
    return Array.from(this.entities.entries());
  }
}
