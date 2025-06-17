
import { Node, Edge } from '@xyflow/react';
import { dataStore } from './dataStore';

// Simplified sync service - mainly for canvas operations
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

// Simplified sync function - just gets fresh data from dataStore
export const syncCapTableData = (entityId: string): EntityStructureData | null => {
  const capTable = dataStore.getCapTableByEntityId(entityId);
  if (!capTable) return null;

  const totalShares = capTable.investments.reduce((sum, inv) => sum + inv.sharesOwned, 0);
  const availableShares = capTable.authorizedShares - totalShares;

  // Get fresh data directly from dataStore
  const allShareholders = dataStore.getShareholders();
  const allShareClasses = dataStore.getShareClasses();

  const stakeholders: SyncedStakeholderData[] = capTable.investments.map((investment) => {
    const shareholder = allShareholders.find(s => s.id === investment.shareholderId);
    const shareClass = allShareClasses.find(sc => sc.id === investment.shareClassId);
    const ownershipPercentage = totalShares > 0 ? (investment.sharesOwned / totalShares) * 100 : 0;
    const fullyDiluted = capTable.authorizedShares > 0 ? (investment.sharesOwned / capTable.authorizedShares) * 100 : 0;

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

  return {
    entityId,
    stakeholders,
    totalShares,
    authorizedShares: capTable.authorizedShares,
    availableShares,
  };
};

// Canvas structure generation - simplified
export const generateSyncedCanvasStructure = () => {
  console.log('🔄 Generating canvas structure');
  const allEntities = dataStore.getEntities();
  
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeIds = new Set<string>();

  // Create entity nodes
  allEntities.forEach((entity, index) => {
    const position = entity.position || { 
      x: 250 + (index % 3) * 400, 
      y: 100 + Math.floor(index / 3) * 300
    };
    
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

  // Create entity-to-entity ownership edges
  allEntities.forEach((entity) => {
    const syncedData = syncCapTableData(entity.id);
    if (!syncedData || syncedData.totalShares === 0) return;

    const entityStakeholders = syncedData.stakeholders.filter(
      sh => sh.type === 'Entity' && sh.entityId
    );

    entityStakeholders.forEach((stakeholder) => {
      if (stakeholder.entityId && nodeIds.has(stakeholder.entityId)) {
        edges.push({
          id: `e-${stakeholder.entityId}-${entity.id}`,
          source: stakeholder.entityId,
          target: entity.id,
          label: `${stakeholder.ownershipPercentage.toFixed(1)}%`,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
          labelStyle: { fill: '#3b82f6', fontWeight: 600 },
        });
      }
    });
  });

  console.log('✅ Canvas structure generated - Nodes:', nodes.length, 'Edges:', edges.length);
  return { nodes, edges };
};

// Mutation functions that just delegate to dataStore
export const updateOwnershipFromChart = (sourceEntityId: string, targetEntityId: string, ownershipPercentage: number) => {
  dataStore.updateOwnership(sourceEntityId, targetEntityId, ownershipPercentage);
};

export const removeOwnershipFromChart = (sourceEntityId: string, targetEntityId: string) => {
  dataStore.removeOwnership(sourceEntityId, targetEntityId);
};

export const addEntityFromChart = (entity: any) => {
  dataStore.addEntity(entity);
};

export const updateEntityFromChart = (id: string, updates: any) => {
  dataStore.updateEntity(id, updates);
};

export const deleteEntityFromChart = (id: string) => {
  dataStore.deleteEntity(id);
};
