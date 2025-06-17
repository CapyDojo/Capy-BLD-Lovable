
// Unified Repository exports
export { IUnifiedEntityRepository, IUnifiedRepositoryFactory, RepositoryEvent, RepositoryType } from './IUnifiedRepository';
export { EnterpriseRepositoryAdapter } from './EnterpriseRepositoryAdapter';
export { LegacyRepositoryAdapter } from './LegacyRepositoryAdapter';
export { UnifiedRepositoryFactory, unifiedRepositoryFactory } from './UnifiedRepositoryFactory';

// Convenience function to get the appropriate repository
export async function getUnifiedRepository(type?: RepositoryType) {
  const factory = unifiedRepositoryFactory;
  
  if (type) {
    return factory.createRepository(type);
  }
  
  return factory.getActiveRepository();
}
