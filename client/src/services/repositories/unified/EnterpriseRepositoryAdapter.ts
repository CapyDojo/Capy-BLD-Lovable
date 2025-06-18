
import { IUnifiedEntityRepository, RepositoryEvent } from './IUnifiedRepository';
import { IEnterpriseDataStore, DataStoreEvent } from '@/types/enterprise';
import { Entity, ShareClass } from '@/types/entity';
import { UnifiedOwnership, CapTableView, EntityNode, ValidationResult } from '@/types/unified';

export class EnterpriseRepositoryAdapter implements IUnifiedEntityRepository {
  private eventListeners: ((event: RepositoryEvent) => void)[] = [];
  private storeUnsubscribe?: () => void;

  constructor(private enterpriseStore: IEnterpriseDataStore) {
    // Subscribe to enterprise store events and convert to repository events
    this.storeUnsubscribe = this.enterpriseStore.subscribe((event: DataStoreEvent) => {
      const repositoryEvent: RepositoryEvent = {
        type: event.type as any, // Type mapping is 1:1
        entityId: event.entityId,
        timestamp: event.timestamp,
        userId: event.userId,
        data: event.data
      };
      
      this.emitEvent(repositoryEvent);
    });

    console.log('🔗 EnterpriseRepositoryAdapter initialized with enterprise store');
  }

  // Entity Management
  async createEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt' | 'version'>, createdBy: string, reason?: string): Promise<Entity> {
    return this.enterpriseStore.createEntity(entity, createdBy, reason);
  }

  async updateEntity(id: string, updates: Partial<Entity>, updatedBy: string, reason?: string): Promise<Entity> {
    return this.enterpriseStore.updateEntity(id, updates, updatedBy, reason || 'Repository update');
  }

  async deleteEntity(id: string, deletedBy: string, reason?: string): Promise<void> {
    return this.enterpriseStore.deleteEntity(id, deletedBy, reason || 'Repository deletion');
  }

  async getEntity(id: string): Promise<Entity | null> {
    return this.enterpriseStore.getEntity(id);
  }

  async getAllEntities(): Promise<Entity[]> {
    return this.enterpriseStore.getAllEntities();
  }

  // Share Class Management
  async createShareClass(shareClass: Omit<ShareClass, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<ShareClass> {
    return this.enterpriseStore.createShareClass(shareClass, createdBy);
  }

  async updateShareClass(id: string, updates: Partial<ShareClass>, updatedBy: string, reason?: string): Promise<ShareClass> {
    return this.enterpriseStore.updateShareClass(id, updates, updatedBy, reason || 'Repository update');
  }

  async deleteShareClass(id: string, deletedBy: string, reason?: string): Promise<void> {
    return this.enterpriseStore.deleteShareClass(id, deletedBy, reason || 'Repository deletion');
  }

  async getShareClass(id: string): Promise<ShareClass | null> {
    return this.enterpriseStore.getShareClass(id);
  }

  async getShareClassesByEntity(entityId: string): Promise<ShareClass[]> {
    return this.enterpriseStore.getShareClassesByEntity(entityId);
  }

  // Ownership Management (Unified)
  async createOwnership(ownership: Omit<UnifiedOwnership, 'id' | 'createdAt' | 'updatedAt' | 'version'>, createdBy: string): Promise<UnifiedOwnership> {
    return this.enterpriseStore.createOwnership(ownership, createdBy);
  }

  async updateOwnership(id: string, updates: Partial<UnifiedOwnership>, updatedBy: string, reason?: string): Promise<UnifiedOwnership> {
    return this.enterpriseStore.updateOwnership(id, updates, updatedBy, reason || 'Repository update');
  }

  async deleteOwnership(id: string, deletedBy: string, reason?: string): Promise<void> {
    return this.enterpriseStore.deleteOwnership(id, deletedBy, reason || 'Repository deletion');
  }

  async getOwnership(id: string): Promise<UnifiedOwnership | null> {
    return this.enterpriseStore.getOwnership(id);
  }

  async getOwnershipsByEntity(entityId: string): Promise<UnifiedOwnership[]> {
    return this.enterpriseStore.getOwnershipsByEntity(entityId);
  }

  // Computed Views
  async getCapTableView(entityId: string): Promise<CapTableView | null> {
    return this.enterpriseStore.getCapTableView(entityId);
  }

  async getOwnershipHierarchy(): Promise<EntityNode[]> {
    return this.enterpriseStore.getOwnershipHierarchy();
  }

  // Validation
  async validateEntityDeletion(entityId: string): Promise<ValidationResult> {
    return this.enterpriseStore.validateEntityDeletion(entityId);
  }

  async validateOwnershipChange(ownership: Partial<UnifiedOwnership>): Promise<ValidationResult> {
    return this.enterpriseStore.validateOwnershipChange(ownership);
  }

  // Event Subscription
  subscribe(callback: (event: RepositoryEvent) => void): () => void {
    this.eventListeners.push(callback);
    console.log('🔗 EnterpriseRepositoryAdapter: New subscriber added, total:', this.eventListeners.length);
    
    return () => {
      this.eventListeners = this.eventListeners.filter(listener => listener !== callback);
      console.log('🔗 EnterpriseRepositoryAdapter: Subscriber removed, total:', this.eventListeners.length);
    };
  }

  unsubscribe(callback: (event: RepositoryEvent) => void): void {
    this.eventListeners = this.eventListeners.filter(listener => listener !== callback);
  }

  // Cleanup method
  destroy(): void {
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
    }
    this.eventListeners = [];
    console.log('🧹 EnterpriseRepositoryAdapter destroyed');
  }

  // Private helper methods
  private emitEvent(event: RepositoryEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('❌ EnterpriseRepositoryAdapter: Error in event listener:', error);
      }
    });
  }
}
