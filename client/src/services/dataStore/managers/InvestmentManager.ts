
import { Investment, EntityCapTable } from '@/types/capTable';

export class InvestmentManager {
  createInvestment(
    shareholderId: string,
    shareClassId: string,
    sharesOwned: number,
    pricePerShare: number = 1.00
  ): Investment {
    return {
      id: `inv-${Date.now()}`,
      shareholderId,
      shareClassId,
      sharesOwned,
      pricePerShare,
      investmentAmount: sharesOwned * pricePerShare,
      investmentDate: new Date()
    };
  }

  findInvestmentByShareholder(capTable: EntityCapTable, shareholderId: string): Investment | undefined {
    return capTable.investments.find(inv => inv.shareholderId === shareholderId);
  }

  updateInvestment(investment: Investment, sharesOwned: number, pricePerShare?: number): void {
    investment.sharesOwned = sharesOwned;
    if (pricePerShare !== undefined) {
      investment.pricePerShare = pricePerShare;
    }
    investment.investmentAmount = investment.sharesOwned * investment.pricePerShare;
  }

  removeInvestmentsByShareholder(capTable: EntityCapTable, shareholderId: string): void {
    capTable.investments = capTable.investments.filter(inv => inv.shareholderId !== shareholderId);
  }

  removeInvestmentById(capTable: EntityCapTable, investmentId: string): void {
    capTable.investments = capTable.investments.filter(inv => inv.id !== investmentId);
  }

  addInvestment(capTable: EntityCapTable, investment: Investment): void {
    capTable.investments.push(investment);
  }
}
