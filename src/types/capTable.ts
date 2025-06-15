
export interface Shareholder {
  id: string;
  name: string;
  type: 'Individual' | 'Entity' | 'Pool';
  entityId?: string; // Reference to entity if shareholder is another entity
}

export interface ShareClass {
  id: string;
  name: string;
  type: 'Common Stock' | 'Preferred Series A' | 'Preferred Series B' | 'Stock Options' | 'Convertible Notes';
  votingRights: boolean;
  liquidationPreference?: number;
  dividendRate?: number;
}

export interface Investment {
  id: string;
  shareholderId: string;
  shareClassId: string;
  sharesOwned: number;
  pricePerShare: number;
  investmentAmount: number;
  investmentDate: Date;
  vestingSchedule?: {
    totalShares: number;
    vestedShares: number;
    cliffMonths: number;
    vestingMonths: number;
  };
}

export interface EntityCapTable {
  entityId: string;
  authorizedShares: number;
  shareholders: Shareholder[];
  shareClasses: ShareClass[];
  investments: Investment[];
  totalValuation?: number;
  lastRoundValuation?: number;
}
