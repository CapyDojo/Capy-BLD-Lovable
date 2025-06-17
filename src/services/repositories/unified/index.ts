
// Unified Repository exports
export type { IUnifiedEntityRepository, IUnifiedRepositoryFactory, RepositoryEvent, RepositoryType } from './IUnifiedRepository';
export { EnterpriseRepositoryAdapter } from './EnterpriseRepositoryAdapter';
export { LegacyRepositoryAdapter } from './LegacyRepositoryAdapter';
export { UnifiedRepositoryFactory } from './UnifiedRepositoryFactory';

// Create and export the factory instance
const unifiedRepositoryFactory = new UnifiedRepositoryFactory();
export { unifiedRepositoryFactory };

// Convenience function to get the appropriate repository
export async function getUnifiedRepository(type?: import('./IUnifiedRepository').RepositoryType) {
  if (type) {
    return unifiedRepositoryFactory.createRepository(type);
  }
  
  return unifiedRepositoryFactory.getActiveRepository();
}
