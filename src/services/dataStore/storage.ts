
export class StorageService {
  private readonly STORAGE_KEY = 'entity-data';

  save(data: any): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        ...data,
        lastSaved: Date.now()
      }));
      console.log('💾 Data auto-saved');
    } catch (error) {
      console.error('Failed to auto-save data:', error);
    }
  }

  load(): any | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        console.log('📥 Loaded saved data from:', new Date(data.lastSaved));
        return data;
      }
      return null;
    } catch (error) {
      console.error('Failed to load saved data:', error);
      return null;
    }
  }
}
