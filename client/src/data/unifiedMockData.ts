
// Updated unified mock data with consistent ID generation that matches Enterprise store patterns
import { Entity, ShareClass } from '@/types/entity';
import { UnifiedOwnership } from '@/types/unified';

// Generate consistent IDs that will work with the Enterprise store
const generateId = (prefix: string, seed: string) => `${prefix}-${seed}`;

export const mockEntities: Omit<Entity, 'createdAt' | 'updatedAt' | 'version'>[] = [
  {
    id: generateId('entity', 'sarah-williams'),
    name: 'Sarah Williams',
    type: 'Individual',
    metadata: {},
    position: { x: 100, y: 100 }
  },
  {
    id: generateId('entity', 'mike-rodriguez'),
    name: 'Mike Rodriguez', 
    type: 'Individual',
    metadata: {},
    position: { x: 300, y: 100 }
  },
  {
    id: generateId('entity', 'nexus-corp'),
    name: 'NexusCorp Inc',
    type: 'Corporation',
    jurisdiction: 'Delaware',
    metadata: {},
    position: { x: 200, y: 300 }
  },
  {
    id: generateId('entity', 'vertex-capital'),
    name: 'Vertex Capital Partners',
    type: 'LLC',
    jurisdiction: 'Delaware', 
    metadata: {},
    position: { x: 400, y: 200 }
  },
  {
    id: generateId('entity', 'ai-division'),
    name: 'AI Division LLC',
    type: 'LLC',
    jurisdiction: 'California',
    metadata: {},
    position: { x: 100, y: 500 }
  },
  {
    id: generateId('entity', 'data-systems'),
    name: 'Data Systems Inc',
    type: 'Corporation',
    jurisdiction: 'Delaware',
    metadata: {},
    position: { x: 300, y: 500 }
  }
];

export const mockShareClasses: Omit<ShareClass, 'createdAt' | 'updatedAt'>[] = [
  {
    id: generateId('shareclass', 'nexus-common'),
    entityId: generateId('entity', 'nexus-corp'),
    name: 'Common Stock',
    type: 'Common Stock',
    totalAuthorizedShares: 10000000,
    votingRights: true
  },
  {
    id: generateId('shareclass', 'nexus-seed'),
    entityId: generateId('entity', 'nexus-corp'),
    name: 'Preferred Seed',
    type: 'Preferred Series A',
    totalAuthorizedShares: 2000000,
    votingRights: true,
    liquidationPreference: 1.0
  },
  {
    id: generateId('shareclass', 'nexus-series-a'),
    entityId: generateId('entity', 'nexus-corp'),
    name: 'Preferred Series A',
    type: 'Preferred Series A',
    totalAuthorizedShares: 3000000,
    votingRights: true,
    liquidationPreference: 1.5
  },
  {
    id: generateId('shareclass', 'ai-units'),
    entityId: generateId('entity', 'ai-division'),
    name: 'LLC Units',
    type: 'Common Stock',
    totalAuthorizedShares: 1000000,
    votingRights: true
  },
  {
    id: generateId('shareclass', 'data-common'),
    entityId: generateId('entity', 'data-systems'),
    name: 'Common Stock',
    type: 'Common Stock',
    totalAuthorizedShares: 5000000,
    votingRights: true
  }
];

export const mockOwnerships: Omit<UnifiedOwnership, 'createdAt' | 'updatedAt' | 'version'>[] = [
  {
    id: generateId('ownership', 'sarah-nexus'),
    ownerEntityId: generateId('entity', 'sarah-williams'),
    ownedEntityId: generateId('entity', 'nexus-corp'),
    shares: 4000000,
    shareClassId: generateId('shareclass', 'nexus-common'),
    effectiveDate: new Date('2023-01-01'),
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: generateId('ownership', 'mike-nexus'),
    ownerEntityId: generateId('entity', 'mike-rodriguez'),
    ownedEntityId: generateId('entity', 'nexus-corp'),
    shares: 3000000,
    shareClassId: generateId('shareclass', 'nexus-common'),
    effectiveDate: new Date('2023-01-01'),
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: generateId('ownership', 'vertex-nexus'),
    ownerEntityId: generateId('entity', 'vertex-capital'),
    ownedEntityId: generateId('entity', 'nexus-corp'),
    shares: 2000000,
    shareClassId: generateId('shareclass', 'nexus-seed'),
    effectiveDate: new Date('2023-06-01'),
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: generateId('ownership', 'nexus-ai'),
    ownerEntityId: generateId('entity', 'nexus-corp'),
    ownedEntityId: generateId('entity', 'ai-division'),
    shares: 800000,
    shareClassId: generateId('shareclass', 'ai-units'),
    effectiveDate: new Date('2023-03-01'),
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: generateId('ownership', 'nexus-data'),
    ownerEntityId: generateId('entity', 'nexus-corp'),
    ownedEntityId: generateId('entity', 'data-systems'),
    shares: 3000000,
    shareClassId: generateId('shareclass', 'data-common'),
    effectiveDate: new Date('2023-02-01'),
    createdBy: 'system',
    updatedBy: 'system'
  }
];
