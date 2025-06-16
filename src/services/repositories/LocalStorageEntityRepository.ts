
import { Entity } from '@/types/entity';
import { EntityRepository } from './interfaces';

export class LocalStorageEntityRepository implements EntityRepository {
  private readonly storageKey = 'entities';

  private getEntities(): Entity[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data).map(this.deserializeEntity) : [];
    } catch (error) {
      console.error('Failed to load entities from localStorage:', error);
      return [];
    }
  }

  private saveEntities(entities: Entity[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(entities.map(this.serializeEntity)));
    } catch (error) {
      console.error('Failed to save entities to localStorage:', error);
      throw error;
    }
  }

  private serializeEntity(entity: Entity): any {
    return {
      ...entity,
      incorporationDate: entity.incorporationDate?.toISOString(),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private deserializeEntity(data: any): Entity {
    return {
      ...data,
      incorporationDate: data.incorporationDate ? new Date(data.incorporationDate) : undefined,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  }

  async create(entityData: Omit<Entity, 'createdAt' | 'updatedAt' | 'version'>): Promise<Entity> {
    const entities = this.getEntities();
    
    // Check for duplicate IDs
    if (entities.find(e => e.id === entityData.id)) {
      throw new Error(`Entity with ID ${entityData.id} already exists`);
    }

    const entity: Entity = {
      ...entityData,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      metadata: entityData.metadata || {},
    };

    entities.push(entity);
    this.saveEntities(entities);
    console.log('📝 Created entity:', entity.id, entity.name);
    return entity;
  }

  async update(id: string, updates: Partial<Entity>): Promise<Entity> {
    const entities = this.getEntities();
    const index = entities.findIndex(e => e.id === id);
    
    if (index === -1) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    const entity = entities[index];
    const updatedEntity: Entity = {
      ...entity,
      ...updates,
      id: entity.id, // Prevent ID changes
      createdAt: entity.createdAt, // Prevent createdAt changes
      updatedAt: new Date(),
      version: entity.version + 1,
    };

    entities[index] = updatedEntity;
    this.saveEntities(entities);
    console.log('📝 Updated entity:', id);
    return updatedEntity;
  }

  async delete(id: string): Promise<void> {
    const entities = this.getEntities();
    const filteredEntities = entities.filter(e => e.id !== id);
    
    if (entities.length === filteredEntities.length) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    this.saveEntities(filteredEntities);
    console.log('🗑️ Deleted entity:', id);
  }

  async findById(id: string): Promise<Entity | null> {
    const entities = this.getEntities();
    return entities.find(e => e.id === id) || null;
  }

  async findAll(): Promise<Entity[]> {
    return this.getEntities();
  }

  async findByType(type: Entity['type']): Promise<Entity[]> {
    const entities = this.getEntities();
    return entities.filter(e => e.type === type);
  }
}
