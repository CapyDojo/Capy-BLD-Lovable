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
  const allCapTables = dataStore.getCapTables();
  const allShareholders = dataStore.getShareholders();
  
  console.log('🔍 DEBUG: Starting hierarchy build with:', {
    entitiesCount: allEntities.length,
    capTablesCount: allCapTables.length,
    shareholdersCount: allShareholders.length
  });

  // Log all entities
  console.log('🔍 DEBUG: All entities:', allEntities.map(e => ({ id: e.id, name: e.name, type: e.type })));
  
  // Log all cap tables and their investments
  console.log('🔍 DEBUG: All cap tables:');
  allCapTables.forEach(ct => {
    console.log(`  - Entity ${ct.entityId}:`, ct.investments.map(inv => ({
      shareholderId: inv.shareholderId,
      sharesOwned: inv.sharesOwned,
      shareholderName: allShareholders.find(s => s.id === inv.shareholderId)?.name
    })));
  });

  // Create a map of entity ownership relationships from cap table data
  const ownershipMap = new Map<string, string[]>(); // ownedEntityId -> ownerEntityIds[]
  const reverseOwnershipMap = new Map<string, string[]>(); // ownerEntityId -> ownedEntityIds[]
  
  // Build ownership relationships from cap table investments
  allCapTables.forEach(capTable => {
    capTable.investments.forEach(investment => {
      const shareholder = allShareholders.find(s => s.id === investment.shareholderId);
      
      console.log(`🔍 DEBUG: Processing investment in ${capTable.entityId}:`, {
        shareholderId: investment.shareholderId,
        shareholderName: shareholder?.name,
        shareholderType: shareholder?.type,
        shareholderEntityId: shareholder?.entityId,
        sharesOwned: investment.sharesOwned
      });
      
      // Only process entity shareholders for hierarchy (not individuals or pools)
      if (shareholder?.type === 'Entity' && shareholder.entityId && investment.sharesOwned > 0) {
        const ownerEntityId = shareholder.entityId;
        const ownedEntityId = capTable.entityId;
        
        console.log(`🔍 DEBUG: Found ownership relationship: ${shareholder.name} (${ownerEntityId}) owns shares in entity ${ownedEntityId}`);
        
        // Create ownership relationship for ANY ownership amount (not just majority)
        if (ownerEntityId !== ownedEntityId) { // Prevent self-ownership
          // Track what entities this entity owns (subsidiaries/investments)
          if (!reverseOwnershipMap.has(ownerEntityId)) {
            reverseOwnershipMap.set(ownerEntityId, []);
          }
          if (!reverseOwnershipMap.get(ownerEntityId)!.includes(ownedEntityId)) {
            reverseOwnershipMap.get(ownerEntityId)!.push(ownedEntityId);
          }
          
          // Track who owns this entity (parent/investor)
          if (!ownershipMap.has(ownedEntityId)) {
            ownershipMap.set(ownedEntityId, []);
          }
          if (!ownershipMap.get(ownedEntityId)!.includes(ownerEntityId)) {
            ownershipMap.get(ownedEntityId)!.push(ownerEntityId);
          }
        }
      }
    });
  });
  
  console.log('🔍 DEBUG: Final ownership relationships:', {
    ownershipMap: Array.from(ownershipMap.entries()).map(([owned, owners]) => [
      `${allEntities.find(e => e.id === owned)?.name} (${owned})`,
      owners.map(o => `${allEntities.find(e => e.id === o)?.name} (${o})`)
    ]),
    reverseOwnershipMap: Array.from(reverseOwnershipMap.entries()).map(([owner, owned]) => [
      `${allEntities.find(e => e.id === owner)?.name} (${owner})`,
      owned.map(o => `${allEntities.find(e => e.id === o)?.name} (${o})`)
    ])
  });
  
  // Start from TOP level entities (entities that are NOT owned by anyone)
  // and work our way DOWN the hierarchy
  const entityLevels = new Map<string, number>();
  const visited = new Set<string>();
  
  // Find root entities (entities that are not owned by any other entity)
  const rootEntities = allEntities.filter(entity => {
    const owners = ownershipMap.get(entity.id) || [];
    const isRoot = owners.length === 0;
    console.log(`🔍 DEBUG: Entity ${entity.name} (${entity.id}) has ${owners.length} owners, isRoot: ${isRoot}`);
    return isRoot;
  });
  
  console.log('🌱 DEBUG: Root entities (not owned by anyone):', rootEntities.map(e => ({ name: e.name, id: e.id })));
  
  // Recursive function to assign levels starting from roots
  const assignLevel = (entityId: string, level: number) => {
    if (visited.has(entityId)) {
      console.log(`🔍 DEBUG: Already visited ${entityId}, skipping`);
      return;
    }
    
    visited.add(entityId);
    entityLevels.set(entityId, level);
    
    const entityName = allEntities.find(e => e.id === entityId)?.name;
    console.log(`📍 DEBUG: Assigning level ${level} to entity: ${entityName} (${entityId})`);
    
    // Assign next level to all entities owned by this entity
    const ownedEntities = reverseOwnershipMap.get(entityId) || [];
    console.log(`🔍 DEBUG: Entity ${entityName} owns:`, ownedEntities.map(id => allEntities.find(e => e.id === id)?.name));
    
    ownedEntities.forEach(ownedId => {
      assignLevel(ownedId, level + 1);
    });
  };
  
  // Start assignment from root entities at level 0
  rootEntities.forEach(entity => {
    console.log(`🌱 DEBUG: Starting level assignment from root: ${entity.name} (${entity.id})`);
    assignLevel(entity.id, 0);
  });
  
  // Handle any remaining entities (shouldn't happen with proper data)
  allEntities.forEach(entity => {
    if (!entityLevels.has(entity.id)) {
      console.log(`⚠️ DEBUG: Orphaned entity found: ${entity.name} (${entity.id}), assigning to level 0`);
      entityLevels.set(entity.id, 0);
    }
  });
  
  // Group entities by level
  const levelGroups = new Map<number, string[]>();
  entityLevels.forEach((level, entityId) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(entityId);
  });
  
  console.log('📊 DEBUG: Final entity levels:', Array.from(levelGroups.entries()).map(([level, entities]) => [
    level, 
    entities.map(id => {
      const entity = allEntities.find(e => e.id === id);
      return `${entity?.name} (${id})`;
    })
  ]));
  
  return { entityLevels, levelGroups, ownershipMap, reverseOwnershipMap };
};

