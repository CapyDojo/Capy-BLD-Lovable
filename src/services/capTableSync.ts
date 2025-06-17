
import { Node, Edge } from '@xyflow/react';
import { dataStore } from './dataStore';
import { Shareholder } from '@/types/capTable';

export interface SyncedStakeholderData {
  id: string;
  name: string;
  type: 'Individual' | 'Entity' | 'Pool';
  entityId?: string;
  sharesOwned: number;
  shareClass: string;
  ownershipPercentage: number;
  fullyDiluted: number;
  pricePerShare: number;
  investmentAmount: number;
}

export interface EntityStructureData {
  entityId: string;
  stakeholders: SyncedStakeholderData[];
  totalShares: number;
  authorizedShares: number;
  availableShares: number;
}

export const syncCapTableData = (entityId: string): EntityStructureData | null => {
  const capTable = dataStore.getCapTableByEntityId(entityId);
  if (!capTable) return null;

  const totalShares = capTable.investments.reduce((sum, inv) => sum + inv.sharesOwned, 0);
  const availableShares = capTable.authorizedShares - totalShares;

  // Get fresh shareholder data from dataStore to ensure we have latest names
  const allShareholders = dataStore.getShareholders();
  console.log('🔄 syncCapTableData: Getting fresh shareholder data, total:', allShareholders.length);

  const stakeholders: SyncedStakeholderData[] = capTable.investments.map((investment) => {
    const shareholder = allShareholders.find(s => s.id === investment.shareholderId);
    const shareClass = dataStore.getShareClasses().find(sc => sc.id === investment.shareClassId);
    const ownershipPercentage = totalShares > 0 ? (investment.sharesOwned / totalShares) * 100 : 0;
    const fullyDiluted = capTable.authorizedShares > 0 ? (investment.sharesOwned / capTable.authorizedShares) * 100 : 0;

    console.log('📋 syncCapTableData: Processing stakeholder:', {
      investmentId: investment.id,
      shareholderId: investment.shareholderId,
      shareholderName: shareholder?.name || 'Unknown',
      sharesOwned: investment.sharesOwned
    });

    return {
      id: investment.id,
      name: shareholder?.name || 'Unknown',
      type: shareholder?.type || 'Individual',
      entityId: shareholder?.entityId,
      sharesOwned: investment.sharesOwned,
      shareClass: shareClass?.name || 'Unknown',
      ownershipPercentage,
      fullyDiluted,
      pricePerShare: investment.pricePerShare,
      investmentAmount: investment.investmentAmount,
    };
  });

  console.log('✅ syncCapTableData: Synced', stakeholders.length, 'stakeholders with fresh names for entity:', entityId);

  return {
    entityId,
    stakeholders,
    totalShares,
    authorizedShares: capTable.authorizedShares,
    availableShares,
  };
};

export const generateSyncedCanvasStructure = () => {
  console.log('🔄 Generating synced canvas structure (simplified)');
  const allEntities = dataStore.getEntities();
  console.log('📊 Total entities in store:', allEntities.length);
  
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeIds = new Set<string>();

  // Filter out any null/undefined entities and ensure they exist in the store
  const validEntities = allEntities.filter(entity => {
    if (!entity || !entity.id) {
      console.warn('⚠️ Found invalid entity:', entity);
      return false;
    }
    
    const existsInStore = dataStore.getEntityById(entity.id);
    if (!existsInStore) {
      console.warn('⚠️ Entity not found in store:', entity.id);
      return false;
    }
    
    return true;
  });

  console.log('✅ Valid entities after filtering:', validEntities.length);

  // Create entity nodes only - no individual stakeholder nodes
  validEntities.forEach((entity, index) => {
    const position = entity.position || { 
      x: 250 + (index % 3) * 400, 
      y: 100 + Math.floor(index / 3) * 300
    };
    
    console.log('➕ Creating entity node:', entity.id, entity.name, 'at position:', position);
    nodes.push({
      id: entity.id,
      type: 'entity',
      position,
      data: {
        name: entity.name,
        type: entity.type,
        jurisdiction: entity.jurisdiction,
        basePosition: position,
      },
    });
    nodeIds.add(entity.id);
  });

  // Create edges for entity-to-entity ownership only
  validEntities.forEach((entity) => {
    const syncedData = syncCapTableData(entity.id);
    if (!syncedData || syncedData.totalShares === 0) return;

    // Only create edges for entity stakeholders (not individuals)
    const entityStakeholders = syncedData.stakeholders.filter(
      sh => sh.type === 'Entity' && sh.entityId
    );

    entityStakeholders.forEach((stakeholder) => {
      if (stakeholder.entityId && nodeIds.has(stakeholder.entityId)) {
        const sourceEntity = dataStore.getEntityById(stakeholder.entityId);
        if (sourceEntity) {
          console.log('🔗 Creating entity ownership edge:', stakeholder.entityId, '->', entity.id);
          edges.push({
            id: `e-${stakeholder.entityId}-${entity.id}`,
            source: stakeholder.entityId,
            target: entity.id,
            label: `${stakeholder.ownershipPercentage.toFixed(1)}%`,
            style: { stroke: '#3b82f6', strokeWidth: 2 },
            labelStyle: { fill: '#3b82f6', fontWeight: 600 },
          });
        }
      }
    });
  });

  console.log('✅ Simplified canvas structure generated - Nodes:', nodes.length, 'Edges:', edges.length);
  return { nodes, edges };
};

// Export mutation functions for chart updates
export const updateOwnershipFromChart = (sourceEntityId: string, targetEntityId: string, ownershipPercentage: number) => {
  console.log('📊 Updating ownership from chart:', sourceEntityId, '->', targetEntityId, ownershipPercentage + '%');
  dataStore.updateOwnership(sourceEntityId, targetEntityId, ownershipPercentage);
};

export const removeOwnershipFromChart = (sourceEntityId: string, targetEntityId: string) => {
  console.log('🗑️ Removing ownership from chart:', sourceEntityId, '->', targetEntityId);
  dataStore.removeOwnership(sourceEntityId, targetEntityId);
};

export const addEntityFromChart = (entity: any) => {
  console.log('➕ Adding entity from chart:', entity.name);
  dataStore.addEntity(entity);
};

export const updateEntityFromChart = (id: string, updates: any) => {
  console.log('📝 Updating entity from chart:', id, updates);
  dataStore.updateEntity(id, updates);
};

export const deleteEntityFromChart = (id: string) => {
  console.log('🗑️ Deleting entity from chart:', id);
  dataStore.deleteEntity(id);
};
