import { Entity, OwnershipRelationship, ShareClass } from '@/types/entity';
import { EntityCapTable, Shareholder, Investment } from '@/types/capTable';

// Mock entities data - clean Entity objects without ownership property
export const mockEntities: Entity[] = [
  {
    id: 'parent-corp',
    name: 'Parent Corporation',
    type: 'Corporation',
    jurisdiction: 'Delaware',
    registrationNumber: 'DE-123456789',
    incorporationDate: new Date('2020-01-15'),
    address: '123 Main St, San Francisco, CA 94105',
    position: { x: 100, y: 100 },
    metadata: {},
    createdAt: new Date('2020-01-15'),
    updatedAt: new Date('2020-01-15'),
    version: 1,
  },
  {
    id: 'subsidiary-llc',
    name: 'Subsidiary LLC',
    type: 'LLC',
    jurisdiction: 'California',
    registrationNumber: 'CA-LLC-987654321',
    incorporationDate: new Date('2021-06-01'),
    address: '456 Tech Ave, Palo Alto, CA 94301',
    position: { x: 300, y: 200 },
    metadata: {},
    createdAt: new Date('2021-06-01'),
    updatedAt: new Date('2021-06-01'),
    version: 1,
  },
  {
    id: 'tech-holdings',
    name: 'Tech Holdings Inc',
    type: 'Corporation',
    jurisdiction: 'Delaware',
    registrationNumber: 'DE-987654321',
    incorporationDate: new Date('2022-03-10'),
    address: '789 Innovation Dr, Austin, TX 78701',
    position: { x: 500, y: 100 },
    metadata: {},
    createdAt: new Date('2022-03-10'),
    updatedAt: new Date('2022-03-10'),
    version: 1,
  },
  {
    id: 'vc-fund-entity',
    name: 'Venture Capital Fund LP',
    type: 'Partnership',
    jurisdiction: 'Delaware',
    registrationNumber: 'DE-VC-123456',
    incorporationDate: new Date('2018-01-01'),
    address: '1 Sand Hill Rd, Menlo Park, CA 94025',
    position: { x: 200, y: 300 },
    metadata: {},
    createdAt: new Date('2018-01-01'),
    updatedAt: new Date('2018-01-01'),
    version: 1,
  },
  {
    id: 'founder-individual-1',
    name: 'John Smith',
    type: 'Individual',
    address: '123 Personal Ave, San Francisco, CA',
    position: { x: 50, y: 50 },
    metadata: {},
    createdAt: new Date('2020-01-15'),
    updatedAt: new Date('2020-01-15'),
    version: 1,
  },
  {
    id: 'founder-individual-2',
    name: 'Jane Doe',
    type: 'Individual',
    address: '456 Personal St, Palo Alto, CA',
    position: { x: 150, y: 50 },
    metadata: {},
    createdAt: new Date('2020-01-15'),
    updatedAt: new Date('2020-01-15'),
    version: 1,
  },
];

