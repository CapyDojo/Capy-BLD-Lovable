
import { DataTransaction } from '@/types/unified';
import { EnterpriseDataError } from '@/types/enterprise';

export class TransactionManager {
  private transactions: Map<string, DataTransaction> = new Map();

  async beginTransaction(userId: string): Promise<DataTransaction> {
    const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transaction: DataTransaction = {
      id: transactionId,
      userId,
      startTime: new Date(),
      operations: [],
      status: 'PENDING'
    };

    this.transactions.set(transactionId, transaction);
    console.log('🔄 TransactionManager: Transaction started', transactionId);
    return transaction;
  }

  async commitTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new EnterpriseDataError(`Transaction ${transactionId} not found`, 'TRANSACTION_NOT_FOUND');
    }

    transaction.status = 'COMMITTED';
    transaction.endTime = new Date();

    console.log('✅ TransactionManager: Transaction committed', transactionId);
  }

  async rollbackTransaction(transactionId: string, reason: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new EnterpriseDataError(`Transaction ${transactionId} not found`, 'TRANSACTION_NOT_FOUND');
    }

    transaction.status = 'ROLLED_BACK';
    transaction.endTime = new Date();

    console.log('🔄 TransactionManager: Transaction rolled back', transactionId, reason);
  }

  async getActiveTransactions(): Promise<DataTransaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.status === 'PENDING');
  }
}
