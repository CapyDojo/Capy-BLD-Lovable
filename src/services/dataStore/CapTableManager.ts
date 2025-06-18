
import { EntityCapTable, Shareholder, ShareClass } from '@/types/capTable';
import { ShareholderManager } from './managers/ShareholderManager';
import { InvestmentManager } from './managers/InvestmentManager';
import { CapTableOperations } from './managers/CapTableOperations';

export class CapTableManager {
  private capTables: EntityCapTable[];
  private shareClasses: ShareClass[];
  private notifyChange: () => void;
  private shareholderManager: ShareholderManager;
  private investmentManager: InvestmentManager;
  private capTableOperations: CapTableOperations;

  constructor(
    initialCapTables: EntityCapTable[],
    initialShareholders: Shareholder[],
    initialShareClasses: ShareClass[],
    notifyChange: () => void
  ) {
    this.capTables = [...initialCapTables];
    this.shareClasses = [...initialShareClasses];
    this.notifyChange = notifyChange;
    
    // Initialize managers
    this.shareholderManager = new ShareholderManager(initialShareholders);
    this.investmentManager = new InvestmentManager();
    this.capTableOperations = new CapTableOperations(
      this.shareholderManager,
      this.investmentManager,
      this.shareClasses
    );
  }

  setEntityAccessor(getEntity: (id: string) => any | undefined) {
    this.shareholderManager.setEntityAccessor(getEntity);
  }

  getCapTables(): EntityCapTable[] {
    return [...this.capTables];
  }

  getShareholders(): Shareholder[] {
    return this.shareholderManager.getShareholders();
  }

  getShareClasses(): ShareClass[] {
    return [...this.shareClasses];
  }

  getCapTableByEntityId(entityId: string): EntityCapTable | undefined {
    return this.capTables.find(capTable => capTable.entityId === entityId);
  }

  updateOwnership(sourceEntityId: string, targetEntityId: string, ownershipPercentage: number): void {
    this.capTableOperations.updateOwnership(this.capTables, sourceEntityId, targetEntityId, ownershipPercentage);
    this.notifyChange();
  }

  removeOwnership(sourceEntityId: string, targetEntityId: string): void {
    this.capTableOperations.removeOwnership(this.capTables, sourceEntityId, targetEntityId);
    this.notifyChange();
  }

  addStakeholder(entityId: string, stakeholder: { name: string; shareClass: string; sharesOwned: number; type?: 'Individual' | 'Entity' | 'Pool' }): void {
    this.capTableOperations.addStakeholder(this.capTables, entityId, stakeholder);
    this.notifyChange();
  }

  updateStakeholder(entityId: string, stakeholderId: string, updates: { name?: string; shareClass?: string; sharesOwned?: number }): void {
    this.capTableOperations.updateStakeholder(this.capTables, entityId, stakeholderId, updates);
    this.notifyChange();
  }

  deleteStakeholder(entityId: string, stakeholderId: string): void {
    this.capTableOperations.deleteStakeholder(this.capTables, entityId, stakeholderId);
    this.notifyChange();
  }

  cleanupEntityData(entityId: string): void {
    this.capTables = this.capTableOperations.cleanupEntityData(this.capTables, entityId);
  }

  updateData(newCapTables: EntityCapTable[], newShareholders: Shareholder[], newShareClasses: ShareClass[]): void {
    this.capTables = [...newCapTables];
    this.shareholderManager.updateData(newShareholders);
    this.shareClasses = [...newShareClasses];
  }

  updateShareholderDirect(shareholderId: string, updates: Partial<Shareholder>) {
    console.log('📝 CapTableManager: Direct shareholder update:', shareholderId, updates);
    
    const success = this.shareholderManager.updateShareholder(shareholderId, updates);
    if (!success) {
      console.warn('⚠️ Shareholder not found for direct update:', shareholderId);
      return;
    }
    
    console.log('✅ Direct shareholder update completed');
    this.notifyChange();
  }
}
