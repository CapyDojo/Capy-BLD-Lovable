import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Users, Building2 } from 'lucide-react';
import { migrationBridge } from '@/services/dataStore/MigrationBridge';
import { IEnterpriseDataStore } from '@/types/enterprise';

interface EntityCapTableSectionV2Props {
  entityId: string;
}

export const EntityCapTableSectionV2: React.FC<EntityCapTableSectionV2Props> = ({ entityId }) => {
  const [capTableData, setCapTableData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const enterpriseStore = migrationBridge.getEnterpriseStore();

  // Load cap table data from enterprise store
  useEffect(() => {
    const loadCapTableData = async () => {
      console.log('🔄 EntityCapTableSectionV2: Loading cap table for entity:', entityId);
      
      try {
        // Get cap table view directly from enterprise store
        const capTable = await enterpriseStore.getCapTableView(entityId);
        setCapTableData(capTable);
        
        console.log('✅ EntityCapTableSectionV2: Cap table loaded:', capTable);
      } catch (error) {
        console.error('❌ EntityCapTableSectionV2: Error loading cap table:', error);
        setCapTableData(null);
      }
    };

    loadCapTableData();
  }, [entityId, refreshTrigger]);

  // Subscribe to enterprise store changes
  useEffect(() => {
    console.log('🔗 EntityCapTableSectionV2: Subscribing to enterprise store');
    const unsubscribe = enterpriseStore.subscribe((event) => {
      console.log('📡 EntityCapTableSectionV2: Received enterprise store event:', event.type);
      if (event.entityId === entityId || event.relatedEntityIds?.includes(entityId)) {
        setRefreshTrigger(prev => prev + 1);
      }
    });
    return unsubscribe;
  }, [entityId, enterpriseStore]);

  const handleDeleteStakeholder = async (ownershipId: string, ownerName: string) => {
    console.log('🗑️ EntityCapTableSectionV2: Deleting ownership:', ownershipId);
    
    if (!confirm(`Are you sure you want to delete ${ownerName}?`)) {
      return;
    }

    try {
      await enterpriseStore.deleteOwnership(ownershipId, 'user', 'Deleted via UI');
      console.log('✅ EntityCapTableSectionV2: Ownership deleted successfully');
    } catch (error) {
      console.error('❌ EntityCapTableSectionV2: Error deleting ownership:', error);
    }
  };

  const getStakeholderIcon = (type: string) => {
    switch (type) {
      case 'Individual': return User;
      case 'Pool': return Users;
      case 'Entity': return Building2;
      default: return User;
    }
  };

  if (!capTableData) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Cap Table (V2 - Enterprise)</h4>
        <p className="text-sm text-gray-500">Loading cap table data...</p>
      </div>
    );
  }

  if (capTableData.totalShares === 0) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Cap Table (V2 - Enterprise)</h4>
        <p className="text-sm text-gray-500">No cap table data available.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          Cap Table (V2 - Enterprise)
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">NEW</span>
        </h4>
        <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1">
          <Plus className="h-3 w-3" />
          <span>Add</span>
        </button>
      </div>
      
      <div className="space-y-2">
        {capTableData.ownershipSummary.map((ownership) => {
          const IconComponent = getStakeholderIcon('Individual'); // Default for now
          
          return (
            <div key={`${ownership.ownershipId}-${refreshTrigger}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2">
                <IconComponent className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900">{ownership.ownerName}</div>
                  <div className="text-xs text-gray-500">
                    {ownership.percentage.toFixed(1)}% • {ownership.shares.toLocaleString()} shares • {ownership.shareClassName}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <Edit className="h-3 w-3" />
                </button>
                <button 
                  onClick={() => handleDeleteStakeholder(ownership.ownershipId, ownership.ownerName)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Total: {capTableData.totalShares.toLocaleString()} shares
        </div>
        <div className="text-xs text-green-600 mt-1">
          ✅ Using Enterprise Data Store
        </div>
      </div>
    </div>
  );
};
