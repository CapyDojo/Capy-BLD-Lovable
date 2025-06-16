
export type EntityTypes = 'Corporation' | 'LLC' | 'Partnership' | 'Trust' | 'Individual';

export interface Entity {
  id: string;
  name: string;
  type: EntityTypes;
  jurisdiction?: string; // Optional for individuals
  registrationNumber?: string;
  incorporationDate?: Date;
  address?: string;
  position?: { x: number; y: number }; // Canvas position
  metadata: Record<string, any>; // Future extensibility
  createdAt: Date;
  updatedAt: Date;
  version: number; // Optimistic locking
}

export interface OwnershipRelationship {
  id: string;
  ownerEntityId: string;
  ownedEntityId: string;
  shares: number; // Source of truth
  shareClassId: string;
  effectiveDate: Date;
  expiryDate?: Date; // For time-bound ownership
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface ShareClass {
  id: string;
  entityId: string; // Which entity this share class belongs to
  name: string;
  totalAuthorizedShares: number;
  votingRights: boolean;
  liquidationPreference?: number;
  dividendRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Computed ownership summary
export interface OwnershipSummary {
  entityId: string;
  totalShares: number;
  ownerships: {
    ownershipId: string;
    ownerEntityId: string;
    ownerName: string;
    shares: number;
    percentage: number; // Computed from shares
    shareClassName: string;
  }[];
  availableShares: number;
}
