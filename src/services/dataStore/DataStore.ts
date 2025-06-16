
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
  }

  // Subscribe to data changes
  subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Notify all listeners of changes
  private notify() {
    this.listeners.forEach(callback => callback());
    this.autoSave();
  }

  // Auto-save to localStorage
  private autoSave() {
    this.storageService.save({
      entities: this.entityManager.getAll(),
      capTables: this.capTableManager.getCapTables(),
      shareholders: this.capTableManager.getShareholders(),
      shareClasses: this.capTableManager.getShareClasses(),
    });
  }

  // Load data from localStorage
  loadSavedData() {
    const data = this.storageService.load();
    if (data) {
      this.entityManager.updateData(data.entities || []);
      this.capTableManager.updateData(
        data.capTables || [],
        data.shareholders || [],
        data.shareClasses || []
      );
      this.notify();
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
    this.entityManager.add(entity);
  }

  updateEntity(id: string, updates: Partial<Entity>) {
    this.entityManager.update(id, updates);
  }

  deleteEntity(id: string) {
    this.entityManager.delete(id);
    this.capTableManager.cleanupEntityData(id);
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
