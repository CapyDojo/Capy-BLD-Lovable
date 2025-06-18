
// Unified Repository exports
export type { IUnifiedEntityRepository, IUnifiedRepositoryFactory, RepositoryEvent, RepositoryType } from './IUnifiedRepository';
export { EnterpriseRepositoryAdapter } from './EnterpriseRepositoryAdapter';
export { UnifiedRepositoryFactory, createUnifiedRepository } from './UnifiedRepositoryFactory';
export { RepositorySingleton } from './RepositorySingleton';

// Import the factory class to create an instance
import { UnifiedRepositoryFactory } from './UnifiedRepositoryFactory';
import { RepositorySingleton } from './RepositorySingleton';

// Create and export the factory instance
const unifiedRepositoryFactory = new UnifiedRepositoryFactory();
export { unifiedRepositoryFactory };

// Convenience function to get the appropriate repository (singleton pattern)
export async function getUnifiedRepository(type: 'ENTERPRISE' = 'ENTERPRISE') {
  return RepositorySingleton.getInstance();
}
