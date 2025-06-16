
import { Entity } from '@/types/entity';
import { EntityCapTable, Shareholder, ShareClass, Investment } from '@/types/capTable';
import { mockEntities, mockCapTables, mockShareholders, mockShareClasses } from '@/data/mockData';

// In-memory store for real-time updates
class DataStore {
  private entities: Entity[] = [...mockEntities];
  private capTables: EntityCapTable[] = [...mockCapTables];
  private shareholders: Shareholder[] = [...mockShareholders];
  private shareClasses: ShareClass[] = [...mockShareClasses];
  private listeners: (() => void)[] = [];

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
    try {
      localStorage.setItem('entity-data', JSON.stringify({
        entities: this.entities,
        capTables: this.capTables,
        shareholders: this.shareholders,
        shareClasses: this.shareClasses,
        lastSaved: Date.now()
      }));
      console.log('💾 Data auto-saved');
    } catch (error) {
      console.error('Failed to auto-save data:', error);
    }
  }

  // Load data from localStorage
  loadSavedData() {
    try {
      const saved = localStorage.getItem('entity-data');
      if (saved) {
        const data = JSON.parse(saved);
        this.entities = data.entities || [...mockEntities];
        this.capTables = data.capTables || [...mockCapTables];
        this.shareholders = data.shareholders || [...mockShareholders];
        this.shareClasses = data.shareClasses || [...mockShareClasses];
        console.log('📥 Loaded saved data from:', new Date(data.lastSaved));
        this.notify();
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
    }
  }

  // Getters
  getEntities(): Entity[] {
    return [...this.entities];
  }

  getCapTables(): EntityCapTable[] {
    return [...this.capTables];
  }

  getShareholders(): Shareholder[] {
    return [...this.shareholders];
  }

  getShareClasses(): ShareClass[] {
    return [...this.shareClasses];
  }

  getEntityById(id: string): Entity | undefined {
    return this.entities.find(entity => entity.id === id);
  }

  getCapTableByEntityId(entityId: string): EntityCapTable | undefined {
    return this.capTables.find(capTable => capTable.entityId === entityId);
  }

  // Entity mutations
  addEntity(entity: Entity) {
    this.entities.push(entity);
    this.notify();
  }

  updateEntity(id: string, updates: Partial<Entity>) {
    const index = this.entities.findIndex(e => e.id === id);
    if (index !== -1) {
      this.entities[index] = { ...this.entities[index], ...updates };
      this.notify();
    }
  }

  deleteEntity(id: string) {
    this.entities = this.entities.filter(e => e.id !== id);
    this.capTables = this.capTables.filter(ct => ct.entityId !== id);
    // Remove any shareholdings by this entity
    this.shareholders = this.shareholders.filter(s => s.entityId !== id);
    this.capTables.forEach(capTable => {
      capTable.investments = capTable.investments.filter(inv => {
        const shareholder = this.shareholders.find(s => s.id === inv.shareholderId);
        return shareholder?.entityId !== id;
      });
    });
    this.notify();
  }

  // Investment/shareholding mutations
  updateOwnership(sourceEntityId: string, targetEntityId: string, ownershipPercentage: number) {
    console.log('📊 Updating ownership:', sourceEntityId, '->', targetEntityId, ownershipPercentage + '%');
    
    // Find or create shareholder record for the source entity
    let shareholder = this.shareholders.find(s => s.entityId === sourceEntityId);
    if (!shareholder) {
      const sourceEntity = this.getEntityById(sourceEntityId);
      if (sourceEntity) {
        shareholder = {
          id: `shareholder-${sourceEntityId}`,
          name: sourceEntity.name,
          type: 'Entity',
          entityId: sourceEntityId
        };
        this.shareholders.push(shareholder);
      } else {
        console.error('Source entity not found:', sourceEntityId);
        return;
      }
    }

    // Find or create cap table for target entity
    let capTable = this.getCapTableByEntityId(targetEntityId);
    if (!capTable) {
      capTable = {
        entityId: targetEntityId,
        authorizedShares: 10000000,
        shareholders: [],
        shareClasses: [this.shareClasses[0]], // Default to common stock
        investments: []
      };
      this.capTables.push(capTable);
    }

    // Add shareholder to cap table if not already there
    if (!capTable.shareholders.find(s => s.id === shareholder.id)) {
      capTable.shareholders.push(shareholder);
    }

    // Calculate shares based on percentage
    const sharesOwned = Math.round((ownershipPercentage / 100) * capTable.authorizedShares);

    // Find or create investment record
    let investment = capTable.investments.find(inv => inv.shareholderId === shareholder.id);
    if (investment) {
      investment.sharesOwned = sharesOwned;
      investment.investmentAmount = sharesOwned * investment.pricePerShare;
    } else {
      investment = {
        id: `inv-${Date.now()}`,
        shareholderId: shareholder.id,
        shareClassId: this.shareClasses[0].id,
        sharesOwned,
        pricePerShare: 1.00,
        investmentAmount: sharesOwned,
        investmentDate: new Date()
      };
      capTable.investments.push(investment);
    }

    this.notify();
  }

  removeOwnership(sourceEntityId: string, targetEntityId: string) {
    const capTable = this.getCapTableByEntityId(targetEntityId);
    if (capTable) {
      const shareholder = this.shareholders.find(s => s.entityId === sourceEntityId);
      if (shareholder) {
        capTable.investments = capTable.investments.filter(inv => inv.shareholderId !== shareholder.id);
        capTable.shareholders = capTable.shareholders.filter(s => s.id !== shareholder.id);
        this.notify();
      }
    }
  }

  // Add new stakeholder
  addStakeholder(entityId: string, stakeholder: { name: string; shareClass: string; sharesOwned: number; type?: 'Individual' | 'Entity' | 'Pool' }) {
    const capTable = this.getCapTableByEntityId(entityId);
    if (!capTable) return;

    const newShareholder: Shareholder = {
      id: `stakeholder-${Date.now()}`,
      name: stakeholder.name,
      type: stakeholder.type || 'Individual'
    };

    const shareClass = this.shareClasses.find(sc => sc.name === stakeholder.shareClass) || this.shareClasses[0];

    const newInvestment: Investment = {
      id: `inv-${Date.now()}`,
      shareholderId: newShareholder.id,
      shareClassId: shareClass.id,
      sharesOwned: stakeholder.sharesOwned,
      pricePerShare: 1.00,
      investmentAmount: stakeholder.sharesOwned,
      investmentDate: new Date()
    };

    this.shareholders.push(newShareholder);
    capTable.shareholders.push(newShareholder);
    capTable.investments.push(newInvestment);

    this.notify();
  }

  // Update stakeholder
  updateStakeholder(entityId: string, stakeholderId: string, updates: { name?: string; shareClass?: string; sharesOwned?: number }) {
    const capTable = this.getCapTableByEntityId(entityId);
    if (!capTable) return;

    const investment = capTable.investments.find(inv => inv.shareholderId === stakeholderId);
    const shareholder = this.shareholders.find(s => s.id === stakeholderId);

    if (investment && shareholder) {
      if (updates.name) {
        shareholder.name = updates.name;
        const capTableShareholder = capTable.shareholders.find(s => s.id === stakeholderId);
        if (capTableShareholder) {
          capTableShareholder.name = updates.name;
        }
      }

      if (updates.shareClass) {
        const shareClass = this.shareClasses.find(sc => sc.name === updates.shareClass);
        if (shareClass) {
          investment.shareClassId = shareClass.id;
        }
      }

      if (updates.sharesOwned !== undefined) {
        investment.sharesOwned = updates.sharesOwned;
        investment.investmentAmount = updates.sharesOwned * investment.pricePerShare;
      }

      this.notify();
    }
  }

  // Delete stakeholder
  deleteStakeholder(entityId: string, stakeholderId: string) {
    const capTable = this.getCapTableByEntityId(entityId);
    if (!capTable) return;

    capTable.investments = capTable.investments.filter(inv => inv.shareholderId !== stakeholderId);
    capTable.shareholders = capTable.shareholders.filter(s => s.id !== stakeholderId);

    this.notify();
  }
}

// Create singleton instance
export const dataStore = new DataStore();

// Load saved data on initialization
dataStore.loadSavedData();
