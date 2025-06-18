import { useMemo, useState, useEffect } from 'react';
import { getUnifiedRepository } from '@/services/repositories/unified';
import { IUnifiedEntityRepository } from '@/services/repositories/unified/IUnifiedRepository';

export interface CapTableData {
  entity: any;
  capTable: any;
  totalShares: number;
  totalInvestment: number;
  availableShares: number;
  chartData: any[];
  tableData: any[];
  refreshCapTable: () => void;
}

export const useCapTable = (entityId: string) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [capTableView, setCapTableView] = useState(null);
  const [entity, setEntity] = useState(null);
  const [repository, setRepository] = useState<IUnifiedEntityRepository | null>(null);

  // Initialize unified repository
  useEffect(() => {
    const initRepository = async () => {
      try {
        console.log('🔄 useCapTable: Initializing unified repository for entity:', entityId);
        const repo = await getUnifiedRepository('ENTERPRISE');
        setRepository(repo);
        console.log('✅ useCapTable: Unified repository initialized');
      } catch (error) {
        console.error('❌ useCapTable: Failed to initialize repository:', error);
      }
    };

    initRepository();
  }, []);

  // Load data when repository is ready
  useEffect(() => {
    if (!repository) return;

    const loadData = async () => {
      try {
        console.log('🔄 useCapTable: Loading data for entity:', entityId);
        
        const entityData = await repository.getEntity(entityId);
        const capTable = await repository.getCapTableView(entityId);
        
        setEntity(entityData);
        setCapTableView(capTable);
        
        console.log('✅ useCapTable: Data loaded successfully');
      } catch (error) {
        console.error('❌ useCapTable: Error loading data:', error);
      }
    };

    loadData();

    // Subscribe to repository changes
    const unsubscribe = repository.subscribe((event) => {
      console.log('📡 useCapTable: Received repository event:', event.type, event.entityId);
      if (event.entityId === entityId) {
        setRefreshTrigger(prev => prev + 1);
        loadData();
      }
    });

    return unsubscribe;
  }, [repository, entityId, refreshTrigger]);

  const createOwnership = async (ownershipData: {
    ownerEntityId?: string;
    ownerName: string;
    shares: number;
    shareClassId: string;
  }) => {
    if (!repository || !entityId) return;

    try {
      console.log('🔄 Creating ownership via unified repository:', ownershipData);
      
      await repository.createOwnership({
        ownedEntityId: entityId,
        ownerEntityId: ownershipData.ownerEntityId || null,
        ownerName: ownershipData.ownerName,
        shares: ownershipData.shares,
        shareClassId: ownershipData.shareClassId,
        ownerType: ownershipData.ownerEntityId ? 'Entity' : 'Individual'
      }, 'user');

      console.log('✅ Ownership creation completed via unified repository');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('❌ Error creating ownership via unified repository:', error);
      throw error;
    }
  };

  const refreshCapTable = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return useMemo(() => {
    if (!entity || !capTableView) {
      console.log('❌ useCapTable: Missing entity or cap table data');
      return null;
    }

    console.log('🔄 useCapTable: Computing data for entity:', entityId, 'refresh trigger:', refreshTrigger);

    const totalShares = capTableView.totalShares;
    const availableShares = Math.max(0, (capTableView.authorizedShares || totalShares) - totalShares);

    // Build table data from ownership summary
    const tableData = capTableView.ownershipSummary.map((ownership) => {
      const totalInvestmentAmount = ownership.shares * (ownership.pricePerShare || 1);

      return {
        id: ownership.ownershipId,
        name: ownership.ownerName,
        type: 'Individual',
        entityId: ownership.ownerEntityId,
        sharesOwned: ownership.shares,
        shareClass: ownership.shareClassName,
        ownershipPercentage: ownership.percentage,
        fullyDiluted: (capTableView.authorizedShares || totalShares) > 0 ? 
          (ownership.shares / (capTableView.authorizedShares || totalShares)) * 100 : 0,
        pricePerShare: ownership.pricePerShare || 1,
        investmentAmount: totalInvestmentAmount,
      };
    });

    const totalInvestment = tableData.reduce((sum, item) => sum + item.investmentAmount, 0);

    // Build chart data
    const chartData = tableData
      .filter(item => item.sharesOwned > 0)
      .map((item, index) => {
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'];
        return {
          name: item.name,
          value: item.ownershipPercentage,
          shares: item.sharesOwned,
          investmentAmount: item.investmentAmount,
          shareClass: item.shareClass,
          color: colors[index % colors.length],
        };
      });

    // Add available shares to chart if any
    if (availableShares > 0) {
      const availablePercentage = ((capTableView.authorizedShares || totalShares) > 0) ? 
        (availableShares / (capTableView.authorizedShares || totalShares)) * 100 : 0;
      chartData.push({
        name: 'Available for Issuance',
        value: availablePercentage,
        shares: availableShares,
        investmentAmount: 0,
        shareClass: 'Unissued',
        color: '#e5e7eb',
      });
    }

    console.log('✅ Cap table data computed for:', entity.name, 'with', tableData.length, 'stakeholders');

    return {
      entity,
      capTable: capTableView,
      totalShares,
      totalInvestment,
      availableShares,
      chartData,
      tableData,
      refreshCapTable,
    };
  }, [entity, capTableView, refreshTrigger]);
};

