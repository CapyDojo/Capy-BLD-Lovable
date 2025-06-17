
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

// Helper function to build ownership hierarchy
const buildOwnershipHierarchy = () => {
  const allEntities = dataStore.getEntities();
  const allOwnershipRelationships = dataStore.getOwnershipRelationships();
  
  // Create a map of entity ownership relationships
  const ownershipMap = new Map<string, string[]>(); // ownedEntityId -> ownerEntityIds[]
  const reverseOwnershipMap = new Map<string, string[]>(); // ownerEntityId -> ownedEntityIds[]
  
  allOwnershipRelationships.forEach(rel => {
    // Track what entities this entity owns
    if (!reverseOwnershipMap.has(rel.ownerEntityId)) {
      reverseOwnershipMap.set(rel.ownerEntityId, []);
    }
    reverseOwnershipMap.get(rel.ownerEntityId)!.push(rel.ownedEntityId);
    
    // Track who owns this entity
    if (!ownershipMap.has(rel.ownedEntityId)) {
      ownershipMap.set(rel.ownedEntityId, []);
    }
    ownershipMap.get(rel.ownedEntityId)!.push(rel.ownerEntityId);
  });
  
  // Find root entities (entities that are not owned by other entities)
  const rootEntities = allEntities.filter(entity => !ownershipMap.has(entity.id));
  
  // Calculate hierarchy levels
  const entityLevels = new Map<string, number>();
  const visited = new Set<string>();
  
  const calculateLevel = (entityId: string, level: number = 0): number => {
    if (visited.has(entityId)) return entityLevels.get(entityId) || level;
    
    visited.add(entityId);
    entityLevels.set(entityId, level);
    
    // Recursively calculate levels for owned entities
    const ownedEntities = reverseOwnershipMap.get(entityId) || [];
    ownedEntities.forEach(ownedId => {
      const childLevel = calculateLevel(ownedId, level + 1);
      // Update if we found a deeper path to this entity
      if ((entityLevels.get(ownedId) || 0) < childLevel) {
        entityLevels.set(ownedId, childLevel);
      }
    });
    
    return level;
  };
  
  // Start from root entities
  rootEntities.forEach(entity => calculateLevel(entity.id, 0));
  
  // Group entities by level
  const levelGroups = new Map<number, string[]>();
  entityLevels.forEach((level, entityId) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(entityId);
  });
  
  return { entityLevels, levelGroups, ownershipMap, reverseOwnershipMap };
};

// Canvas structure generation with hierarchical layout
export const generateSyncedCanvasStructure = () => {
  console.log('🔄 Generating hierarchical canvas structure');
  const allEntities = dataStore.getEntities();
  
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeIds = new Set<string>();
  
  // Build hierarchy
  const { entityLevels, levelGroups } = buildOwnershipHierarchy();
  
  // Layout constants
  const LEVEL_HEIGHT = 250;
  const NODE_WIDTH = 300;
  const NODE_SPACING = 50;
  const START_Y = 50;
  
  // Position nodes by hierarchy level
  levelGroups.forEach((entityIds, level) => {
    const y = START_Y + (level * LEVEL_HEIGHT);
    const totalWidth = entityIds.length * NODE_WIDTH + (entityIds.length - 1) * NODE_SPACING;
    const startX = Math.max(50, (window.innerWidth - totalWidth) / 2);
    
    entityIds.forEach((entityId, index) => {
      const entity = allEntities.find(e => e.id === entityId);
      if (!entity) return;
      
      const x = startX + (index * (NODE_WIDTH + NODE_SPACING));
      const position = entity.position || { x, y };
      
      // Use saved position if available, otherwise use calculated hierarchical position
      const finalPosition = entity.position ? entity.position : { x, y };
      
      nodes.push({
        id: entity.id,
        type: 'entity',
        position: finalPosition,
        data: {
          name: entity.name,
          type: entity.type,
          jurisdiction: entity.jurisdiction,
          basePosition: { x, y }, // Store the calculated hierarchical position
          hierarchyLevel: level,
        },
      });
      nodeIds.add(entity.id);
    });
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

  console.log('✅ Hierarchical canvas structure generated - Nodes:', nodes.length, 'Edges:', edges.length);
  console.log('📊 Entity levels:', Array.from(levelGroups.entries()));
  
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
