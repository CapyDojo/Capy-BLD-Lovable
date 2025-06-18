
export interface CapTableData {
  entity: any;
  capTable: any;
  totalShares: number;
  totalInvestment: number;
  availableShares: number;
  chartData: any[];
  tableData: any[];
  refreshCapTable: () => void;
}

export interface StakeholderInput {
  ownerEntityId?: string;
  ownerName: string;
  shares: number;
  shareClassId: string;
}

export interface StakeholderUpdate {
  name?: string;
  shareClass?: string;
  sharesOwned?: number;
}

export interface AddStakeholderInput {
  name: string;
  shareClass: string;
  sharesOwned: number;
  type?: 'Individual' | 'Corporation' | 'LLC';
}
