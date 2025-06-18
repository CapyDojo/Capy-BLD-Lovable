
import { AuditEntry } from '@/types/unified';

export class AuditManager {
  private auditLog: AuditEntry[] = [];

  async getAuditTrail(entityId?: string, fromDate?: Date, toDate?: Date): Promise<AuditEntry[]> {
    let filtered = [...this.auditLog];

    if (entityId) {
      filtered = filtered.filter(entry => 
        entry.entityId === entityId || 
        entry.relatedEntityIds?.includes(entityId)
      );
    }

    if (fromDate) {
      filtered = filtered.filter(entry => entry.timestamp >= fromDate);
    }

    if (toDate) {
      filtered = filtered.filter(entry => entry.timestamp <= toDate);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getChangeHistory(entityId: string, entityType: 'ENTITY' | 'OWNERSHIP' | 'SHARE_CLASS'): Promise<AuditEntry[]> {
    return this.auditLog.filter(entry => 
      entry.entityId === entityId && entry.entityType === entityType
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async exportAuditReport(fromDate: Date, toDate: Date): Promise<Blob> {
    const auditEntries = await this.getAuditTrail(undefined, fromDate, toDate);
    const reportData = {
      reportGenerated: new Date(),
      dateRange: { from: fromDate, to: toDate },
      totalEntries: auditEntries.length,
      entries: auditEntries
    };

    const jsonString = JSON.stringify(reportData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  addAuditEntry(entry: AuditEntry): void {
    this.auditLog.push(entry);
  }

  restoreAuditLog(auditLog: AuditEntry[]): void {
    this.auditLog = auditLog;
  }

  exportAuditLog(): AuditEntry[] {
    return [...this.auditLog];
  }
}