// Unified mutation functions using the unified repository
export const addStakeholder = async (entityId: string, stakeholder: { name: string; shareClass: string; sharesOwned: number; type?: 'Individual' | 'Entity' | 'Pool' }) => {
  console.log('➕ Adding stakeholder to entity via unified repository:', entityId, stakeholder);
  
  try {
    const repository = await getUnifiedRepository('ENTERPRISE');
    
    // Create owner entity if it doesn't exist (for new stakeholders)
    let ownerEntityId = stakeholder.name; // Use name as ID for now
    
    const existingOwner = await repository.getEntity(ownerEntityId);
    if (!existingOwner) {
      await repository.createEntity({
        name: stakeholder.name,
        type: stakeholder.type || 'Individual',
        jurisdiction: stakeholder.type === 'Individual' ? undefined : 'Delaware',
      }, 'user', 'Created from stakeholder addition');
    }
    
    // Create ownership relationship
    await repository.createOwnership({
      ownerEntityId,
      ownedEntityId: entityId,
      shares: stakeholder.sharesOwned,
      shareClassId: stakeholder.shareClass,
      effectiveDate: new Date(),
      createdBy: 'user',
      updatedBy: 'user'
    }, 'user');
    
    console.log('✅ Stakeholder added via unified repository');
  } catch (error) {
    console.error('❌ Error adding stakeholder via unified repository:', error);
  }
};

export const updateStakeholder = async (entityId: string, stakeholderId: string, updates: { name?: string; shareClass?: string; sharesOwned?: number }) => {
  console.log('📝 Updating stakeholder via unified repository:', stakeholderId, 'in entity:', entityId, updates);
  
  try {
    const repository = await getUnifiedRepository('ENTERPRISE');
    
    // Update ownership record
    await repository.updateOwnership(stakeholderId, {
      shares: updates.sharesOwned,
      shareClassId: updates.shareClass,
      updatedBy: 'user'
    }, 'user', 'Updated stakeholder details');
    
    console.log('✅ Stakeholder updated via unified repository');
  } catch (error) {
    console.error('❌ Error updating stakeholder via unified repository:', error);
  }
};

export const deleteStakeholder = async (entityId: string, stakeholderId: string) => {
  console.log('🗑️ Deleting stakeholder via unified repository:', stakeholderId, 'from entity:', entityId);
  
  try {
    const repository = await getUnifiedRepository('ENTERPRISE');
    await repository.deleteOwnership(stakeholderId, 'user', 'Deleted stakeholder');
    console.log('✅ Stakeholder deleted via unified repository');
  } catch (error) {
    console.error('❌ Error deleting stakeholder via unified repository:', error);
  }
};
