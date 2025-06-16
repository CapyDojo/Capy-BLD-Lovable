
import { Entity } from '@/types/entity';
import { EntityCapTable, Shareholder, ShareClass } from '@/types/capTable';
import { EntityManager } from './EntityManager';
import { CapTableManager } from './CapTableManager';
import { StorageService } from './storage';

export class DataStore {
  private entityManager: EntityManager;
  private capTableManager: CapTableManager;
  private storageService: StorageService;
  private listeners: (() => void)[] = [];

  constructor(
    initialEntities: Entity[],
    initialCapTables: EntityCapTable[],
    initialShareholders: Shareholder[],
    initialShareClasses: ShareClass[]
  ) {
    this.storageService = new StorageService();
    
    const notifyChange = () => this.notify();
    
    this.entityManager = new EntityManager(initialEntities, notifyChange);
    this.capTableManager = new CapTableManager(
      initialCapTables,
      initialShareholders,
      initialShareClasses,
      notifyChange
    );

    console.log('🏪 DataStore initialized with:', {
      entities: initialEntities.length,
      capTables: initialCapTables.length,
      shareholders: initialShareholders.length,
      shareClasses: initialShareClasses.length
    });
  }

  // Subscribe to data changes
  subscribe(callback: () => void) {
    this.listeners.push(callback);
    console.log('🔗 New subscriber added, total listeners:', this.listeners.length);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
      console.log('🔗 Subscriber removed, total listeners:', this.listeners.length);
    };
  }

  // Notify all listeners of changes
  private notify() {
    console.log('📡 Notifying', this.listeners.length, 'listeners of data change');
    this.listeners.forEach((callback, index) => {
      try {
        callback();
      } catch (error) {
        console.error(`❌ Error in listener ${index}:`, error);
      }
    });
    this.autoSave();
  }

  // Auto-save to localStorage
  private autoSave() {
    const dataToSave = {
      entities: this.entityManager.getAll(),
      capTables: this.capTableManager.getCapTables(),
      shareholders: this.capTableManager.getShareholders(),
      shareClasses: this.capTableManager.getShareClasses(),
    };
    
    this.storageService.save(dataToSave);
  }

  // Load data from localStorage
  loadSavedData() {
    console.log('📥 Loading saved data...');
    const data = this.storageService.load();
    if (data) {
      this.entityManager.updateData(data.entities || []);
      this.capTableManager.updateData(
        data.capTables || [],
        data.shareholders || [],
        data.shareClasses || []
      );
      console.log('✅ Saved data loaded and applied');
      this.notify();
    } else {
      console.log('📥 No saved data to load, using initial data');
    }
  }

  // Entity operations
  getEntities(): Entity[] {
    return this.entityManager.getAll();
  }

  getEntityById(id: string): Entity | undefined {
    return this.entityManager.getById(id);
  }

  addEntity(entity: Entity) {
    console.log('➕ Adding entity:', entity.name);
    this.entityManager.add(entity);
  }

  updateEntity(id: string, updates: Partial<Entity>) {
    console.log('📝 Updating entity:', id, updates);
    this.entityManager.update(id, updates);
  }

  deleteEntity(id: string) {
    console.log('🗑️ Deleting entity:', id);
    
    // First clean up all cap table data for this entity
    this.capTableManager.cleanupEntityData(id);
    
    // Then delete the entity itself
    this.entityManager.delete(id);
    
    console.log('✅ Entity deletion complete, remaining entities:', this.entityManager.getAll().length);
  }

  // Cap table operations
  getCapTables(): EntityCapTable[] {
    return this.capTableManager.getCapTables();
  }

  getShareholders(): Shareholder[] {
    return this.capTableManager.getShareholders();
  }

  getShareClasses(): ShareClass[] {
    return this.capTableManager.getShareClasses();
  }

  getCapTableByEntityId(entityId: string): EntityCapTable | undefined {
    return this.capTableManager.getCapTableByEntityId(entityId);
  }

  updateOwnership(sourceEntityId: string, targetEntityId: string, ownershipPercentage: number) {
    this.capTableManager.updateOwnership(sourceEntityId, targetEntityId, ownershipPercentage);
  }

  removeOwnership(sourceEntityId: string, targetEntityId: string) {
    this.capTableManager.removeOwnership(sourceEntityId, targetEntityId);
  }

  addStakeholder(entityId: string, stakeholder: { name: string; shareClass: string; sharesOwned: number; type?: 'Individual' | 'Entity' | 'Pool' }) {
    this.capTableManager.addStakeholder(entityId, stakeholder);
  }

  updateStakeholder(entityId: string, stakeholderId: string, updates: { name?: string; shareClass?: string; sharesOwned?: number }) {
    this.capTableManager.updateStakeholder(entityId, stakeholderId, updates);
  }

  deleteStakeholder(entityId: string, stakeholderId: string) {
    this.capTableManager.deleteStakeholder(entityId, stakeholderId);
  }
}
