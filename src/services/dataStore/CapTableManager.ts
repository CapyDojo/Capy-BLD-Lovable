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
    console.log('🗑️ CapTableManager: Starting deletion of stakeholder:', stakeholderId, 'from entity:', entityId);
    
    const capTable = this.getCapTableByEntityId(entityId);
    if (!capTable) {
      console.warn('⚠️ No cap table found for entity:', entityId);
      return;
    }

    // Log current state before deletion
    console.log('📊 Before deletion - Global shareholders:', this.shareholders.length);
    console.log('📊 Before deletion - Cap table shareholders:', capTable.shareholders.length);
    console.log('📊 Before deletion - Cap table investments:', capTable.investments.length);

    // Find the investment to get the actual shareholderId
    const investment = capTable.investments.find(inv => inv.id === stakeholderId || inv.shareholderId === stakeholderId);
    const actualShareholderId = investment?.shareholderId || stakeholderId;
    
    console.log('🔍 Found investment for deletion:', investment);
    console.log('🔍 Actual shareholder ID to delete:', actualShareholderId);

    // 1. Remove from the entity's cap table investments
    const beforeInvestments = capTable.investments.length;
    capTable.investments = capTable.investments.filter(inv => 
      inv.id !== stakeholderId && 
      inv.shareholderId !== stakeholderId && 
      inv.shareholderId !== actualShareholderId
    );
    const afterInvestments = capTable.investments.length;
    console.log('🗑️ Removed investments:', beforeInvestments - afterInvestments);

    // 2. Remove from the entity's cap table shareholders
    const beforeCapTableShareholders = capTable.shareholders.length;
    capTable.shareholders = capTable.shareholders.filter(s => 
      s.id !== stakeholderId && 
      s.id !== actualShareholderId
    );
    const afterCapTableShareholders = capTable.shareholders.length;
    console.log('🗑️ Removed cap table shareholders:', beforeCapTableShareholders - afterCapTableShareholders);

    // 3. CRITICAL: Remove from the global shareholders array
    const beforeGlobalShareholders = this.shareholders.length;
    this.shareholders = this.shareholders.filter(s => 
      s.id !== stakeholderId && 
      s.id !== actualShareholderId
    );
    const afterGlobalShareholders = this.shareholders.length;
    console.log('🗑️ Removed global shareholders:', beforeGlobalShareholders - afterGlobalShareholders);

    // 4. Remove from ALL other cap tables where this shareholder might appear
    let totalRemovedFromOtherTables = 0;
    this.capTables.forEach(otherCapTable => {
      if (otherCapTable.entityId !== entityId) {
        const beforeOtherInvestments = otherCapTable.investments.length;
        const beforeOtherShareholders = otherCapTable.shareholders.length;
        
        otherCapTable.investments = otherCapTable.investments.filter(inv => 
          inv.shareholderId !== stakeholderId && 
          inv.shareholderId !== actualShareholderId
        );
        
        otherCapTable.shareholders = otherCapTable.shareholders.filter(s => 
          s.id !== stakeholderId && 
          s.id !== actualShareholderId
        );
        
        const removedInvestments = beforeOtherInvestments - otherCapTable.investments.length;
        const removedShareholders = beforeOtherShareholders - otherCapTable.shareholders.length;
        totalRemovedFromOtherTables += removedInvestments + removedShareholders;
        
        if (removedInvestments > 0 || removedShareholders > 0) {
          console.log(`🗑️ Removed from ${otherCapTable.entityId}:`, { investments: removedInvestments, shareholders: removedShareholders });
        }
      }
    });

    console.log('🗑️ Total items removed from other cap tables:', totalRemovedFromOtherTables);

    // Final verification
    const remainingInvestments = capTable.investments.filter(inv => 
      inv.id === stakeholderId || 
      inv.shareholderId === stakeholderId || 
      inv.shareholderId === actualShareholderId
    );
    
    const remainingGlobalShareholders = this.shareholders.filter(s => 
      s.id === stakeholderId || 
      s.id === actualShareholderId
    );

    if (remainingInvestments.length > 0) {
      console.error('❌ CRITICAL: Investments still remain after deletion:', remainingInvestments);
    }
    
    if (remainingGlobalShareholders.length > 0) {
      console.error('❌ CRITICAL: Global shareholders still remain after deletion:', remainingGlobalShareholders);
    }

    if (remainingInvestments.length === 0 && remainingGlobalShareholders.length === 0) {
      console.log('✅ Stakeholder completely removed from all data structures');
    }

    this.notifyChange();
  }

  cleanupEntityData(entityId: string): void {
    console.log('🧹 Cleaning up cap table data for deleted entity:', entityId);
    
    // Remove the cap table for this entity
    const originalCapTablesCount = this.capTables.length;
    this.capTables = this.capTables.filter(ct => ct.entityId !== entityId);
    console.log('🗑️ Removed cap tables:', originalCapTablesCount - this.capTables.length);
    
    // Remove any shareholders that represent this entity
    const originalShareholdersCount = this.shareholders.length;
    this.shareholders = this.shareholders.filter(s => s.entityId !== entityId);
    console.log('🗑️ Removed entity shareholders:', originalShareholdersCount - this.shareholders.length);
    
    // Remove investments by this entity from all other cap tables
    let removedInvestments = 0;
    this.capTables.forEach(capTable => {
      const originalInvestmentsCount = capTable.investments.length;
      
      // Remove investments where the shareholder represents the deleted entity
      capTable.investments = capTable.investments.filter(inv => {
        const shareholder = this.shareholders.find(s => s.id === inv.shareholderId);
        return shareholder?.entityId !== entityId;
      });
      
      // Remove shareholders that represent the deleted entity
      capTable.shareholders = capTable.shareholders.filter(s => s.entityId !== entityId);
      
      removedInvestments += originalInvestmentsCount - capTable.investments.length;
    });
    
    console.log('🗑️ Removed investments by deleted entity:', removedInvestments);
    console.log('✅ Cap table cleanup complete');
  }

  updateData(newCapTables: EntityCapTable[], newShareholders: Shareholder[], newShareClasses: ShareClass[]): void {
    this.capTables = [...newCapTables];
    this.shareholders = [...newShareholders];
    this.shareClasses = [...newShareClasses];
  }
}
