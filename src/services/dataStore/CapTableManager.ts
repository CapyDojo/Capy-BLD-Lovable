
import { EntityCapTable, Shareholder, ShareClass, Investment } from '@/types/capTable';

export class CapTableManager {
  private capTables: EntityCapTable[] = [];
  private shareholders: Shareholder[] = [];
  private shareClasses: ShareClass[] = [];
  private notifyChange: () => void;

  constructor(
    initialCapTables: EntityCapTable[],
    initialShareholders: Shareholder[],
    initialShareClasses: ShareClass[],
    notifyChange: () => void
  ) {
    this.capTables = [...initialCapTables];
    this.shareholders = [...initialShareholders];
    this.shareClasses = [...initialShareClasses];
    this.notifyChange = notifyChange;
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

  getCapTableByEntityId(entityId: string): EntityCapTable | undefined {
    return this.capTables.find(capTable => capTable.entityId === entityId);
  }

  updateOwnership(sourceEntityId: string, targetEntityId: string, ownershipPercentage: number): void {
    console.log('📊 Updating ownership:', sourceEntityId, '->', targetEntityId, ownershipPercentage + '%');
    
    // Find or create shareholder record for the source entity
    let shareholder = this.shareholders.find(s => s.entityId === sourceEntityId);
    if (!shareholder) {
      shareholder = {
        id: `shareholder-${sourceEntityId}`,
        name: `Entity ${sourceEntityId}`,
        type: 'Entity',
        entityId: sourceEntityId
      };
      this.shareholders.push(shareholder);
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

    this.notifyChange();
  }

  removeOwnership(sourceEntityId: string, targetEntityId: string): void {
    const capTable = this.getCapTableByEntityId(targetEntityId);
    if (capTable) {
      const shareholder = this.shareholders.find(s => s.entityId === sourceEntityId);
      if (shareholder) {
        capTable.investments = capTable.investments.filter(inv => inv.shareholderId !== shareholder.id);
        capTable.shareholders = capTable.shareholders.filter(s => s.id !== shareholder.id);
        this.notifyChange();
      }
    }
  }

  addStakeholder(entityId: string, stakeholder: { name: string; shareClass: string; sharesOwned: number; type?: 'Individual' | 'Entity' | 'Pool' }): void {
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

    this.notifyChange();
  }

  updateStakeholder(entityId: string, stakeholderId: string, updates: { name?: string; shareClass?: string; sharesOwned?: number }): void {
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

      this.notifyChange();
    }
  }

  deleteStakeholder(entityId: string, stakeholderId: string): void {
    const capTable = this.getCapTableByEntityId(entityId);
    if (!capTable) return;

    capTable.investments = capTable.investments.filter(inv => inv.shareholderId !== stakeholderId);
    capTable.shareholders = capTable.shareholders.filter(s => s.id !== stakeholderId);

    this.notifyChange();
  }

  cleanupEntityData(entityId: string): void {
    this.capTables = this.capTables.filter(ct => ct.entityId !== entityId);
    // Remove any shareholdings by this entity
    this.shareholders = this.shareholders.filter(s => s.entityId !== entityId);
    this.capTables.forEach(capTable => {
      capTable.investments = capTable.investments.filter(inv => {
        const shareholder = this.shareholders.find(s => s.id === inv.shareholderId);
        return shareholder?.entityId !== entityId;
      });
    });
  }

  updateData(newCapTables: EntityCapTable[], newShareholders: Shareholder[], newShareClasses: ShareClass[]): void {
    this.capTables = [...newCapTables];
    this.shareholders = [...newShareholders];
    this.shareClasses = [...newShareClasses];
  }
}