// Canvas structure generation with hierarchical layout
export const generateSyncedCanvasStructure = () => {
  console.log('🔄 Generating hierarchical canvas structure');
  const allEntities = dataStore.getEntities();
  const allShareholders = dataStore.getShareholders();
  
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeIds = new Set<string>();
  
  // Build hierarchy
  const { entityLevels, levelGroups } = buildOwnershipHierarchy();
  
  // Layout constants - increased spacing to prevent overlap
  const LEVEL_HEIGHT = 250;
  const NODE_WIDTH = 250; // Increased from 200 to account for actual node size
  const NODE_SPACING = 80; // Increased spacing between nodes
  const START_Y = 50;
  
  console.log('🎯 DEBUG: Starting node positioning with layout constants:', {
    LEVEL_HEIGHT,
    NODE_WIDTH,
    NODE_SPACING,
    START_Y
  });
  
  // Position nodes by hierarchy level - Level 0 = top level entities (root), Level 1 = owned by level 0, etc.
  levelGroups.forEach((entityIds, level) => {
    const y = START_Y + (level * LEVEL_HEIGHT); // Direct mapping: level 0 at top
    const totalWidth = entityIds.length * NODE_WIDTH + (entityIds.length - 1) * NODE_SPACING;
    const startX = Math.max(50, (Math.max(1200, window.innerWidth) - totalWidth) / 2); // Use minimum width for consistent layout
    
    console.log(`🎯 DEBUG: Positioning level ${level} entities at y=${y}:`, entityIds.map(id => allEntities.find(e => e.id === id)?.name));
    
    entityIds.forEach((entityId, index) => {
      const entity = allEntities.find(e => e.id === entityId);
      if (!entity) return;
      
      const x = startX + (index * (NODE_WIDTH + NODE_SPACING));
      
      // Use saved position if available, otherwise use calculated hierarchical position
      const finalPosition = entity.position || { x, y };
      
      console.log(`🎯 DEBUG: Entity ${entity.name} positioned at:`, {
        level,
        calculatedPosition: { x, y },
        savedPosition: entity.position,
        finalPosition
      });
      
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
  
  // Create ALL ownership edges (entity-to-entity AND individual-to-entity)
  allEntities.forEach((entity) => {
    const syncedData = syncCapTableData(entity.id);
    if (!syncedData || syncedData.totalShares === 0) return;

    // Create edges for ALL stakeholders with ownership > 0
    syncedData.stakeholders.forEach((stakeholder) => {
      if (stakeholder.sharesOwned <= 0) return;
      
      let sourceNodeId: string | null = null;
      
      if (stakeholder.type === 'Entity' && stakeholder.entityId) {
        // Entity stakeholder - use entity ID
        sourceNodeId = stakeholder.entityId;
      } else if (stakeholder.type === 'Individual') {
        // Individual stakeholder - find corresponding entity node
        const individualEntity = allEntities.find(e => e.name === stakeholder.name && e.type === 'Individual');
        if (individualEntity) {
          sourceNodeId = individualEntity.id;
        }
      }
      // Skip Pool type stakeholders for edges
      
      if (sourceNodeId && nodeIds.has(sourceNodeId) && sourceNodeId !== entity.id) {
        edges.push({
          id: `e-${sourceNodeId}-${entity.id}`,
          source: sourceNodeId,
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
