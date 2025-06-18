
import { EntityCapTable, Shareholder, ShareClass, Investment } from '@/types/capTable';
import { ShareholderManager } from './ShareholderManager';
import { InvestmentManager } from './InvestmentManager';

export class CapTableOperations {
  private shareholderManager: ShareholderManager;
  private investmentManager: InvestmentManager;
  private shareClasses: ShareClass[];

  constructor(
    shareholderManager: ShareholderManager,
    investmentManager: InvestmentManager,
    shareClasses: ShareClass[]
  ) {
    this.shareholderManager = shareholderManager;
    this.investmentManager = investmentManager;
    this.shareClasses = shareClasses;
  }

  updateOwnership(
    capTables: EntityCapTable[],
    sourceEntityId: string,
    targetEntityId: string,
    ownershipPercentage: number
  ): void {
    console.log('📊 CapTableOperations: Updating ownership:', sourceEntityId, '->', targetEntityId, ownershipPercentage + '%');
    
    // Find or create shareholder record for the source entity
    let shareholder = this.shareholderManager.findShareholderByEntityId(sourceEntityId);
    if (!shareholder) {
      shareholder = this.shareholderManager.createShareholderForEntity(sourceEntityId);
    }

    // Find or create cap table for target entity
    let capTable = capTables.find(ct => ct.entityId === targetEntityId);
    if (!capTable) {
      capTable = {
        entityId: targetEntityId,
        authorizedShares: 10000000,
        shareClasses: [this.shareClasses[0]], // Default to common stock
        investments: []
      };
      capTables.push(capTable);
    }

    // Calculate shares based on percentage
    const sharesOwned = Math.round((ownershipPercentage / 100) * capTable.authorizedShares);

    // Find or create investment record
    let investment = this.investmentManager.findInvestmentByShareholder(capTable, shareholder.id);
    if (investment) {
      this.investmentManager.updateInvestment(investment, sharesOwned);
    } else {
      const newInvestment = this.investmentManager.createInvestment(
        shareholder.id,
        this.shareClasses[0].id,
        sharesOwned
      );
      this.investmentManager.addInvestment(capTable, newInvestment);
    }

    console.log('✅ CapTableOperations: Ownership updated');
  }

  removeOwnership(capTables: EntityCapTable[], sourceEntityId: string, targetEntityId: string): void {
    console.log('🗑️ CapTableOperations: Removing ownership:', sourceEntityId, '->', targetEntityId);
    const capTable = capTables.find(ct => ct.entityId === targetEntityId);
    if (capTable) {
      const shareholder = this.shareholderManager.findShareholderByEntityId(sourceEntityId);
      if (shareholder) {
        this.investmentManager.removeInvestmentsByShareholder(capTable, shareholder.id);
        console.log('✅ CapTableOperations: Ownership removed');
      }
    }
  }

  addStakeholder(
    capTables: EntityCapTable[],
    entityId: string,
    stakeholder: { name: string; shareClass: string; sharesOwned: number; type?: 'Individual' | 'Entity' | 'Pool' }
  ): void {
    console.log('➕ CapTableOperations: Adding stakeholder to entity:', entityId, stakeholder);
    const capTable = capTables.find(ct => ct.entityId === entityId);
    if (!capTable) return;

    const newShareholder: Shareholder = {
      id: `stakeholder-${Date.now()}`,
      name: stakeholder.name,
      type: stakeholder.type || 'Individual'
    };

    const shareClass = this.shareClasses.find(sc => sc.name === stakeholder.shareClass) || this.shareClasses[0];

    const newInvestment = this.investmentManager.createInvestment(
      newShareholder.id,
      shareClass.id,
      stakeholder.sharesOwned
    );

    this.shareholderManager.addShareholder(newShareholder);
    this.investmentManager.addInvestment(capTable, newInvestment);

    console.log('✅ CapTableOperations: Stakeholder added');
  }

  updateStakeholder(
    capTables: EntityCapTable[],
    entityId: string,
    stakeholderId: string,
    updates: { name?: string; shareClass?: string; sharesOwned?: number }
  ): void {
    console.log('📝 CapTableOperations: Updating stakeholder:', stakeholderId, 'in entity:', entityId, updates);
    const capTable = capTables.find(ct => ct.entityId === entityId);
    if (!capTable) return;

    const investment = capTable.investments.find(inv => inv.shareholderId === stakeholderId || inv.id === stakeholderId);
    
    if (investment) {
      if (updates.name) {
        this.shareholderManager.updateShareholder(investment.shareholderId, { name: updates.name });
      }

      if (updates.shareClass) {
        const shareClass = this.shareClasses.find(sc => sc.name === updates.shareClass);
        if (shareClass) {
          investment.shareClassId = shareClass.id;
        }
      }

      if (updates.sharesOwned !== undefined) {
        this.investmentManager.updateInvestment(investment, updates.sharesOwned);
      }

      console.log('✅ CapTableOperations: Stakeholder updated');
    }
  }

  deleteStakeholder(capTables: EntityCapTable[], entityId: string, stakeholderId: string): void {
    console.log('🗑️ CapTableOperations: Starting deletion of stakeholder:', stakeholderId, 'from entity:', entityId);
    
    const capTable = capTables.find(ct => ct.entityId === entityId);
    if (!capTable) {
      console.warn('⚠️ No cap table found for entity:', entityId);
      return;
    }

    // Find the investment to get the actual shareholderId
    const investment = capTable.investments.find(inv => inv.id === stakeholderId || inv.shareholderId === stakeholderId);
    const actualShareholderId = investment?.shareholderId || stakeholderId;
    
    console.log('🔍 Actual shareholder ID to delete:', actualShareholderId);

    // Remove from investments
    this.investmentManager.removeInvestmentsByShareholder(capTable, actualShareholderId);
    this.investmentManager.removeInvestmentById(capTable, stakeholderId);

    // Remove from global shareholders array
    this.shareholderManager.removeShareholder(stakeholderId);
    this.shareholderManager.removeShareholder(actualShareholderId);

    // Remove from all other cap tables where this shareholder might appear
    capTables.forEach(otherCapTable => {
      if (otherCapTable.entityId !== entityId) {
        this.investmentManager.removeInvestmentsByShareholder(otherCapTable, stakeholderId);
        this.investmentManager.removeInvestmentsByShareholder(otherCapTable, actualShareholderId);
      }
    });

    console.log('✅ CapTableOperations: Stakeholder deleted');
  }

  cleanupEntityData(capTables: EntityCapTable[], entityId: string): EntityCapTable[] {
    console.log('🧹 Cleaning up cap table data for deleted entity:', entityId);
    
    // Remove the cap table for this entity
    const updatedCapTables = capTables.filter(ct => ct.entityId !== entityId);
    
    // Remove any shareholders that represent this entity
    this.shareholderManager.removeShareholderByEntityId(entityId);
    
    // Remove investments by this entity from all other cap tables
    updatedCapTables.forEach(capTable => {
      const shareholders = this.shareholderManager.getShareholders();
      capTable.investments = capTable.investments.filter(inv => {
        const shareholder = shareholders.find(s => s.id === inv.shareholderId);
        return shareholder?.entityId !== entityId;
      });
    });
    
    console.log('✅ Cap table cleanup complete');
    return updatedCapTables;
  }
}
