
// Updated unified mock data with consistent ID generation that matches Enterprise store patterns
import { Entity, ShareClass } from '@/types/entity';
import { UnifiedOwnership } from '@/types/unified';

// Generate consistent IDs that will work with the Enterprise store
const generateId = (prefix: string, seed: string) => `${prefix}-${seed}`;

export const mockEntities: Omit<Entity, 'createdAt' | 'updatedAt' | 'version'>[] = [
  // Founders
  {
    id: generateId('entity', 'alex-chen'),
    name: 'Alex Chen',
    type: 'Individual',
    metadata: { title: 'CEO & Co-Founder' },
    position: { x: 150, y: 80 }
  },
  {
    id: generateId('entity', 'jordan-patel'),
    name: 'Jordan Patel',
    type: 'Individual', 
    metadata: { title: 'CTO & Co-Founder' },
    position: { x: 350, y: 80 }
  },
  {
    id: generateId('entity', 'sam-rivera'),
    name: 'Sam Rivera',
    type: 'Individual',
    metadata: { title: 'VP Engineering' },
    position: { x: 550, y: 80 }
  },
  
  // Main Operating Company
  {
    id: generateId('entity', 'techflow-inc'),
    name: 'TechFlow Inc',
    type: 'Corporation',
    jurisdiction: 'Delaware',
    registrationNumber: 'DE-7823456',
    incorporationDate: new Date('2022-03-15'),
    metadata: { industry: 'SaaS', stage: 'Series A' },
    position: { x: 300, y: 250 }
  },

  // Investors
  {
    id: generateId('entity', 'sequoia-capital'),
    name: 'Sequoia Capital',
    type: 'Partnership',
    jurisdiction: 'Delaware',
    metadata: { type: 'VC Fund', tier: 'Tier 1' },
    position: { x: 100, y: 400 }
  },
  {
    id: generateId('entity', 'andreessen-horowitz'),
    name: 'Andreessen Horowitz',
    type: 'LLC',
    jurisdiction: 'Delaware',
    metadata: { type: 'VC Fund', tier: 'Tier 1' },
    position: { x: 300, y: 400 }
  },
  {
    id: generateId('entity', 'first-round'),
    name: 'First Round Capital',
    type: 'LLC',
    jurisdiction: 'Delaware',
    metadata: { type: 'Seed Fund' },
    position: { x: 500, y: 400 }
  },

  // Employee Stock Option Pool (represented as entity)
  {
    id: generateId('entity', 'employee-pool'),
    name: 'Employee Option Pool',
    type: 'Trust',
    jurisdiction: 'Delaware',
    metadata: { purpose: 'Employee Equity Compensation' },
    position: { x: 650, y: 250 }
  },

  // Subsidiary
  {
    id: generateId('entity', 'techflow-europe'),
    name: 'TechFlow Europe Ltd',
    type: 'Corporation',
    jurisdiction: 'UK',
    registrationNumber: 'UK-12345678',
    incorporationDate: new Date('2023-08-01'),
    metadata: { purpose: 'European Operations' },
    position: { x: 300, y: 500 }
  }
];

export const mockShareClasses: Omit<ShareClass, 'createdAt' | 'updatedAt'>[] = [
  // TechFlow Inc Share Classes
  {
    id: generateId('shareclass', 'techflow-common'),
    entityId: generateId('entity', 'techflow-inc'),
    name: 'Common Stock',
    type: 'Common Stock',
    totalAuthorizedShares: 15000000,
    votingRights: true
  },
  {
    id: generateId('shareclass', 'techflow-seed'),
    entityId: generateId('entity', 'techflow-inc'),
    name: 'Preferred Seed',
    type: 'Preferred Series A',
    totalAuthorizedShares: 2500000,
    votingRights: true,
    liquidationPreference: 1.0,
    dividendRate: 8.0
  },
  {
    id: generateId('shareclass', 'techflow-series-a'),
    entityId: generateId('entity', 'techflow-inc'),
    name: 'Series A Preferred',
    type: 'Preferred Series A',
    totalAuthorizedShares: 4000000,
    votingRights: true,
    liquidationPreference: 1.5,
    dividendRate: 8.0
  },
  {
    id: generateId('shareclass', 'techflow-options'),
    entityId: generateId('entity', 'techflow-inc'),
    name: 'Stock Options',
    type: 'Stock Options',
    totalAuthorizedShares: 2000000,
    votingRights: false
  },
  
  // TechFlow Europe Share Classes
  {
    id: generateId('shareclass', 'europe-common'),
    entityId: generateId('entity', 'techflow-europe'),
    name: 'Ordinary Shares',
    type: 'Common Stock',
    totalAuthorizedShares: 1000000,
    votingRights: true
  }
];

