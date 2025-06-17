
import { Entity, ShareClass } from '@/types/entity';
import { UnifiedOwnership, AuditEntry } from '@/types/unified';

// Fresh mock data designed for the unified enterprise architecture
// This replaces the legacy dual entity/cap-table system

// Mock entities - clean startup structure for testing
export const unifiedMockEntities: Entity[] = [
  // Individual founders
  {
    id: 'founder-sarah',
    name: 'Sarah Williams',
    type: 'Individual',
    address: '100 Startup Lane, San Francisco, CA 94105',
    position: { x: 50, y: 100 },
    metadata: { role: 'CEO', email: 'sarah@techcorp.com' },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    version: 1,
  },
  {
    id: 'founder-mike',
    name: 'Mike Rodriguez',
    type: 'Individual',
    address: '200 Innovation Ave, Palo Alto, CA 94301',
    position: { x: 250, y: 100 },
    metadata: { role: 'CTO', email: 'mike@techcorp.com' },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    version: 1,
  },
  
  // Parent company
  {
    id: 'nexus-corp',
    name: 'NexusCorp Inc',
    type: 'Corporation',
    jurisdiction: 'Delaware',
    registrationNumber: 'DE-CORP-2023001',
    incorporationDate: new Date('2023-02-01'),
    address: '500 Corporate Blvd, San Francisco, CA 94105',
    position: { x: 150, y: 200 },
    metadata: { sector: 'Technology', employees: 45 },
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2023-02-01'),
    version: 1,
  },
  
  // VC Fund
  {
    id: 'vertex-capital',
    name: 'Vertex Capital Partners',
    type: 'Partnership',
    jurisdiction: 'Delaware',
    registrationNumber: 'DE-VC-2020001',
    incorporationDate: new Date('2020-01-01'),
    address: '1 Sand Hill Road, Menlo Park, CA 94025',
    position: { x: 150, y: 50 },
    metadata: { fundSize: '500M', vintage: '2020' },
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2020-01-01'),
    version: 1,
  },
  
  // Subsidiary companies
  {
    id: 'ai-division',
    name: 'AI Division LLC',
    type: 'LLC',
    jurisdiction: 'California',
    registrationNumber: 'CA-LLC-2023001',
    incorporationDate: new Date('2023-06-01'),
    address: '100 AI Street, San Jose, CA 95110',
    position: { x: 50, y: 350 },
    metadata: { focus: 'Artificial Intelligence', team: 12 },
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2023-06-01'),
    version: 1,
  },
  
  {
    id: 'data-systems',
    name: 'Data Systems Inc',
    type: 'Corporation',
    jurisdiction: 'Delaware',
    registrationNumber: 'DE-CORP-2023002',
    incorporationDate: new Date('2023-08-01'),
    address: '200 Data Drive, Austin, TX 78701',
    position: { x: 250, y: 350 },
    metadata: { focus: 'Data Analytics', team: 8 },
    createdAt: new Date('2023-08-01'),
    updatedAt: new Date('2023-08-01'),
    version: 1,
  },
];

// Mock share classes for unified architecture
export const unifiedMockShareClasses: ShareClass[] = [
  // NexusCorp share classes
  {
    id: 'nexus-common',
    entityId: 'nexus-corp',
    name: 'Common Stock',
    type: 'Common Stock',
    totalAuthorizedShares: 10000000,
    votingRights: true,
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2023-02-01'),
  },
  {
    id: 'nexus-preferred-seed',
    entityId: 'nexus-corp',
    name: 'Preferred Seed',
    type: 'Preferred Seed',
    totalAuthorizedShares: 2000000,
    votingRights: true,
    liquidationPreference: 1.0,
    createdAt: new Date('2023-03-01'),
    updatedAt: new Date('2023-03-01'),
  },
  {
    id: 'nexus-preferred-a',
    entityId: 'nexus-corp',
    name: 'Preferred Series A',
    type: 'Preferred Series A',
    totalAuthorizedShares: 3000000,
    votingRights: true,
    liquidationPreference: 1.0,
    createdAt: new Date('2023-09-01'),
    updatedAt: new Date('2023-09-01'),
  },
  
  // Subsidiary share classes
  {
    id: 'ai-division-units',
    entityId: 'ai-division',
    name: 'LLC Units',
    type: 'Common Stock',
    totalAuthorizedShares: 1000000,
    votingRights: true,
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2023-06-01'),
  },
  {
    id: 'data-systems-common',
    entityId: 'data-systems',
    name: 'Common Stock',
    type: 'Common Stock',
    totalAuthorizedShares: 1000000,
    votingRights: true,
    createdAt: new Date('2023-08-01'),
    updatedAt: new Date('2023-08-01'),
  },
];

