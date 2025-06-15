
import { Entity } from '@/types/entity';
import { EntityCapTable, Shareholder, ShareClass, Investment } from '@/types/capTable';

// Mock entities data
export const mockEntities: Entity[] = [
  {
    id: 'parent-corp',
    name: 'Parent Corporation',
    type: 'Corporation',
    jurisdiction: 'Delaware',
    ownership: 100,
    registrationNumber: 'DE-123456789',
    incorporationDate: new Date('2020-01-15'),
    address: '123 Main St, San Francisco, CA 94105',
  },
  {
    id: 'subsidiary-llc',
    name: 'Subsidiary LLC',
    type: 'LLC',
    jurisdiction: 'California',
    ownership: 85,
    parentId: 'parent-corp',
    registrationNumber: 'CA-LLC-987654321',
    incorporationDate: new Date('2021-06-01'),
    address: '456 Tech Ave, Palo Alto, CA 94301',
  },
  {
    id: 'tech-holdings',
    name: 'Tech Holdings Inc',
    type: 'Corporation',
    jurisdiction: 'Delaware',
    ownership: 100,
    parentId: 'parent-corp',
    registrationNumber: 'DE-987654321',
    incorporationDate: new Date('2022-03-10'),
    address: '789 Innovation Dr, Austin, TX 78701',
  },
];

// Mock shareholders
export const mockShareholders: Shareholder[] = [
  { id: 'founder-1', name: 'John Smith (Founder)', type: 'Individual' },
  { id: 'founder-2', name: 'Jane Doe (Founder)', type: 'Individual' },
  { id: 'series-a-fund', name: 'Venture Capital Fund LP', type: 'Entity' },
  { id: 'employee-pool', name: 'Employee Stock Option Pool', type: 'Pool' },
  { id: 'convertible-holders', name: 'Convertible Note Holders', type: 'Entity' },
  { id: 'parent-corp-shareholder', name: 'Parent Corporation', type: 'Entity', entityId: 'parent-corp' },
];

// Mock share classes
export const mockShareClasses: ShareClass[] = [
  {
    id: 'common-stock',
    name: 'Common Stock',
    type: 'Common Stock',
    votingRights: true,
  },
  {
    id: 'preferred-a',
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
    shareClasses: mockShareClasses,
    investments: [
      {
        id: 'inv-1',
        shareholderId: 'founder-1',
        shareClassId: 'common-stock',
        sharesOwned: 4000000,
        pricePerShare: 0.001,
        investmentAmount: 4000,
        investmentDate: new Date('2020-01-15'),
      },
      {
        id: 'inv-2',
        shareholderId: 'founder-2',
        shareClassId: 'common-stock',
        sharesOwned: 3000000,
        pricePerShare: 0.001,
        investmentAmount: 3000,
        investmentDate: new Date('2020-01-15'),
      },
      {
        id: 'inv-3',
        shareholderId: 'series-a-fund',
        shareClassId: 'preferred-a',
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
    shareClasses: [mockShareClasses[0]], // Common Stock
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
