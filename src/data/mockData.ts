
import { Entity, OwnershipRelationship, ShareClass } from '@/types/entity';
import { EntityCapTable, Shareholder, Investment } from '@/types/capTable';

// Mock entities data - typical startup structure
export const mockEntities: Entity[] = [
  // Founders
  {
    id: 'founder-alice',
    name: 'Alice Johnson',
    type: 'Individual',
    address: '123 Founder Ave, San Francisco, CA 94105',
    position: { x: 100, y: 50 },
    metadata: {},
    createdAt: new Date('2021-01-15'),
    updatedAt: new Date('2021-01-15'),
    version: 1,
  },
  {
    id: 'founder-bob',
    name: 'Bob Chen',
    type: 'Individual',
    address: '456 Innovation St, Palo Alto, CA 94301',
    position: { x: 300, y: 50 },
    metadata: {},
    createdAt: new Date('2021-01-15'),
    updatedAt: new Date('2021-01-15'),
    version: 1,
  },
  // VC Fund
  {
    id: 'acme-ventures',
    name: 'Acme Ventures',
    type: 'Partnership',
    jurisdiction: 'Delaware',
    registrationNumber: 'DE-VC-789012',
    incorporationDate: new Date('2015-01-01'),
    address: '1 Sand Hill Rd, Menlo Park, CA 94025',
    position: { x: 200, y: 250 },
    metadata: {},
    createdAt: new Date('2015-01-01'),
    updatedAt: new Date('2015-01-01'),
    version: 1,
  },
  // Parent Company
  {
    id: 'techcorp-inc',
    name: 'TechCorp Inc',
    type: 'Corporation',
    jurisdiction: 'Delaware',
    registrationNumber: 'DE-123456789',
    incorporationDate: new Date('2021-02-01'),
    address: '789 Main St, San Francisco, CA 94105',
    position: { x: 200, y: 150 },
    metadata: {},
    createdAt: new Date('2021-02-01'),
    updatedAt: new Date('2021-02-01'),
    version: 1,
  },
  // Subsidiaries
  {
    id: 'datacorp-llc',
    name: 'DataCorp LLC',
    type: 'LLC',
    jurisdiction: 'California',
    registrationNumber: 'CA-LLC-111111',
    incorporationDate: new Date('2022-03-15'),
    address: '100 Data Ave, San Jose, CA 95110',
    position: { x: 50, y: 350 },
    metadata: {},
    createdAt: new Date('2022-03-15'),
    updatedAt: new Date('2022-03-15'),
    version: 1,
  },
  {
    id: 'cloudsoft-inc',
    name: 'CloudSoft Inc',
    type: 'Corporation',
    jurisdiction: 'Delaware',
    registrationNumber: 'DE-222222',
    incorporationDate: new Date('2022-06-01'),
    address: '200 Cloud Dr, Seattle, WA 98101',
    position: { x: 200, y: 350 },
    metadata: {},
    createdAt: new Date('2022-06-01'),
    updatedAt: new Date('2022-06-01'),
    version: 1,
  },
  {
    id: 'ai-solutions-llc',
    name: 'AI Solutions LLC',
    type: 'LLC',
    jurisdiction: 'California',
    registrationNumber: 'CA-LLC-333333',
    incorporationDate: new Date('2023-01-10'),
    address: '300 AI Blvd, Austin, TX 78701',
    position: { x: 350, y: 350 },
    metadata: {},
    createdAt: new Date('2023-01-10'),
    updatedAt: new Date('2023-01-10'),
    version: 1,
  },
];

