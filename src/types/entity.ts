export type EntityTypes = 'Corporation' | 'LLC' | 'Partnership' | 'Trust';

export interface Entity {
  id: string;
  name: string;
  type: EntityTypes;
  jurisdiction: string;
  ownership: number;
  registrationNumber?: string;
  incorporationDate?: Date;
  address?: string;
  parentId?: string;
  children?: Entity[];
  position?: { x: number; y: number };
}

export interface OwnershipRelationship {
  id: string;
  parentEntityId: string;
  childEntityId: string;
  ownershipPercentage: number;
  ownershipType: 'economic' | 'voting' | 'both';
  effectiveDate: Date;
}
