
import { IUnifiedEntityRepository } from './IUnifiedRepository';
import { createUnifiedRepository } from './UnifiedRepositoryFactory';

class RepositorySingleton {
  private static instance: IUnifiedEntityRepository | null = null;
  private static initPromise: Promise<IUnifiedEntityRepository> | null = null;

  static async getInstance(): Promise<IUnifiedEntityRepository> {
    if (this.instance) {
      return this.instance;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.createInstance();
    this.instance = await this.initPromise;
    this.initPromise = null;
    
    return this.instance;
  }

  private static async createInstance(): Promise<IUnifiedEntityRepository> {
    console.log('🏭 RepositorySingleton: Creating unified repository instance');
    return createUnifiedRepository('ENTERPRISE');
  }

  static reset(): void {
    console.log('🔄 RepositorySingleton: Resetting instance');
    this.instance = null;
    this.initPromise = null;
  }
}

export { RepositorySingleton };
