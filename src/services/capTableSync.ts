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

  const stakeholders: SyncedStakeholderData[] = capTable.investments.map((investment) => {
    const shareholder = capTable.shareholders.find(s => s.id === investment.shareholderId);
    const shareClass = dataStore.getShareClasses().find(sc => sc.id === investment.shareClassId);
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

export const generateSyncedCanvasStructure = () => {
  console.log('🔄 Generating synced canvas structure');
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
    
    // Double check entity still exists in store
    const existsInStore = dataStore.getEntityById(entity.id);
    if (!existsInStore) {
      console.warn('⚠️ Entity not found in store:', entity.id);
      return false;
    }
    
    return true;
  });

  console.log('✅ Valid entities after filtering:', validEntities.length);

  // Create entity nodes - use stored position if available, otherwise calculate default
  validEntities.forEach((entity, index) => {
    // Use stored position if available, otherwise calculate a default position
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

  // Create stakeholder nodes and edges using synced data - only for valid entities
  validEntities.forEach((entity) => {
    const syncedData = syncCapTableData(entity.id);
    if (!syncedData || syncedData.totalShares === 0) return;

    const parentNode = nodes.find(n => n.id === entity.id);
    if (!parentNode) return;

    const individualStakeholders = syncedData.stakeholders.filter(
      sh => sh.type === 'Individual' || sh.type === 'Pool'
    );
    const entityStakeholders = syncedData.stakeholders.filter(
      sh => sh.type === 'Entity'
    );

    // Create edges for entity stakeholders - but only if the source entity still exists
    entityStakeholders.forEach((stakeholder) => {
      if (stakeholder.entityId && nodeIds.has(stakeholder.entityId)) {
        // Verify the source entity still exists in the data store
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
        } else {
          console.warn('⚠️ Source entity no longer exists, skipping edge:', stakeholder.entityId);
          // Treat as individual stakeholder instead
          individualStakeholders.push(stakeholder);
        }
      } else {
        // Entity stakeholder without valid entityId - treat as individual stakeholder
        individualStakeholders.push(stakeholder);
      }
    });

    // Create nodes and edges for individual stakeholders
    const parentPosition = parentNode.data.basePosition as { x: number; y: number };
    
    individualStakeholders.forEach((stakeholder, individualIndex) => {
      const shareholderNodeId = `stakeholder-${stakeholder.id}-of-${entity.id}`;
      if (nodeIds.has(shareholderNodeId)) return;

      const offset = (individualIndex - (individualStakeholders.length - 1) / 2) * 220;
      const shareholderPosition = {
        x: parentPosition.x + offset,
        y: parentPosition.y - 150,
      };
      
      console.log('👤 Creating stakeholder node:', shareholderNodeId, stakeholder.name);
      nodes.push({
        id: shareholderNodeId,
        type: 'shareholder',
        position: shareholderPosition,
        data: { 
          name: stakeholder.name, 
          ownershipPercentage: stakeholder.ownershipPercentage 
        },
      });
      nodeIds.add(shareholderNodeId);
      
      // Use different colors for entity vs individual stakeholders
      const edgeColor = stakeholder.type === 'Entity' ? '#3b82f6' : '#8b5cf6';
      const strokeWidth = stakeholder.type === 'Entity' ? 2 : 1.5;
      
      edges.push({
        id: `e-${shareholderNodeId}-${entity.id}`,
        source: shareholderNodeId,
        target: entity.id,
        label: `${stakeholder.ownershipPercentage.toFixed(1)}%`,
        style: { stroke: edgeColor, strokeWidth },
        labelStyle: { fill: edgeColor, fontWeight: stakeholder.type === 'Entity' ? 600 : 500 },
      });
    });
  });

  console.log('✅ Canvas structure generated - Nodes:', nodes.length, 'Edges:', edges.length);
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
