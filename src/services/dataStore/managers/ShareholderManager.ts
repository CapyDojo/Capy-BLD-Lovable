
import { Shareholder } from '@/types/capTable';
import { Entity } from '@/types/entity';

export class ShareholderManager {
  private shareholders: Shareholder[];
  private getEntity?: (id: string) => Entity | undefined;

  constructor(initialShareholders: Shareholder[]) {
    this.shareholders = [...initialShareholders];
  }

  setEntityAccessor(getEntity: (id: string) => Entity | undefined) {
    this.getEntity = getEntity;
  }

  getShareholders(): Shareholder[] {
    return [...this.shareholders];
  }

  findShareholderByEntityId(entityId: string): Shareholder | undefined {
    return this.shareholders.find(s => s.entityId === entityId);
  }

  createShareholderForEntity(sourceEntityId: string): Shareholder {
    const sourceEntity = this.getEntity?.(sourceEntityId);
    const shareholder: Shareholder = {
      id: `shareholder-${sourceEntityId}`,
      name: sourceEntity?.name || `Entity ${sourceEntityId}`,
      type: 'Entity',
      entityId: sourceEntityId
    };
    this.shareholders.push(shareholder);
    return shareholder;
  }

  addShareholder(shareholder: Shareholder): void {
    this.shareholders.push(shareholder);
  }

  removeShareholder(shareholderId: string): void {
    this.shareholders = this.shareholders.filter(s => s.id !== shareholderId);
  }

  removeShareholderByEntityId(entityId: string): void {
    this.shareholders = this.shareholders.filter(s => s.entityId !== entityId);
  }

  updateShareholder(shareholderId: string, updates: Partial<Shareholder>): boolean {
    const shareholderIndex = this.shareholders.findIndex(s => s.id === shareholderId);
    if (shareholderIndex === -1) return false;

    this.shareholders[shareholderIndex] = {
      ...this.shareholders[shareholderIndex],
      ...updates
    };
    return true;
  }

  updateData(newShareholders: Shareholder[]): void {
    this.shareholders = [...newShareholders];
  }
}