// Mock share classes
export const mockShareClasses: ShareClass[] = [
  // TechCorp Inc share classes
  {
    id: 'techcorp-common',
    entityId: 'techcorp-inc',
    name: 'Common Stock',
    type: 'Common Stock',
    totalAuthorizedShares: 10000000,
    votingRights: true,
    createdAt: new Date('2021-02-01'),
    updatedAt: new Date('2021-02-01'),
  },
  {
    id: 'techcorp-preferred-a',
    entityId: 'techcorp-inc',
    name: 'Preferred Series A',
    type: 'Preferred Series A',
    totalAuthorizedShares: 2000000,
    votingRights: true,
    liquidationPreference: 1.0,
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2023-06-01'),
  },
  // Subsidiary share classes
  {
    id: 'datacorp-units',
    entityId: 'datacorp-llc',
    name: 'LLC Membership Units',
    type: 'Common Stock',
    totalAuthorizedShares: 1000000,
    votingRights: true,
    createdAt: new Date('2022-03-15'),
    updatedAt: new Date('2022-03-15'),
  },
  {
    id: 'cloudsoft-common',
    entityId: 'cloudsoft-inc',
    name: 'Common Stock',
    type: 'Common Stock',
    totalAuthorizedShares: 1000000,
    votingRights: true,
    createdAt: new Date('2022-06-01'),
    updatedAt: new Date('2022-06-01'),
  },
  {
    id: 'ai-solutions-units',
    entityId: 'ai-solutions-llc',
    name: 'LLC Membership Units',
    type: 'Common Stock',
    totalAuthorizedShares: 1000000,
    votingRights: true,
    createdAt: new Date('2023-01-10'),
    updatedAt: new Date('2023-01-10'),
  },
];

// Mock ownership relationships
export const mockOwnershipRelationships: OwnershipRelationship[] = [
  // Founders own TechCorp Inc
  {
    id: 'ownership-alice-techcorp',
    ownerEntityId: 'founder-alice',
    ownedEntityId: 'techcorp-inc',
    shares: 3500000,
    shareClassId: 'techcorp-common',
    effectiveDate: new Date('2021-02-01'),
    createdAt: new Date('2021-02-01'),
    updatedAt: new Date('2021-02-01'),
    version: 1,
  },
  {
    id: 'ownership-bob-techcorp',
    ownerEntityId: 'founder-bob',
    ownedEntityId: 'techcorp-inc',
    shares: 3500000,
    shareClassId: 'techcorp-common',
    effectiveDate: new Date('2021-02-01'),
    createdAt: new Date('2021-02-01'),
    updatedAt: new Date('2021-02-01'),
    version: 1,
  },
  // VC owns TechCorp Inc
  {
    id: 'ownership-acme-techcorp',
    ownerEntityId: 'acme-ventures',
    ownedEntityId: 'techcorp-inc',
    shares: 2000000,
    shareClassId: 'techcorp-preferred-a',
    effectiveDate: new Date('2023-06-01'),
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2023-06-01'),
    version: 1,
  },
  // TechCorp Inc owns subsidiaries
  {
    id: 'ownership-techcorp-datacorp',
    ownerEntityId: 'techcorp-inc',
    ownedEntityId: 'datacorp-llc',
    shares: 1000000,
    shareClassId: 'datacorp-units',
    effectiveDate: new Date('2022-03-15'),
    createdAt: new Date('2022-03-15'),
    updatedAt: new Date('2022-03-15'),
    version: 1,
  },
  {
    id: 'ownership-techcorp-cloudsoft',
    ownerEntityId: 'techcorp-inc',
    ownedEntityId: 'cloudsoft-inc',
    shares: 800000,
    shareClassId: 'cloudsoft-common',
    effectiveDate: new Date('2022-06-01'),
    createdAt: new Date('2022-06-01'),
    updatedAt: new Date('2022-06-01'),
    version: 1,
  },
  {
    id: 'ownership-techcorp-ai',
    ownerEntityId: 'techcorp-inc',
    ownedEntityId: 'ai-solutions-llc',
    shares: 900000,
    shareClassId: 'ai-solutions-units',
    effectiveDate: new Date('2023-01-10'),
    createdAt: new Date('2023-01-10'),
    updatedAt: new Date('2023-01-10'),
    version: 1,
  },
];