export const mockOwnerships: Omit<UnifiedOwnership, 'createdAt' | 'updatedAt' | 'version'>[] = [
  // Founder Common Stock Holdings (Post Series A)
  // Alex Chen (CEO) - 35% of common stock (5.25M shares)
  {
    id: generateId('ownership', 'alex-techflow'),
    ownerEntityId: generateId('entity', 'alex-chen'),
    ownedEntityId: generateId('entity', 'techflow-inc'),
    shares: 5250000,
    shareClassId: generateId('shareclass', 'techflow-common'),
    effectiveDate: new Date('2022-03-15'),
    createdBy: 'system',
    updatedBy: 'system'
  },
  // Jordan Patel (CTO) - 30% of common stock (4.5M shares)
  {
    id: generateId('ownership', 'jordan-techflow'),
    ownerEntityId: generateId('entity', 'jordan-patel'),
    ownedEntityId: generateId('entity', 'techflow-inc'),
    shares: 4500000,
    shareClassId: generateId('shareclass', 'techflow-common'),
    effectiveDate: new Date('2022-03-15'),
    createdBy: 'system',
    updatedBy: 'system'
  },
  // Sam Rivera (VP Eng) - 2% of common stock (300K shares)
  {
    id: generateId('ownership', 'sam-techflow'),
    ownerEntityId: generateId('entity', 'sam-rivera'),
    ownedEntityId: generateId('entity', 'techflow-inc'),
    shares: 300000,
    shareClassId: generateId('shareclass', 'techflow-common'),
    effectiveDate: new Date('2022-06-01'),
    createdBy: 'system',
    updatedBy: 'system'
  },

  // Seed Round Investors
  // First Round Capital - 8% via Seed Preferred (2M shares)
  {
    id: generateId('ownership', 'first-round-seed'),
    ownerEntityId: generateId('entity', 'first-round'),
    ownedEntityId: generateId('entity', 'techflow-inc'),
    shares: 2000000,
    shareClassId: generateId('shareclass', 'techflow-seed'),
    effectiveDate: new Date('2022-09-01'),
    createdBy: 'system',
    updatedBy: 'system'
  },

  // Series A Investors  
  // Sequoia Capital - 15% via Series A Preferred (3M shares)
  {
    id: generateId('ownership', 'sequoia-series-a'),
    ownerEntityId: generateId('entity', 'sequoia-capital'),
    ownedEntityId: generateId('entity', 'techflow-inc'),
    shares: 3000000,
    shareClassId: generateId('shareclass', 'techflow-series-a'),
    effectiveDate: new Date('2023-06-15'),
    createdBy: 'system',
    updatedBy: 'system'
  },
  // Andreessen Horowitz - 8% via Series A Preferred (1M shares)
  {
    id: generateId('ownership', 'a16z-series-a'),
    ownerEntityId: generateId('entity', 'andreessen-horowitz'),
    ownedEntityId: generateId('entity', 'techflow-inc'),
    shares: 1000000,
    shareClassId: generateId('shareclass', 'techflow-series-a'),
    effectiveDate: new Date('2023-06-15'),
    createdBy: 'system',
    updatedBy: 'system'
  },

  // Employee Option Pool - 12% reserved (1.8M options)
  {
    id: generateId('ownership', 'employee-options'),
    ownerEntityId: generateId('entity', 'employee-pool'),
    ownedEntityId: generateId('entity', 'techflow-inc'),
    shares: 1800000,
    shareClassId: generateId('shareclass', 'techflow-options'),
    effectiveDate: new Date('2022-03-15'),
    createdBy: 'system',
    updatedBy: 'system'
  },

  // Subsidiary Ownership
  // TechFlow Inc owns 100% of TechFlow Europe (1M shares)
  {
    id: generateId('ownership', 'techflow-europe'),
    ownerEntityId: generateId('entity', 'techflow-inc'),
    ownedEntityId: generateId('entity', 'techflow-europe'),
    shares: 1000000,
    shareClassId: generateId('shareclass', 'europe-common'),
    effectiveDate: new Date('2023-08-01'),
    createdBy: 'system',
    updatedBy: 'system'
  }
];
