import { Entity } from '@/types/entity';
import { EntityCapTable, Shareholder, ShareClass } from '@/types/capTable';
import { EntityManager } from './EntityManager';
import { CapTableManager } from './CapTableManager';
import { StorageService } from './storage';
import { invalidateCanvasCache } from '../capTableSync';

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

    // Inject entity accessor into CapTableManager for better entity-stakeholder naming
    this.capTableManager.setEntityAccessor((id: string) => this.entityManager.getById(id));

    // Fix missing entityId links for individual shareholders
    this.fixIndividualShareholderLinks();

    console.log('🏪 DataStore initialized with performance optimizations:', {
      entities: initialEntities.length,
      capTables: initialCapTables.length,
      shareholders: initialShareholders.length,
      shareClasses: initialShareClasses.length
    });
  }

  // Fix missing entityId links for individual shareholders
  private fixIndividualShareholderLinks() {
    console.log('🔧 Fixing individual shareholder entityId links...');
    const entities = this.entityManager.getAll();
    const shareholders = this.capTableManager.getShareholders();
    
    let fixed = 0;
    shareholders.forEach(shareholder => {
      if (shareholder.type === 'Individual' && !shareholder.entityId) {
        // Find matching entity by name for individuals
        const matchingEntity = entities.find(e => 
          e.type === 'Individual' && e.name === shareholder.name
        );
        
        if (matchingEntity) {
          console.log(`🔧 Linking shareholder "${shareholder.name}" to entity ${matchingEntity.id}`);
          this.capTableManager.updateShareholderDirect(shareholder.id, { 
            entityId: matchingEntity.id 
          });
          fixed++;
        }
      }
    });
    
    console.log(`✅ Fixed ${fixed} individual shareholder links`);
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

  // Optimized notify with cache invalidation
  private notify() {
    if (this.isLoading) {
      console.log('🚫 Skipping notify during data loading');
      return;
    }
    
    // Invalidate expensive computation caches
    invalidateCanvasCache();
    
    console.log('📡 Notifying', this.listeners.length, 'listeners of data change');
    
    // Batch notifications to prevent excessive updates
    requestAnimationFrame(() => {
      this.listeners.forEach((callback, index) => {
        try {
          callback();
        } catch (error) {
          console.error(`❌ Error in listener ${index}:`, error);
        }
      });
    });
    
    // Debounced save to reduce localStorage writes
    this.debouncedSave();
  }

  // Debounced save to reduce localStorage operations
  private saveTimeout: NodeJS.Timeout | null = null;
  private debouncedSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.forceSave();
      this.saveTimeout = null;
    }, 250); // Save after 250ms of inactivity
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

  // Entity operations with performance logging
  getEntities(): Entity[] {
    const entities = this.entityManager.getAll();
    return entities;
  }

  getEntityById(id: string): Entity | undefined {
    return this.entityManager.getById(id);
  }

  addEntity(entity: Entity) {
    console.log('➕ Adding entity with enhanced sync:', entity.name, entity.id);
    this.entityManager.add(entity);
  }

  updateEntity(id: string, updates: Partial<Entity>) {
    console.log('📝 Updating entity with enhanced sync:', id, updates);
    this.entityManager.update(id, updates);
    
    // If entity name was updated, update shareholders with matching entityId
    if (updates.name) {
      console.log('📝 Entity name changed, updating linked shareholders...');
      const shareholders = this.capTableManager.getShareholders();
      
      // Find shareholders with entityId match
      const linkedShareholders = shareholders.filter(s => s.entityId === id);
      
      console.log('📝 Found linked shareholders to update:', linkedShareholders.map(s => ({ 
        id: s.id, 
        oldName: s.name, 
        entityId: s.entityId 
      })));
      
      // Update each linked shareholder's name
      linkedShareholders.forEach(shareholder => {
        console.log(`📝 Updating shareholder ${shareholder.id} name from "${shareholder.name}" to "${updates.name}"`);
        this.capTableManager.updateShareholderDirect(shareholder.id, { name: updates.name });
      });
    }
  }

  deleteEntity(id: string) {
    console.log('🗑️ Starting enhanced entity deletion process for:', id);
    
    // Verify entity exists before deletion
    const entityExists = this.entityManager.getById(id);
    if (!entityExists) {
      console.warn('⚠️ Entity not found for deletion:', id);
      return;
    }
    
    console.log('🗑️ Entity found, proceeding with enhanced deletion');
    
    // First clean up all cap table data for this entity
    this.capTableManager.cleanupEntityData(id);
    
    // Then delete the entity itself
    this.entityManager.delete(id);
    
    // Force immediate save and wait for it to complete
    console.log('💾 Force saving after enhanced entity deletion');
    this.forceSave();
    
    // Enhanced verification
    const savedData = this.storageService.load();
    const stillInStorage = savedData?.entities?.find((e: Entity) => e.id === id);
    
    if (stillInStorage) {
      console.error('❌ Entity deletion failed - still in localStorage:', id);
    } else {
      console.log('✅ Enhanced entity deletion confirmed in localStorage');
    }
    
    // Verify deletion in memory
    const remainingEntities = this.entityManager.getAll();
    const stillExists = remainingEntities.find(e => e.id === id);
    
    if (stillExists) {
      console.error('❌ Entity deletion failed - entity still exists in memory:', id);
    } else {
      console.log('✅ Enhanced entity deletion confirmed in memory, remaining entities:', remainingEntities.length);
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
    console.log('📊 DataStore: Enhanced ownership update:', sourceEntityId, '->', targetEntityId, ownershipPercentage + '%');
    this.capTableManager.updateOwnership(sourceEntityId, targetEntityId, ownershipPercentage);
  }

  removeOwnership(sourceEntityId: string, targetEntityId: string) {
    console.log('🗑️ DataStore: Enhanced ownership removal:', sourceEntityId, '->', targetEntityId);
    this.capTableManager.removeOwnership(sourceEntityId, targetEntityId);
  }

  addStakeholder(entityId: string, stakeholder: { name: string; shareClass: string; sharesOwned: number; type?: 'Individual' | 'Entity' | 'Pool' }) {
    console.log('➕ DataStore: Enhanced stakeholder addition to entity:', entityId, stakeholder);
    this.capTableManager.addStakeholder(entityId, stakeholder);
  }

  updateStakeholder(entityId: string, stakeholderId: string, updates: { name?: string; shareClass?: string; sharesOwned?: number }) {
    console.log('📝 DataStore: Enhanced stakeholder update:', stakeholderId, 'in entity:', entityId, updates);
    this.capTableManager.updateStakeholder(entityId, stakeholderId, updates);
  }

  deleteStakeholder(entityId: string, stakeholderId: string) {
    console.log('🗑️ DataStore: Enhanced stakeholder deletion process');
    console.log('🗑️ Entity ID:', entityId);
    console.log('🗑️ Stakeholder ID:', stakeholderId);
    
    // Verify stakeholder exists before deletion
    const capTable = this.capTableManager.getCapTableByEntityId(entityId);
    if (!capTable) {
      console.warn('⚠️ No cap table found for entity:', entityId);
      return;
    }

    const existingInvestment = capTable.investments.find(inv => 
      inv.id === stakeholderId || inv.shareholderId === stakeholderId
    );
    
    if (!existingInvestment) {
      console.warn('⚠️ Stakeholder not found in investments:', stakeholderId);
      return;
    }

    console.log('🔍 Found stakeholder to delete with enhanced sync:', existingInvestment);

    // Perform the deletion
    this.capTableManager.deleteStakeholder(entityId, stakeholderId);
    
    // Force immediate save
    console.log('💾 Force saving after enhanced stakeholder deletion');
    this.forceSave();
    
    // Enhanced verification
    const verifyCapTable = this.capTableManager.getCapTableByEntityId(entityId);
    const stillExists = verifyCapTable?.investments.find(inv => 
      inv.id === stakeholderId || inv.shareholderId === stakeholderId
    );
    
    const globalShareholders = this.capTableManager.getShareholders();
    const stillInGlobal = globalShareholders.find(s => s.id === stakeholderId);
    
    if (stillExists) {
      console.error('❌ CRITICAL: Stakeholder still exists in cap table after enhanced deletion!', stillExists);
    }
    
    if (stillInGlobal) {
      console.error('❌ CRITICAL: Stakeholder still exists in global array after enhanced deletion!', stillInGlobal);
    }
    
    if (!stillExists && !stillInGlobal) {
      console.log('✅ Enhanced stakeholder deletion verified in memory');
    }
    
    // Verify localStorage persistence
    const savedData = this.storageService.load();
    const savedCapTable = savedData?.capTables?.find((ct: any) => ct.entityId === entityId);
    const stillInStorage = savedCapTable?.investments?.find((inv: any) => 
      inv.id === stakeholderId || inv.shareholderId === stakeholderId
    );
    
    if (stillInStorage) {
      console.error('❌ CRITICAL: Stakeholder still exists in localStorage after enhanced deletion!', stillInStorage);
    } else {
      console.log('✅ Enhanced stakeholder deletion verified in localStorage');
    }
    
    console.log('✅ DataStore: Enhanced stakeholder deletion process completed');
  }
}
