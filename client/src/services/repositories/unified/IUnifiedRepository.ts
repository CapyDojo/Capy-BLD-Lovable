
import { Entity, ShareClass, OwnershipRelationship } from '@/types/entity';
import { UnifiedOwnership, CapTableView, EntityNode, ValidationResult } from '@/types/unified';

// Unified repository interface that combines entity and cap table operations
export interface IUnifiedEntityRepository {
  // Entity Management
  createEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt' | 'version'>, createdBy: string, reason?: string): Promise<Entity>;
  updateEntity(id: string, updates: Partial<Entity>, updatedBy: string, reason?: string): Promise<Entity>;
  deleteEntity(id: string, deletedBy: string, reason?: string): Promise<void>;
  getEntity(id: string): Promise<Entity | null>;
  getAllEntities(): Promise<Entity[]>;
  
  // Share Class Management
  createShareClass(shareClass: Omit<ShareClass, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<ShareClass>;
  updateShareClass(id: string, updates: Partial<ShareClass>, updatedBy: string, reason?: string): Promise<ShareClass>;
  deleteShareClass(id: string, deletedBy: string, reason?: string): Promise<void>;
  getShareClass(id: string): Promise<ShareClass | null>;
  getShareClassesByEntity(entityId: string): Promise<ShareClass[]>;
  
  // Ownership Management (Unified)
  createOwnership(ownership: Omit<UnifiedOwnership, 'id' | 'createdAt' | 'updatedAt' | 'version'>, createdBy: string): Promise<UnifiedOwnership>;
  updateOwnership(id: string, updates: Partial<UnifiedOwnership>, updatedBy: string, reason?: string): Promise<UnifiedOwnership>;
  deleteOwnership(id: string, deletedBy: string, reason?: string): Promise<void>;
  getOwnership(id: string): Promise<UnifiedOwnership | null>;
  getOwnershipsByEntity(entityId: string): Promise<UnifiedOwnership[]>;
  
  // Computed Views
  getCapTableView(entityId: string): Promise<CapTableView | null>;
  getOwnershipHierarchy(): Promise<EntityNode[]>;
  
  // Validation
  validateEntityDeletion(entityId: string): Promise<ValidationResult>;
  validateOwnershipChange(ownership: Partial<UnifiedOwnership>): Promise<ValidationResult>;
  
  // Event Subscription
  subscribe(callback: (event: RepositoryEvent) => void): () => void;
  unsubscribe(callback: (event: RepositoryEvent) => void): void;
}

// Event system for repository changes
export interface RepositoryEvent {
  type: 'ENTITY_CREATED' | 'ENTITY_UPDATED' | 'ENTITY_DELETED' |
        'OWNERSHIP_CREATED' | 'OWNERSHIP_UPDATED' | 'OWNERSHIP_DELETED' |
        'SHARE_CLASS_CREATED' | 'SHARE_CLASS_UPDATED' | 'SHARE_CLASS_DELETED';
  entityId: string;
  timestamp: Date;
  userId: string;
  data?: any;
}

// Repository type indicator
export type RepositoryType = 'LEGACY' | 'ENTERPRISE';

// Repository factory interface
export interface IUnifiedRepositoryFactory {
  createRepository(type: RepositoryType): Promise<IUnifiedEntityRepository>;
  getActiveRepositoryType(): RepositoryType;
  switchToRepository(type: RepositoryType): Promise<void>;
}
