
import { mockEntities, mockCapTables, mockShareholders, mockShareClasses } from '@/data/mockData';
import { DataStore } from './dataStore/DataStore';

// Create singleton instance
export const dataStore = new DataStore(
  mockEntities,
  mockCapTables,
  mockShareholders,
  mockShareClasses
);

// Load saved data on initialization
dataStore.loadSavedData();
