
import { Entity, OwnershipRelationship, ShareClass } from '@/types/entity';

export interface EntityRepository {
  create(entity: Omit<Entity, 'createdAt' | 'updatedAt' | 'version'>): Promise<Entity>;
  update(id: string, updates: Partial<Entity>): Promise<Entity>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Entity | null>;
  findAll(): Promise<Entity[]>;
  findByType(type: Entity['type']): Promise<Entity[]>;
}

export interface OwnershipRepository {
  create(ownership: Omit<OwnershipRelationship, 'createdAt' | 'updatedAt' | 'version'>): Promise<OwnershipRelationship>;
  update(id: string, updates: Partial<OwnershipRelationship>): Promise<OwnershipRelationship>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<OwnershipRelationship | null>;
  findByOwner(ownerEntityId: string): Promise<OwnershipRelationship[]>;
  findByOwned(ownedEntityId: string): Promise<OwnershipRelationship[]>;
  findByEntity(entityId: string): Promise<OwnershipRelationship[]>; // Both owner and owned
  deleteByEntity(entityId: string): Promise<void>;
  findAll(): Promise<OwnershipRelationship[]>;
}

export interface ShareClassRepository {
  create(shareClass: Omit<ShareClass, 'createdAt' | 'updatedAt'>): Promise<ShareClass>;
  update(id: string, updates: Partial<ShareClass>): Promise<ShareClass>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<ShareClass | null>;
  findByEntity(entityId: string): Promise<ShareClass[]>;
  findAll(): Promise<ShareClass[]>;
}
