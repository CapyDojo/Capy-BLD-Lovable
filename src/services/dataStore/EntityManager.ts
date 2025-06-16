
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
    this.entities.push(entity);
    this.notifyChange();
  }

  update(id: string, updates: Partial<Entity>): void {
    const index = this.entities.findIndex(e => e.id === id);
    if (index !== -1) {
      this.entities[index] = { ...this.entities[index], ...updates };
      this.notifyChange();
    }
  }

  delete(id: string): void {
    this.entities = this.entities.filter(e => e.id !== id);
    this.notifyChange();
  }

  updateData(newEntities: Entity[]): void {
    this.entities = [...newEntities];
  }
}
