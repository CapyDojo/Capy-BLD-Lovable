
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Users, Building2 } from 'lucide-react';
import { getUnifiedRepository } from '@/services/repositories/unified';
import { IUnifiedEntityRepository } from '@/services/repositories/unified/IUnifiedRepository';

interface EntityCapTableSectionProps {
  entityId: string;
}

export const EntityCapTableSection: React.FC<EntityCapTableSectionProps> = ({ entityId }) => {
  const [capTableData, setCapTableData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [repository, setRepository] = useState<IUnifiedEntityRepository | null>(null);

  // Initialize unified repository
  useEffect(() => {
    const initRepository = async () => {
      try {
        console.log('🔄 EntityCapTableSection: Initializing unified repository for entity:', entityId);
        const repo = await getUnifiedRepository('ENTERPRISE');
        setRepository(repo);
        console.log('✅ EntityCapTableSection: Unified repository initialized');
      } catch (error) {
        console.error('❌ EntityCapTableSection: Failed to initialize repository:', error);
      }
    };

    initRepository();
  }, []);

  // Load data when repository is ready
  useEffect(() => {
    if (!repository) return;

    const loadData = async () => {
      try {
        console.log('🔄 EntityCapTableSection: Loading cap table for entity:', entityId);
        const capTable = await repository.getCapTableView(entityId);
        setCapTableData(capTable);
        console.log('✅ EntityCapTableSection: Cap table loaded');
      } catch (error) {
        console.error('❌ EntityCapTableSection: Error loading cap table:', error);
        setCapTableData(null);
      }
    };

    loadData();

    // Subscribe to repository changes
    const unsubscribe = repository.subscribe((event) => {
      console.log('📡 EntityCapTableSection: Received repository event:', event.type, event.entityId);
      if (event.entityId === entityId) {
        setRefreshTrigger(prev => prev + 1);
        loadData();
      }
    });

    return unsubscribe;
  }, [repository, entityId, refreshTrigger]);

  const handleDeleteStakeholder = async (ownershipId: string, ownerName: string) => {
    if (!repository) return;
    
    console.log('🗑️ EntityCapTableSection: Deleting ownership via unified repository:', ownershipId);
    
    if (!confirm(`Are you sure you want to delete ${ownerName}?`)) {
      return;
    }

    try {
      await repository.deleteOwnership(ownershipId, 'user', 'Deleted via EntityCapTableSection');
      console.log('✅ Ownership deletion completed via unified repository');
    } catch (error) {
      console.error('❌ Error deleting ownership via unified repository:', error);
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
        <h4 className="text-sm font-medium text-gray-900 mb-3">Cap Table</h4>
        <p className="text-sm text-gray-500">Loading cap table data...</p>
      </div>
    );
  }

  if (capTableData.totalShares === 0) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Cap Table</h4>
        <p className="text-sm text-gray-500">No cap table data available.</p>
      </div>
    );
  }

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
        {capTableData.ownershipSummary.map((ownership) => {
          const IconComponent = getStakeholderIcon('Individual'); // Default for unified view
          
          return (
            <div key={`${ownership.ownershipId}-${refreshTrigger}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2">
                <IconComponent className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900">{ownership.ownerName}</div>
                  <div className="text-xs text-gray-500">
                    {ownership.percentage.toFixed(1)}% • {ownership.shares.toLocaleString()} shares
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
          ✅ Using Unified Repository
        </div>
      </div>
    </div>
  );
};
