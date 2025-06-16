
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
  private isLoading = false;

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
    if (this.isLoading) {
      console.log('🚫 Skipping notify during data loading');
      return;
    }
    
    console.log('📡 Notifying', this.listeners.length, 'listeners of data change');
    this.listeners.forEach((callback, index) => {
      try {
        callback();
      } catch (error) {
        console.error(`❌ Error in listener ${index}:`, error);
      }
    });
    
    // Force immediate save after notification
    this.forceSave();
  }

  // Force immediate save to localStorage
  private forceSave() {
    const dataToSave = {
      entities: this.entityManager.getAll(),
      capTables: this.capTableManager.getCapTables(),
      shareholders: this.capTableManager.getShareholders(),
      shareClasses: this.capTableManager.getShareClasses(),
    };
    
    console.log('💾 Force saving data immediately:', {
      entities: dataToSave.entities.length,
      capTables: dataToSave.capTables.length,
      shareholders: dataToSave.shareholders.length,
      shareClasses: dataToSave.shareClasses.length
    });
    
    this.storageService.save(dataToSave);
    console.log('✅ Data force saved to localStorage');
  }

  // Auto-save to localStorage (legacy method, now calls forceSave)
  private autoSave() {
    this.forceSave();
  }

  // Load data from localStorage
  loadSavedData() {
    console.log('📥 Loading saved data...');
    this.isLoading = true;
    
    const data = this.storageService.load();
    if (data) {
      console.log('📥 Found saved data, applying...', {
        entities: data.entities?.length || 0,
        capTables: data.capTables?.length || 0,
        shareholders: data.shareholders?.length || 0,
        shareClasses: data.shareClasses?.length || 0
      });
      
      this.entityManager.updateData(data.entities || []);
      this.capTableManager.updateData(
        data.capTables || [],
        data.shareholders || [],
        data.shareClasses || []
      );
      console.log('✅ Saved data loaded and applied');
    } else {
      console.log('📥 No saved data to load, using initial data');
    }
    
    this.isLoading = false;
  }

  // Entity operations
  getEntities(): Entity[] {
    const entities = this.entityManager.getAll();
    console.log('📊 Getting entities, count:', entities.length);
    return entities;
  }

  getEntityById(id: string): Entity | undefined {
    return this.entityManager.getById(id);
  }

  addEntity(entity: Entity) {
    console.log('➕ Adding entity:', entity.name, entity.id);
    this.entityManager.add(entity);
  }

  updateEntity(id: string, updates: Partial<Entity>) {
    console.log('📝 Updating entity:', id, updates);
    this.entityManager.update(id, updates);
  }

  deleteEntity(id: string) {
    console.log('🗑️ Starting entity deletion process for:', id);
    
    // Verify entity exists before deletion
    const entityExists = this.entityManager.getById(id);
    if (!entityExists) {
      console.warn('⚠️ Entity not found for deletion:', id);
      return;
    }
    
    console.log('🗑️ Entity found, proceeding with deletion');
    
    // First clean up all cap table data for this entity
    this.capTableManager.cleanupEntityData(id);
    
    // Then delete the entity itself
    this.entityManager.delete(id);
    
    // Force immediate save after deletion
    console.log('💾 Force saving after entity deletion');
    this.forceSave();
    
    // Verify deletion was persisted
    const savedData = this.storageService.load();
    const stillInStorage = savedData?.entities?.find((e: Entity) => e.id === id);
    
    if (stillInStorage) {
      console.error('❌ Entity deletion failed - still in localStorage:', id);
      // Try to remove it manually from storage
      if (savedData?.entities) {
        savedData.entities = savedData.entities.filter((e: Entity) => e.id !== id);
        this.storageService.save(savedData);
        console.log('🔧 Manually removed entity from localStorage');
      }
    } else {
      console.log('✅ Entity deletion confirmed in localStorage');
    }
    
    // Verify deletion in memory
    const remainingEntities = this.entityManager.getAll();
    const stillExists = remainingEntities.find(e => e.id === id);
    
    if (stillExists) {
      console.error('❌ Entity deletion failed - entity still exists in memory:', id);
    } else {
      console.log('✅ Entity deletion confirmed in memory, remaining entities:', remainingEntities.length);
    }
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