// UNIFIED OWNERSHIP MODEL - Single source of truth
export const unifiedMockOwnerships: UnifiedOwnership[] = [
  // Founders own NexusCorp (Common Stock)
  {
    id: 'own-sarah-nexus',
    ownerEntityId: 'founder-sarah',
    ownedEntityId: 'nexus-corp',
    shares: 4000000,
    shareClassId: 'nexus-common',
    effectiveDate: new Date('2023-02-01'),
    createdBy: 'system',
    createdAt: new Date('2023-02-01'),
    updatedBy: 'system',
    updatedAt: new Date('2023-02-01'),
    version: 1,
    changeReason: 'Founder equity allocation',
  },
  {
    id: 'own-mike-nexus',
    ownerEntityId: 'founder-mike',
    ownedEntityId: 'nexus-corp',
    shares: 3500000,
    shareClassId: 'nexus-common',
    effectiveDate: new Date('2023-02-01'),
    createdBy: 'system',
    createdAt: new Date('2023-02-01'),
    updatedBy: 'system',
    updatedAt: new Date('2023-02-01'),
    version: 1,
    changeReason: 'Founder equity allocation',
  },
  
  // Vertex Capital investments
  {
    id: 'own-vertex-nexus-seed',
    ownerEntityId: 'vertex-capital',
    ownedEntityId: 'nexus-corp',
    shares: 2000000,
    shareClassId: 'nexus-preferred-seed',
    effectiveDate: new Date('2023-03-01'),
    createdBy: 'sarah@techcorp.com',
    createdAt: new Date('2023-03-01'),
    updatedBy: 'sarah@techcorp.com',
    updatedAt: new Date('2023-03-01'),
    version: 1,
    changeReason: 'Seed round investment - $5M',
  },
  {
    id: 'own-vertex-nexus-a',
    ownerEntityId: 'vertex-capital',
    ownedEntityId: 'nexus-corp',
    shares: 2500000,
    shareClassId: 'nexus-preferred-a',
    effectiveDate: new Date('2023-09-01'),
    createdBy: 'sarah@techcorp.com',
    createdAt: new Date('2023-09-01'),
    updatedBy: 'sarah@techcorp.com',
    updatedAt: new Date('2023-09-01'),
    version: 1,
    changeReason: 'Series A investment - $15M',
  },
  
  // NexusCorp owns subsidiaries (100% ownership)
  {
    id: 'own-nexus-ai-division',
    ownerEntityId: 'nexus-corp',
    ownedEntityId: 'ai-division',
    shares: 1000000,
    shareClassId: 'ai-division-units',
    effectiveDate: new Date('2023-06-01'),
    createdBy: 'mike@techcorp.com',
    createdAt: new Date('2023-06-01'),
    updatedBy: 'mike@techcorp.com',
    updatedAt: new Date('2023-06-01'),
    version: 1,
    changeReason: 'Subsidiary formation - AI division spinoff',
  },
  {
    id: 'own-nexus-data-systems',
    ownerEntityId: 'nexus-corp',
    ownedEntityId: 'data-systems',
    shares: 900000,
    shareClassId: 'data-systems-common',
    effectiveDate: new Date('2023-08-01'),
    createdBy: 'sarah@techcorp.com',
    createdAt: new Date('2023-08-01'),
    updatedBy: 'sarah@techcorp.com',
    updatedAt: new Date('2023-08-01'),
    version: 1,
    changeReason: 'Subsidiary acquisition - Data analytics company',
  },
];

// Mock audit trail for compliance
export const unifiedMockAuditEntries: AuditEntry[] = [
  {
    id: 'audit-001',
    timestamp: new Date('2023-02-01T10:00:00Z'),
    userId: 'system',
    action: 'CREATE',
    entityType: 'ENTITY',
    entityId: 'nexus-corp',
    newState: { name: 'NexusCorp Inc', type: 'Corporation' },
    changeReason: 'Company incorporation',
    validationsPassed: ['NO_DUPLICATE_ENTITIES', 'VALID_JURISDICTION'],
  },
  {
    id: 'audit-002',
    timestamp: new Date('2023-03-01T14:30:00Z'),
    userId: 'sarah@techcorp.com',
    action: 'CREATE',
    entityType: 'OWNERSHIP',
    entityId: 'own-vertex-nexus-seed',
    relatedEntityIds: ['vertex-capital', 'nexus-corp'],
    newState: { shares: 2000000, shareClassId: 'nexus-preferred-seed' },
    changeReason: 'Seed round investment - $5M',
    validationsPassed: ['NO_CIRCULAR_OWNERSHIP', 'OWNER_ENTITY_EXISTS', 'OWNED_ENTITY_EXISTS'],
  },
  {
    id: 'audit-003',
    timestamp: new Date('2023-09-01T16:45:00Z'),
    userId: 'sarah@techcorp.com',
    action: 'CREATE',
    entityType: 'OWNERSHIP',
    entityId: 'own-vertex-nexus-a',
    relatedEntityIds: ['vertex-capital', 'nexus-corp'],
    newState: { shares: 2500000, shareClassId: 'nexus-preferred-a' },
    changeReason: 'Series A investment - $15M',
    validationsPassed: ['NO_CIRCULAR_OWNERSHIP', 'NO_OVER_ALLOCATION'],
  },
];

// Helper functions for the unified model
export const getUnifiedEntityById = (id: string): Entity | undefined => {
  return unifiedMockEntities.find(entity => entity.id === id);
};

export const getUnifiedOwnershipsByOwner = (ownerEntityId: string): UnifiedOwnership[] => {
  return unifiedMockOwnerships.filter(ownership => ownership.ownerEntityId === ownerEntityId);
};

export const getUnifiedOwnershipsByOwned = (ownedEntityId: string): UnifiedOwnership[] => {
  return unifiedMockOwnerships.filter(ownership => ownership.ownedEntityId === ownedEntityId);
};

export const getUnifiedShareClassesByEntity = (entityId: string): ShareClass[] => {
  return unifiedMockShareClasses.filter(shareClass => shareClass.entityId === entityId);
};

// Calculate ownership percentages for an entity
export const calculateOwnershipPercentages = (entityId: string): Array<{ownerName: string, percentage: number, shares: number}> => {
  const ownerships = getUnifiedOwnershipsByOwned(entityId);
  const totalShares = ownerships.reduce((sum, ownership) => sum + ownership.shares, 0);
  
  return ownerships.map(ownership => {
    const owner = getUnifiedEntityById(ownership.ownerEntityId);
    return {
      ownerName: owner?.name || 'Unknown',
      percentage: totalShares > 0 ? (ownership.shares / totalShares) * 100 : 0,
      shares: ownership.shares,
    };
  });
};

console.log('🆕 Unified mock data loaded - Enterprise architecture ready');