// Mock share classes
export const mockShareClasses: ShareClass[] = [
  {
    id: 'parent-corp-common',
    entityId: 'parent-corp',
    name: 'Common Stock',
    type: 'Common Stock',
    totalAuthorizedShares: 10000000,
    votingRights: true,
    createdAt: new Date('2020-01-15'),
    updatedAt: new Date('2020-01-15'),
  },
  {
    id: 'parent-corp-preferred-a',
    entityId: 'parent-corp',
    name: 'Preferred Series A',
    type: 'Preferred Series A',
    totalAuthorizedShares: 2000000,
    votingRights: true,
    liquidationPreference: 1.0,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  {
    id: 'subsidiary-llc-units',
    entityId: 'subsidiary-llc',
    name: 'LLC Membership Units',
    type: 'Common Stock',
    totalAuthorizedShares: 1000000,
    votingRights: true,
    createdAt: new Date('2021-06-01'),
    updatedAt: new Date('2021-06-01'),
  },
  {
    id: 'tech-holdings-common',
    entityId: 'tech-holdings',
    name: 'Common Stock',
    type: 'Common Stock',
    totalAuthorizedShares: 1000000,
    votingRights: true,
    createdAt: new Date('2022-03-10'),
    updatedAt: new Date('2022-03-10'),
  },
];

// Mock ownership relationships
export const mockOwnershipRelationships: OwnershipRelationship[] = [
  {
    id: 'ownership-1',
    ownerEntityId: 'founder-individual-1',
    ownedEntityId: 'parent-corp',
    shares: 4000000,
    shareClassId: 'parent-corp-common',
    effectiveDate: new Date('2020-01-15'),
    createdAt: new Date('2020-01-15'),
    updatedAt: new Date('2020-01-15'),
    version: 1,
  },
  {
    id: 'ownership-2',
    ownerEntityId: 'founder-individual-2',
    ownedEntityId: 'parent-corp',
    shares: 3000000,
    shareClassId: 'parent-corp-common',
    effectiveDate: new Date('2020-01-15'),
    createdAt: new Date('2020-01-15'),
    updatedAt: new Date('2020-01-15'),
    version: 1,
  },
  {
    id: 'ownership-3',
    ownerEntityId: 'vc-fund-entity',
    ownedEntityId: 'parent-corp',
    shares: 2000000,
    shareClassId: 'parent-corp-preferred-a',
    effectiveDate: new Date('2023-01-01'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    version: 1,
  },
  {
    id: 'ownership-4',
    ownerEntityId: 'parent-corp',
    ownedEntityId: 'subsidiary-llc',
    shares: 850000,
    shareClassId: 'subsidiary-llc-units',
    effectiveDate: new Date('2021-06-01'),
    createdAt: new Date('2021-06-01'),
    updatedAt: new Date('2021-06-01'),
    version: 1,
  },
  {
    id: 'ownership-5',
    ownerEntityId: 'parent-corp',
    ownedEntityId: 'tech-holdings',
    shares: 1000000,
    shareClassId: 'tech-holdings-common',
    effectiveDate: new Date('2022-03-10'),
    createdAt: new Date('2022-03-10'),
    updatedAt: new Date('2022-03-10'),
    version: 1,
  },
];

// Mock shareholders
export const mockShareholders: Shareholder[] = [
  { id: 'founder-1', name: 'John Smith (Founder)', type: 'Individual' },
  { id: 'founder-2', name: 'Jane Doe (Founder)', type: 'Individual' },
  { id: 'series-a-fund', name: 'Venture Capital Fund LP', type: 'Entity', entityId: 'vc-fund-entity' },
  { id: 'employee-pool', name: 'Employee Stock Option Pool', type: 'Pool' },
  { id: 'convertible-holders', name: 'Convertible Note Holders', type: 'Entity' },
  { id: 'parent-corp-shareholder', name: 'Parent Corporation', type: 'Entity', entityId: 'parent-corp' },
];

// Mock cap tables for each entity
export const mockCapTables: EntityCapTable[] = [
  {
    entityId: 'parent-corp',
    authorizedShares: 12000000,
    totalValuation: 10000000,
    lastRoundValuation: 10000000,
    shareholders: [
      mockShareholders[0], // John Smith
      mockShareholders[1], // Jane Doe
      mockShareholders[2], // VC Fund
      mockShareholders[3], // Employee Pool
      mockShareholders[4], // Convertible Notes
    ],
    shareClasses: [
      {
        id: 'parent-corp-common',
        name: 'Common Stock',
        type: 'Common Stock',
        votingRights: true,
      },
      {
        id: 'parent-corp-preferred-a',
        name: 'Preferred Series A',
        type: 'Preferred Series A',
        votingRights: true,
        liquidationPreference: 1.0,
      },
      {
        id: 'stock-options',
        name: 'Stock Options',
        type: 'Stock Options',
        votingRights: false,
      },
      {
        id: 'convertible-notes',
        name: 'Convertible Notes',
        type: 'Convertible Notes',
        votingRights: false,
      },
    ],
    investments: [
      {
        id: 'inv-1',
        shareholderId: 'founder-1',
        shareClassId: 'parent-corp-common',
        sharesOwned: 4000000,
        pricePerShare: 0.001,
        investmentAmount: 4000,
        investmentDate: new Date('2020-01-15'),
      },
      {
        id: 'inv-2',
        shareholderId: 'founder-2',
        shareClassId: 'parent-corp-common',
        sharesOwned: 3000000,
        pricePerShare: 0.001,
        investmentAmount: 3000,
        investmentDate: new Date('2020-01-15'),
      },
      {
        id: 'inv-3',
        shareholderId: 'series-a-fund',
        shareClassId: 'parent-corp-preferred-a',
        sharesOwned: 2000000,
        pricePerShare: 1.00,
        investmentAmount: 2000000,
        investmentDate: new Date('2023-01-01'),
      },
      {
        id: 'inv-4',
        shareholderId: 'employee-pool',
        shareClassId: 'stock-options',
        sharesOwned: 1000000,
        pricePerShare: 0.001,
        investmentAmount: 1000,
        investmentDate: new Date('2020-01-15'),
      },
      {
        id: 'inv-5',
        shareholderId: 'convertible-holders',
        shareClassId: 'convertible-notes',
        sharesOwned: 0,
        pricePerShare: 0.80,
        investmentAmount: 500000,
        investmentDate: new Date('2024-06-01'),
      },
    ],
  },
  {
    entityId: 'subsidiary-llc',
    authorizedShares: 1000000,
    shareholders: [mockShareholders[5]], // Parent Corporation
    shareClasses: [
      {
        id: 'llc-units',
        name: 'LLC Membership Units',
        type: 'Common Stock',
        votingRights: true,
      },
    ],
    investments: [
      {
        id: 'inv-sub-1',
        shareholderId: 'parent-corp-shareholder',
        shareClassId: 'llc-units',
        sharesOwned: 850000,
        pricePerShare: 1.00,
        investmentAmount: 850000,
        investmentDate: new Date('2021-06-01'),
      },
    ],
  },
  {
    entityId: 'tech-holdings',
    authorizedShares: 1000000,
    shareholders: [mockShareholders[5]], // Parent Corporation
    shareClasses: [
      {
        id: 'common-stock',
        name: 'Common Stock',
        type: 'Common Stock',
        votingRights: true,
      },
    ],
    investments: [
      {
        id: 'inv-tech-1',
        shareholderId: 'parent-corp-shareholder',
        shareClassId: 'common-stock',
        sharesOwned: 1000000,
        pricePerShare: 1.00,
        investmentAmount: 1000000,
        investmentDate: new Date('2022-03-10'),
      },
    ],
  },
];

// Helper functions
export const getEntityById = (id: string): Entity | undefined => {
  return mockEntities.find(entity => entity.id === id);
};

export const getCapTableByEntityId = (entityId: string): EntityCapTable | undefined => {
  return mockCapTables.find(capTable => capTable.entityId === entityId);
};

export const getAllEntities = (): Entity[] => {
  return mockEntities;
};

export const getAllOwnershipRelationships = (): OwnershipRelationship[] => {
  return mockOwnershipRelationships;
};

export const getAllShareClasses = (): ShareClass[] => {
  return mockShareClasses;
};
