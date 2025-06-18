
import { OwnershipRelationship } from '@/types/entity';
import { OwnershipRepository } from './interfaces';

export class LocalStorageOwnershipRepository implements OwnershipRepository {
  private readonly storageKey = 'ownerships';

  private getOwnerships(): OwnershipRelationship[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data).map(this.deserializeOwnership) : [];
    } catch (error) {
      console.error('Failed to load ownerships from localStorage:', error);
      return [];
    }
  }

  private saveOwnerships(ownerships: OwnershipRelationship[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(ownerships.map(this.serializeOwnership)));
    } catch (error) {
      console.error('Failed to save ownerships to localStorage:', error);
      throw error;
    }
  }

  private serializeOwnership(ownership: OwnershipRelationship): any {
    return {
      ...ownership,
      effectiveDate: ownership.effectiveDate.toISOString(),
      expiryDate: ownership.expiryDate?.toISOString(),
      createdAt: ownership.createdAt.toISOString(),
      updatedAt: ownership.updatedAt.toISOString(),
    };
  }

  private deserializeOwnership(data: any): OwnershipRelationship {
    return {
      ...data,
      effectiveDate: new Date(data.effectiveDate),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  }

  async create(ownershipData: Omit<OwnershipRelationship, 'createdAt' | 'updatedAt' | 'version'>): Promise<OwnershipRelationship> {
    const ownerships = this.getOwnerships();
    
    // Check for duplicate IDs
    if (ownerships.find(o => o.id === ownershipData.id)) {
      throw new Error(`Ownership with ID ${ownershipData.id} already exists`);
    }

    const ownership: OwnershipRelationship = {
      ...ownershipData,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };

    ownerships.push(ownership);
    this.saveOwnerships(ownerships);
    console.log('📝 Created ownership:', ownership.id);
    return ownership;
  }

  async update(id: string, updates: Partial<OwnershipRelationship>): Promise<OwnershipRelationship> {
    const ownerships = this.getOwnerships();
    const index = ownerships.findIndex(o => o.id === id);
    
    if (index === -1) {
      throw new Error(`Ownership with ID ${id} not found`);
    }

    const ownership = ownerships[index];
    const updatedOwnership: OwnershipRelationship = {
      ...ownership,
      ...updates,
      id: ownership.id, // Prevent ID changes
      createdAt: ownership.createdAt, // Prevent createdAt changes
      updatedAt: new Date(),
      version: ownership.version + 1,
    };

    ownerships[index] = updatedOwnership;
    this.saveOwnerships(ownerships);
    console.log('📝 Updated ownership:', id);
    return updatedOwnership;
  }

  async delete(id: string): Promise<void> {
    const ownerships = this.getOwnerships();
    const filteredOwnerships = ownerships.filter(o => o.id !== id);
    
    if (ownerships.length === filteredOwnerships.length) {
      throw new Error(`Ownership with ID ${id} not found`);
    }

    this.saveOwnerships(filteredOwnerships);
    console.log('🗑️ Deleted ownership:', id);
  }

  async findById(id: string): Promise<OwnershipRelationship | null> {
    const ownerships = this.getOwnerships();
    return ownerships.find(o => o.id === id) || null;
  }

  async findByOwner(ownerEntityId: string): Promise<OwnershipRelationship[]> {
    const ownerships = this.getOwnerships();
    return ownerships.filter(o => o.ownerEntityId === ownerEntityId);
  }

  async findByOwned(ownedEntityId: string): Promise<OwnershipRelationship[]> {
    const ownerships = this.getOwnerships();
    return ownerships.filter(o => o.ownedEntityId === ownedEntityId);
  }

  async findByEntity(entityId: string): Promise<OwnershipRelationship[]> {
    const ownerships = this.getOwnerships();
    return ownerships.filter(o => o.ownerEntityId === entityId || o.ownedEntityId === entityId);
  }

  async deleteByEntity(entityId: string): Promise<void> {
    const ownerships = this.getOwnerships();
    const filteredOwnerships = ownerships.filter(o => 
      o.ownerEntityId !== entityId && o.ownedEntityId !== entityId
    );
    
    this.saveOwnerships(filteredOwnerships);
    console.log('🗑️ Deleted all ownerships for entity:', entityId);
  }

  async findAll(): Promise<OwnershipRelationship[]> {
    return this.getOwnerships();
  }
}
