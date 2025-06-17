import { Node, Edge } from '@xyflow/react';
import { dataStore } from './dataStore';

// Cache for expensive calculations
let canvasStructureCache: { nodes: Node[]; edges: Edge[]; timestamp: number } | null = null;
let lastDataVersion = 0;

export const generateSyncedCanvasStructure = () => {
  // Simple cache invalidation based on data changes
  const currentTime = Date.now();
  const dataVersion = dataStore.getEntities().length + dataStore.getCapTables().length;
  
  // Return cached result if data hasn't changed and cache is fresh (< 1 second)
  if (canvasStructureCache && 
      dataVersion === lastDataVersion && 
      (currentTime - canvasStructureCache.timestamp) < 1000) {
    console.log('🚀 Using cached canvas structure');
    return canvasStructureCache;
  }

  console.log('🔄 Generating fresh canvas structure');
  const startTime = performance.now();
  
  const entities = dataStore.getEntities();
  const capTables = dataStore.getCapTables();

  // Build nodes for each entity
  // Build nodes for each entity
  const entityNodes: Node[] = entities.map(entity => ({
    id: entity.id,
    type: 'entity',
    position: { x: 0, y: 0 }, // Initial position, will be updated
    data: {
      entity,
      capTable: capTables.find(ct => ct.entityId === entity.id),
      basePosition: { x: 0, y: 0 }
    }
  }));

  // Map ownership relationships
  const ownershipEdges: Edge[] = [];
  entities.forEach(entity => {
    const capTable = capTables.find(ct => ct.entityId === entity.id);
    if (!capTable) return;

    capTable.investments.forEach(investment => {
      const shareholder = dataStore.getShareholders().find(s => s.id === investment.shareholderId);
      if (shareholder?.type === 'Entity' && shareholder.entityId) {
        const ownerEntity = entities.find(e => e.id === shareholder.entityId);
        if (ownerEntity) {
          ownershipEdges.push({
            id: `${ownerEntity.id}-${entity.id}`,
            source: ownerEntity.id,
            target: entity.id,
            type: 'ownership',
            animated: true,
            style: { stroke: '#10b981', strokeWidth: 2 }
          });
        }
      }
    });
  });
  
  // Build ownership relationships map for efficient lookups
  const ownershipMap = new Map<string, string[]>();
  const reverseOwnershipMap = new Map<string, string[]>();

  entities.forEach(entity => {
    const capTable = capTables.find(ct => ct.entityId === entity.id);
    if (!capTable) return;

    capTable.investments.forEach(investment => {
      const shareholder = dataStore.getShareholders().find(s => s.id === investment.shareholderId);
      if (shareholder?.type === 'Entity' && shareholder.entityId) {
        const ownerEntity = entities.find(e => e.id === shareholder.entityId);
        if (ownerEntity) {
          // Map ownership relationships
          if (!ownershipMap.has(ownerEntity.id)) {
            ownershipMap.set(ownerEntity.id, []);
          }
          ownershipMap.get(ownerEntity.id)!.push(entity.id);
          
          if (!reverseOwnershipMap.has(entity.id)) {
            reverseOwnershipMap.set(entity.id, []);
          }
          reverseOwnershipMap.get(entity.id)!.push(ownerEntity.id);
        }
      }
    });
  });

  // Determine hierarchy levels efficiently
  const visited = new Set<string>();
  const entityLevels = new Map<string, number>();
  
  // Find root entities (not owned by anyone)
  const rootEntities = entities.filter(entity => !reverseOwnershipMap.has(entity.id));
  
  // Assign levels using BFS
  const queue: { entityId: string; level: number }[] = [];
  rootEntities.forEach(entity => {
    queue.push({ entityId: entity.id, level: 0 });
  });
  
  while (queue.length > 0) {
    const { entityId, level } = queue.shift()!;
    
    if (visited.has(entityId)) continue;
    visited.add(entityId);
    entityLevels.set(entityId, level);
    
    // Add owned entities to queue with next level
    const ownedEntities = ownershipMap.get(entityId) || [];
    ownedEntities.forEach(ownedId => {
      if (!visited.has(ownedId)) {
        queue.push({ entityId: ownedId, level: level + 1 });
      }
    });
  }

  // Generate nodes with optimized positioning
  const levelGroups = new Map<number, string[]>();
  entityLevels.forEach((level, entityId) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(entityId);
  });

  const nodes: Node[] = [];
  const VERTICAL_SPACING = 150;
  const HORIZONTAL_SPACING = 300;

  levelGroups.forEach((entityIds, level) => {
    const yPosition = level * VERTICAL_SPACING;
    entityIds.forEach((entityId, index) => {
      const entity = entities.find(e => e.id === entityId)!;
      const xPosition = (index - (entityIds.length - 1) / 2) * HORIZONTAL_SPACING;
      
      nodes.push({
        id: entity.id,
        type: 'entity',
        position: { x: xPosition, y: yPosition },
        data: {
          entity,
          capTable: capTables.find(ct => ct.entityId === entity.id),
          basePosition: { x: xPosition, y: yPosition }
        }
      });
    });
  });

  // Generate edges efficiently
  const edges: Edge[] = [];
  ownershipMap.forEach((ownedEntityIds, ownerEntityId) => {
    ownedEntityIds.forEach(ownedEntityId => {
      edges.push({
        id: `${ownerEntityId}-${ownedEntityId}`,
        source: ownerEntityId,
        target: ownedEntityId,
        type: 'ownership',
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2 }
      });
    });
  });

  const result = { nodes, edges, timestamp: currentTime };
  
  // Cache the result
  canvasStructureCache = result;
  lastDataVersion = dataVersion;
  
  const endTime = performance.now();
  console.log(`✅ Canvas structure generated in ${(endTime - startTime).toFixed(2)}ms`);
  
  return result;
};

// Function to invalidate cache when data changes
export const invalidateCanvasCache = () => {
  console.log('🗑️ Invalidating canvas structure cache');
  canvasStructureCache = null;
};
