
import { EnterpriseDataStoreConfig, DataStoreEvent } from '@/types/enterprise';
import { AuditEntry } from '@/types/unified';

export abstract class BaseEnterpriseStore {
  protected config: EnterpriseDataStoreConfig;
  protected auditLog: AuditEntry[] = [];
  protected eventListeners: ((event: DataStoreEvent) => void)[] = [];

  constructor(config: EnterpriseDataStoreConfig) {
    this.config = config;
    console.log('🏢 BaseEnterpriseStore initialized with config:', config);
  }

  // Event Subscription (for UI updates)
  subscribe(callback: (event: DataStoreEvent) => void): () => void {
    this.eventListeners.push(callback);
    console.log('🔗 BaseEnterpriseStore: New subscriber added, total:', this.eventListeners.length);
    
    return () => {
      this.eventListeners = this.eventListeners.filter(listener => listener !== callback);
      console.log('🔗 BaseEnterpriseStore: Subscriber removed, total:', this.eventListeners.length);
    };
  }

  unsubscribe(callback: (event: DataStoreEvent) => void): void {
    this.eventListeners = this.eventListeners.filter(listener => listener !== callback);
  }

  // Protected helper methods
  protected emitEvent(event: DataStoreEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('❌ BaseEnterpriseStore: Error in event listener:', error);
      }
    });
  }

  protected async createAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp' | 'validationsPassed'>): Promise<AuditEntry> {
    const auditEntry: AuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      validationsPassed: [] // TODO: Track which validations were performed
    };

    this.auditLog.push(auditEntry);
    return auditEntry;
  }
}
