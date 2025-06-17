
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Users, Building2 } from 'lucide-react';
import { dataStore } from '@/services/dataStore';
import { syncCapTableData } from '@/services/capTableSync';

interface EntityCapTableSectionProps {
  entityId: string;
}

export const EntityCapTableSection: React.FC<EntityCapTableSectionProps> = ({ entityId }) => {
  const [capTableData, setCapTableData] = useState(() => syncCapTableData(entityId));
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Subscribe to data store changes with enhanced refresh
  useEffect(() => {
    console.log('🔗 EntityCapTableSection subscribing to data store for entity:', entityId);
    const unsubscribe = dataStore.subscribe(() => {
      console.log('📡 EntityCapTableSection received data store update for entity:', entityId);
      const updatedData = syncCapTableData(entityId);
      setCapTableData(updatedData);
      setRefreshTrigger(prev => prev + 1);
    });
    return unsubscribe;
  }, [entityId]);

  // Update data when entityId changes or refresh trigger changes
  useEffect(() => {
    console.log('🔄 EntityCapTableSection updating data for entity:', entityId, 'trigger:', refreshTrigger);
    const updatedData = syncCapTableData(entityId);
    setCapTableData(updatedData);
  }, [entityId, refreshTrigger]);

  const handleDeleteStakeholder = (stakeholderId: string, stakeholderName: string) => {
    console.log('🗑️ EntityCapTableSection deleting stakeholder:', stakeholderId, 'from entity:', entityId);
    
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete ${stakeholderName}?`)) {
      return;
    }

    // Delete from data store - this will trigger auto-save and notifications
    dataStore.deleteStakeholder(entityId, stakeholderId);
    
    console.log('✅ Stakeholder deletion completed');
  };

  if (!capTableData || capTableData.totalShares === 0) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Cap Table</h4>
        <p className="text-sm text-gray-500">No cap table data available.</p>
      </div>
    );
  }

  const getStakeholderIcon = (type: string) => {
    switch (type) {
      case 'Individual': return User;
      case 'Pool': return Users;
      case 'Entity': return Building2;
      default: return User;
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">Cap Table</h4>
        <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1">
          <Plus className="h-3 w-3" />
          <span>Add</span>
        </button>
      </div>
      
      <div className="space-y-2">
        {capTableData.stakeholders.map((stakeholder) => {
          const IconComponent = getStakeholderIcon(stakeholder.type);
          
          return (
            <div key={`${stakeholder.id}-${refreshTrigger}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2">
                <IconComponent className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900">{stakeholder.name}</div>
                  <div className="text-xs text-gray-500">
                    {stakeholder.ownershipPercentage.toFixed(1)}% • {stakeholder.sharesOwned.toLocaleString()} shares
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <Edit className="h-3 w-3" />
                </button>
                <button 
                  onClick={() => handleDeleteStakeholder(stakeholder.id, stakeholder.name)}
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
      </div>
    </div>
  );
};
