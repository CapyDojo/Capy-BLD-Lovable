
export class StorageService {
  private readonly STORAGE_KEY = 'entity-data';

  save(data: any): void {
    try {
      const dataToSave = {
        ...data,
        lastSaved: Date.now(),
        version: '1.0' // Add version for future migrations
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
      console.log('💾 Data auto-saved successfully at:', new Date().toISOString());
      console.log('📊 Saved data summary:', {
        entities: data.entities?.length || 0,
        capTables: data.capTables?.length || 0,
        shareholders: data.shareholders?.length || 0,
        shareClasses: data.shareClasses?.length || 0
      });
    } catch (error) {
      console.error('❌ Failed to auto-save data:', error);
    }
  }

  load(): any | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        console.log('📥 Loaded saved data from:', new Date(data.lastSaved).toISOString());
        console.log('📊 Loaded data summary:', {
          entities: data.entities?.length || 0,
          capTables: data.capTables?.length || 0,
          shareholders: data.shareholders?.length || 0,
          shareClasses: data.shareClasses?.length || 0
        });
        return data;
      } else {
        console.log('📥 No saved data found, using defaults');
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to load saved data:', error);
      // Clear corrupted data
      localStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ Cleared saved data');
    } catch (error) {
      console.error('❌ Failed to clear saved data:', error);
    }
  }
}
