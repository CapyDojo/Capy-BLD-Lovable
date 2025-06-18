
import { Node, Edge } from '@xyflow/react';
import { getUnifiedRepository } from '@/services/repositories/unified';

export const generateUnifiedCanvasStructure = async () => {
  console.log('🔄 Generating unified canvas structure');
  
  try {
    const repository = await getUnifiedRepository('ENTERPRISE');
    const allEntities = await repository.getAllEntities();
    
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodeIds = new Set<string>();
    
    // Build hierarchy from ownership relationships
    const { entityLevels, levelGroups } = await buildOwnershipHierarchy(repository);
    
    // Layout constants
    const LEVEL_HEIGHT = 250;
    const NODE_WIDTH = 250;
    const NODE_SPACING = 80;
    const START_Y = 50;
    
    console.log('🎯 Positioning nodes by hierarchy level');
    
    // Position nodes by hierarchy level
    levelGroups.forEach((entityIds, level) => {
      const y = START_Y + (level * LEVEL_HEIGHT);
      const totalWidth = entityIds.length * NODE_WIDTH + (entityIds.length - 1) * NODE_SPACING;
      const startX = Math.max(50, (Math.max(1200, window.innerWidth) - totalWidth) / 2);
      
      console.log(`🎯 Positioning level ${level} entities at y=${y}:`, entityIds.map(id => 
        allEntities.find(e => e.id === id)?.name
      ));
      
      entityIds.forEach((entityId, index) => {
        const entity = allEntities.find(e => e.id === entityId);
        if (!entity) return;
        
        const x = startX + (index * (NODE_WIDTH + NODE_SPACING));
        const finalPosition = { x, y };
        
        console.log(`🎯 Entity ${entity.name} positioned at:`, finalPosition);
        
        nodes.push({
          id: entity.id,
          type: 'entity',
          position: finalPosition,
          data: {
            name: entity.name,
            type: entity.type,
            jurisdiction: entity.jurisdiction,
            basePosition: { x, y },
            hierarchyLevel: level,
          },
        });
        nodeIds.add(entity.id);
      });
    });
    
    // Create ownership edges
    for (const entity of allEntities) {
      const capTable = await repository.getCapTableView(entity.id);
      if (!capTable || capTable.totalShares === 0) continue;

      capTable.ownershipSummary.forEach((ownership) => {
        if (ownership.shares <= 0) return;
        
        const sourceNodeId = ownership.ownerEntityId;
        
        if (sourceNodeId && nodeIds.has(sourceNodeId) && sourceNodeId !== entity.id) {
          const edgeId = `e-${sourceNodeId}-${entity.id}`;
          console.log(`✅ Creating edge: ${edgeId} with ${ownership.percentage.toFixed(1)}% ownership`);
          
          edges.push({
            id: edgeId,
            source: sourceNodeId,
            target: entity.id,
            label: `${ownership.percentage.toFixed(1)}%`,
            style: { stroke: '#3b82f6', strokeWidth: 2 },
            labelStyle: { fill: '#3b82f6', fontWeight: 600 },
          });
        }
      });
    }

    console.log('✅ Unified canvas structure generated - Nodes:', nodes.length, 'Edges:', edges.length);
    
    return { nodes, edges };
  } catch (error) {
    console.error('❌ Error generating unified canvas structure:', error);
    return { nodes: [], edges: [] };
  }
};

// Helper function to build ownership hierarchy using unified repository
const buildOwnershipHierarchy = async (repository) => {
  const allEntities = await repository.getAllEntities();
  
  console.log('🔍 Building hierarchy with entities:', allEntities.length);

  // Create ownership maps
  const ownershipMap = new Map<string, string[]>(); // ownedEntityId -> ownerEntityIds[]
  const reverseOwnershipMap = new Map<string, string[]>(); // ownerEntityId -> ownedEntityIds[]
  
  // Build ownership relationships from unified repository
  for (const entity of allEntities) {
    const ownerships = await repository.getOwnershipsByEntity(entity.id);
    
    ownerships.forEach(ownership => {
      if (ownership.shares > 0) {
        const ownerEntityId = ownership.ownerEntityId;
        const ownedEntityId = ownership.ownedEntityId;
        
        console.log(`🔍 Found ownership: ${ownerEntityId} owns shares in ${ownedEntityId}`);
        
        if (ownerEntityId !== ownedEntityId) { // Prevent self-ownership
          // Track what entities this entity owns
          if (!reverseOwnershipMap.has(ownerEntityId)) {
            reverseOwnershipMap.set(ownerEntityId, []);
          }
          if (!reverseOwnershipMap.get(ownerEntityId)!.includes(ownedEntityId)) {
            reverseOwnershipMap.get(ownerEntityId)!.push(ownedEntityId);
          }
          
          // Track who owns this entity
          if (!ownershipMap.has(ownedEntityId)) {
            ownershipMap.set(ownedEntityId, []);
          }
          if (!ownershipMap.get(ownedEntityId)!.includes(ownerEntityId)) {
            ownershipMap.get(ownedEntityId)!.push(ownerEntityId);
          }
        }
      }
    });
  }
  
  // Find root entities (not owned by anyone)
  const rootEntities = allEntities.filter(entity => {
    const owners = ownershipMap.get(entity.id) || [];
    return owners.length === 0;
  });
  
  console.log('🌱 Root entities:', rootEntities.map(e => e.name));
  
  // Assign levels starting from roots
  const entityLevels = new Map<string, number>();
  const visited = new Set<string>();
  
  const assignLevel = (entityId: string, level: number) => {
    if (visited.has(entityId)) return;
    
    visited.add(entityId);
    entityLevels.set(entityId, level);
    
    const entityName = allEntities.find(e => e.id === entityId)?.name;
    console.log(`📍 Assigning level ${level} to entity: ${entityName}`);
    
    // Assign next level to owned entities
    const ownedEntities = reverseOwnershipMap.get(entityId) || [];
    ownedEntities.forEach(ownedId => {
      assignLevel(ownedId, level + 1);
    });
  };
  
  // Start from root entities
  rootEntities.forEach(entity => {
    assignLevel(entity.id, 0);
  });
  
  // Handle orphaned entities
  allEntities.forEach(entity => {
    if (!entityLevels.has(entity.id)) {
      console.log(`⚠️ Orphaned entity: ${entity.name}, assigning to level 0`);
      entityLevels.set(entity.id, 0);
    }
  });
  
  // Group by levels
  const levelGroups = new Map<number, string[]>();
  entityLevels.forEach((level, entityId) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(entityId);
  });
  
  console.log('📊 Entity levels:', Array.from(levelGroups.entries()));
  
  return { entityLevels, levelGroups, ownershipMap, reverseOwnershipMap };
};