// Mock shareholders
export const mockShareholders: Shareholder[] = [
  { id: 'alice-shareholder', name: 'Alice Johnson', type: 'Individual' },
  { id: 'bob-shareholder', name: 'Bob Chen', type: 'Individual' },
  { id: 'acme-shareholder', name: 'Acme Ventures', type: 'Entity', entityId: 'acme-ventures' },
  { id: 'techcorp-shareholder', name: 'TechCorp Inc', type: 'Entity', entityId: 'techcorp-inc' },
  { id: 'employee-pool', name: 'Employee Stock Option Pool', type: 'Pool' },
];

// Mock cap tables for each entity
export const mockCapTables: EntityCapTable[] = [
  // TechCorp Inc cap table
  {
    entityId: 'techcorp-inc',
    authorizedShares: 12000000,
    totalValuation: 25000000,
    lastRoundValuation: 25000000,
    shareClasses: [
      {
        id: 'techcorp-common',
        name: 'Common Stock',
        type: 'Common Stock',
        votingRights: true,
      },
      {
        id: 'techcorp-preferred-a',
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
    ],
    investments: [
      {
        id: 'inv-alice-techcorp',
        shareholderId: 'alice-shareholder',
        shareClassId: 'techcorp-common',
        sharesOwned: 3500000,
        pricePerShare: 0.001,
        investmentAmount: 3500,
        investmentDate: new Date('2021-02-01'),
      },
      {
        id: 'inv-bob-techcorp',
        shareholderId: 'bob-shareholder',
        shareClassId: 'techcorp-common',
        sharesOwned: 3500000,
        pricePerShare: 0.001,
        investmentAmount: 3500,
        investmentDate: new Date('2021-02-01'),
      },
      {
        id: 'inv-acme-techcorp',
        shareholderId: 'acme-shareholder',
        shareClassId: 'techcorp-preferred-a',
        sharesOwned: 2000000,
        pricePerShare: 5.00,
        investmentAmount: 10000000,
        investmentDate: new Date('2023-06-01'),
      },
      {
        id: 'inv-pool-techcorp',
        shareholderId: 'employee-pool',
        shareClassId: 'stock-options',
        sharesOwned: 1000000,
        pricePerShare: 0.001,
        investmentAmount: 1000,
        investmentDate: new Date('2021-02-01'),
      },
    ],
  },
  // DataCorp LLC cap table
  {
    entityId: 'datacorp-llc',
    authorizedShares: 1000000,
    shareClasses: [
      {
        id: 'datacorp-units',
        name: 'LLC Membership Units',
        type: 'Common Stock',
        votingRights: true,
      },
    ],
    investments: [
      {
        id: 'inv-techcorp-datacorp',
        shareholderId: 'techcorp-shareholder',
        shareClassId: 'datacorp-units',
        sharesOwned: 1000000,
        pricePerShare: 1.00,
        investmentAmount: 1000000,
        investmentDate: new Date('2022-03-15'),
      },
    ],
  },
  // CloudSoft Inc cap table
  {
    entityId: 'cloudsoft-inc',
    authorizedShares: 1000000,
    shareClasses: [
      {
        id: 'cloudsoft-common',
        name: 'Common Stock',
        type: 'Common Stock',
        votingRights: true,
      },
    ],
    investments: [
      {
        id: 'inv-techcorp-cloudsoft',
        shareholderId: 'techcorp-shareholder',
        shareClassId: 'cloudsoft-common',
        sharesOwned: 800000,
        pricePerShare: 2.50,
        investmentAmount: 2000000,
        investmentDate: new Date('2022-06-01'),
      },
    ],
  },
  // AI Solutions LLC cap table
  {
    entityId: 'ai-solutions-llc',
    authorizedShares: 1000000,
    shareClasses: [
      {
        id: 'ai-solutions-units',
        name: 'LLC Membership Units',
        type: 'Common Stock',
        votingRights: true,
      },
    ],
    investments: [
      {
        id: 'inv-techcorp-ai',
        shareholderId: 'techcorp-shareholder',
        shareClassId: 'ai-solutions-units',
        sharesOwned: 900000,
        pricePerShare: 3.00,
        investmentAmount: 2700000,
        investmentDate: new Date('2023-01-10'),
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
