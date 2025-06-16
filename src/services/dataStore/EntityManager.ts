
import { Entity } from '@/types/entity';

export class EntityManager {
  private entities: Entity[] = [];
  private notifyChange: () => void;

  constructor(initialEntities: Entity[], notifyChange: () => void) {
    this.entities = [...initialEntities];
    this.notifyChange = notifyChange;
  }

  getAll(): Entity[] {
    return [...this.entities];
  }

  getById(id: string): Entity | undefined {
    return this.entities.find(entity => entity.id === id);
  }

  add(entity: Entity): void {
    console.log('🏗️ EntityManager adding entity:', entity.id, entity.name);
    this.entities.push(entity);
    console.log('🏗️ EntityManager total entities after add:', this.entities.length);
    this.notifyChange();
  }

  update(id: string, updates: Partial<Entity>): void {
    console.log('📝 EntityManager updating entity:', id);
    const index = this.entities.findIndex(e => e.id === id);
    if (index !== -1) {
      this.entities[index] = { ...this.entities[index], ...updates };
      console.log('📝 EntityManager entity updated successfully');
      this.notifyChange();
    } else {
      console.warn('⚠️ EntityManager could not find entity to update:', id);
    }
  }

  delete(id: string): void {
    console.log('🗑️ EntityManager deleting entity:', id);
    const beforeCount = this.entities.length;
    const entityToDelete = this.entities.find(e => e.id === id);
    
    if (entityToDelete) {
      console.log('🗑️ Found entity to delete:', entityToDelete.name);
    }
    
    // Remove the entity
    this.entities = this.entities.filter(e => e.id !== id);
    const afterCount = this.entities.length;
    
    console.log('🗑️ EntityManager deletion result:', {
      before: beforeCount,
      after: afterCount,
      deleted: beforeCount - afterCount
    });
    
    if (beforeCount === afterCount) {
      console.warn('⚠️ EntityManager: No entity was deleted - entity may not have existed');
    } else {
      console.log('✅ EntityManager: Entity successfully deleted from memory');
      
      // Verify the entity is really gone
      const stillExists = this.entities.find(e => e.id === id);
      if (stillExists) {
        console.error('❌ CRITICAL: Entity still exists after deletion attempt!');
      } else {
        console.log('✅ Confirmed: Entity completely removed from memory');
      }
    }
    
    this.notifyChange();
  }

  updateData(newEntities: Entity[]): void {
    console.log('🔄 EntityManager updating all data with', newEntities.length, 'entities');
    this.entities = [...newEntities];
  }
}
