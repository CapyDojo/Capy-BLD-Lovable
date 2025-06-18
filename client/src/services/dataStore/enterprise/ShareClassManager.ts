
import { ShareClass } from '@/types/entity';
import { EnterpriseDataError, ReferentialIntegrityError } from '@/types/enterprise';
import { ValidationResult } from '@/types/unified';
import { BaseEnterpriseStore } from './BaseEnterpriseStore';

export class ShareClassManager extends BaseEnterpriseStore {
  private shareClasses: Map<string, ShareClass> = new Map();

  async createShareClass(shareClass: Omit<ShareClass, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<ShareClass> {
    const id = `shareclass-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newShareClass: ShareClass = {
      ...shareClass,
      id,
      createdAt: now,
      updatedAt: now
    };

    // Store share class
    this.shareClasses.set(id, newShareClass);

    console.log('✅ ShareClassManager: Created share class', newShareClass.name, id);
    return newShareClass;
  }

  async updateShareClass(id: string, updates: Partial<ShareClass>, updatedBy: string, reason: string): Promise<ShareClass> {
    const existingShareClass = this.shareClasses.get(id);
    if (!existingShareClass) {
      throw new EnterpriseDataError(`Share class ${id} not found`, 'SHARE_CLASS_NOT_FOUND', id);
    }

    const updatedShareClass: ShareClass = {
      ...existingShareClass,
      ...updates,
      id,
      updatedAt: new Date()
    };

    this.shareClasses.set(id, updatedShareClass);
    return updatedShareClass;
  }

  async deleteShareClass(id: string, deletedBy: string, reason: string, ownerships: any[]): Promise<void> {
    const shareClass = this.shareClasses.get(id);
    if (!shareClass) {
      throw new EnterpriseDataError(`Share class ${id} not found`, 'SHARE_CLASS_NOT_FOUND', id);
    }

    // Validation - check if share class is referenced by any ownerships
    const referencingOwnerships = ownerships.filter(o => o.shareClassId === id);
    
    if (referencingOwnerships.length > 0) {
      throw new ReferentialIntegrityError(
        `Cannot delete share class ${id} - it is referenced by ${referencingOwnerships.length} ownership records`,
        id,
        referencingOwnerships.map(o => o.id)
      );
    }

    this.shareClasses.delete(id);
    console.log('✅ ShareClassManager: Deleted share class', id);
  }

  async getShareClass(id: string): Promise<ShareClass | null> {
    return this.shareClasses.get(id) || null;
  }

  async getShareClassesByEntity(entityId: string): Promise<ShareClass[]> {
    return Array.from(this.shareClasses.values()).filter(sc => sc.entityId === entityId);
  }

  async validateShareClassDeletion(shareClassId: string, ownerships: any[]): Promise<ValidationResult> {
    const referencingOwnerships = ownerships.filter(o => o.shareClassId === shareClassId);
    
    if (referencingOwnerships.length > 0) {
      return {
        isValid: false,
        errors: [{
          code: 'SHARE_CLASS_IN_USE',
          message: `Cannot delete share class - it is used by ${referencingOwnerships.length} ownership records`,
          field: 'shareClass'
        }],
        warnings: []
      };
    }

    return { isValid: true, errors: [], warnings: [] };
  }

  // Method to restore share classes from backup
  restoreShareClasses(shareClassesData: [string, ShareClass][]): void {
    this.shareClasses = new Map(shareClassesData);
  }

  // Method to export share classes for backup
  exportShareClasses(): [string, ShareClass][] {
    return Array.from(this.shareClasses.entries());
  }
}
