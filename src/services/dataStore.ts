
import { mockEntities, mockCapTables, mockShareholders, mockShareClasses } from '@/data/mockData';
import { DataStore } from './dataStore/DataStore';

// Clear any existing saved data to force fresh start
if (typeof window !== 'undefined') {
  localStorage.removeItem('entity-structure-data');
  console.log('🧹 Cleared existing saved data to use fresh mock data');
}

// Create singleton instance
export const dataStore = new DataStore(
  mockEntities,
  mockCapTables,
  mockShareholders,
  mockShareClasses
);

// Don't load saved data - use fresh mock data instead
console.log('🚀 Using fresh mock data - no saved data loading');
