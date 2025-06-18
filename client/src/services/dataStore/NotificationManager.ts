
export class NotificationManager {
  private listeners: (() => void)[] = [];
  private isLoading = false;

  subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    console.log('🔗 New subscriber added, total listeners:', this.listeners.length);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
      console.log('🔗 Subscriber removed, total listeners:', this.listeners.length);
    };
  }

  notify(): void {
    if (this.isLoading) {
      console.log('🚫 Skipping notify during data loading');
      return;
    }
    
    console.log('📡 Notifying', this.listeners.length, 'listeners of data change');
    this.listeners.forEach((callback, index) => {
      try {
        callback();
      } catch (error) {
        console.error(`❌ Error in listener ${index}:`, error);
      }
    });
  }

  setLoading(loading: boolean): void {
    this.isLoading = loading;
  }

  getListenerCount(): number {
    return this.listeners.length;
  }
}
