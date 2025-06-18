
import { ShareClass } from '@/types/entity';
import { ShareClassRepository } from './interfaces';

export class LocalStorageShareClassRepository implements ShareClassRepository {
  private readonly storageKey = 'shareClasses';

  private getShareClasses(): ShareClass[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data).map(this.deserializeShareClass) : [];
    } catch (error) {
      console.error('Failed to load share classes from localStorage:', error);
      return [];
    }
  }

  private saveShareClasses(shareClasses: ShareClass[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(shareClasses.map(this.serializeShareClass)));
    } catch (error) {
      console.error('Failed to save share classes to localStorage:', error);
      throw error;
    }
  }

  private serializeShareClass(shareClass: ShareClass): any {
    return {
      ...shareClass,
      createdAt: shareClass.createdAt.toISOString(),
      updatedAt: shareClass.updatedAt.toISOString(),
    };
  }

  private deserializeShareClass(data: any): ShareClass {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  }

  async create(shareClassData: Omit<ShareClass, 'createdAt' | 'updatedAt'>): Promise<ShareClass> {
    const shareClasses = this.getShareClasses();
    
    // Check for duplicate IDs
    if (shareClasses.find(sc => sc.id === shareClassData.id)) {
      throw new Error(`ShareClass with ID ${shareClassData.id} already exists`);
    }

    const shareClass: ShareClass = {
      ...shareClassData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    shareClasses.push(shareClass);
    this.saveShareClasses(shareClasses);
    console.log('📝 Created share class:', shareClass.id, shareClass.name);
    return shareClass;
  }

  async update(id: string, updates: Partial<ShareClass>): Promise<ShareClass> {
    const shareClasses = this.getShareClasses();
    const index = shareClasses.findIndex(sc => sc.id === id);
    
    if (index === -1) {
      throw new Error(`ShareClass with ID ${id} not found`);
    }

    const shareClass = shareClasses[index];
    const updatedShareClass: ShareClass = {
      ...shareClass,
      ...updates,
      id: shareClass.id, // Prevent ID changes
      createdAt: shareClass.createdAt, // Prevent createdAt changes
      updatedAt: new Date(),
    };

    shareClasses[index] = updatedShareClass;
    this.saveShareClasses(shareClasses);
    console.log('📝 Updated share class:', id);
    return updatedShareClass;
  }

  async delete(id: string): Promise<void> {
    const shareClasses = this.getShareClasses();
    const filteredShareClasses = shareClasses.filter(sc => sc.id !== id);
    
    if (shareClasses.length === filteredShareClasses.length) {
      throw new Error(`ShareClass with ID ${id} not found`);
    }

    this.saveShareClasses(filteredShareClasses);
    console.log('🗑️ Deleted share class:', id);
  }

  async findById(id: string): Promise<ShareClass | null> {
    const shareClasses = this.getShareClasses();
    return shareClasses.find(sc => sc.id === id) || null;
  }

  async findByEntity(entityId: string): Promise<ShareClass[]> {
    const shareClasses = this.getShareClasses();
    return shareClasses.filter(sc => sc.entityId === entityId);
  }

  async findAll(): Promise<ShareClass[]> {
    return this.getShareClasses();
  }
}
