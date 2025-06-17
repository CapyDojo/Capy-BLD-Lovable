
import { Node, Edge } from '@xyflow/react';
import { getUnifiedRepository } from '@/services/repositories/unified';
import { Entity } from '@/types/entity';
import { UnifiedOwnership } from '@/types/unified';

export interface UnifiedStakeholderData {
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

export interface UnifiedEntityStructureData {
  entityId: string;
  stakeholders: UnifiedStakeholderData[];
  totalShares: number;
  authorizedShares: number;
  availableShares: number;
}

// Get cap table data from unified repository
export const getUnifiedCapTableData = async (entityId: string): Promise<UnifiedEntityStructureData | null> => {
  try {
    const repository = await getUnifiedRepository('ENTERPRISE');
    const capTableView = await repository.getCapTableView(entityId);
    
    if (!capTableView) return null;

    const stakeholders: UnifiedStakeholderData[] = capTableView.ownershipSummary.map((ownership) => ({
      id: ownership.ownershipId,
      name: ownership.ownerName,
      type: 'Entity', // Will be determined by the actual entity type
      entityId: ownership.ownerEntityId,
      sharesOwned: ownership.shares,
      shareClass: ownership.shareClassName,
      ownershipPercentage: ownership.percentage,
      fullyDiluted: ownership.percentage, // For now, same as ownership percentage
      pricePerShare: 1, // Default value
      investmentAmount: ownership.shares * 1, // shares * price
    }));

    return {
      entityId,
      stakeholders,
      totalShares: capTableView.totalShares,
      authorizedShares: 10000, // Default authorized shares
      availableShares: 10000 - capTableView.totalShares,
    };
  } catch (error) {
    console.error('❌ Error getting unified cap table data:', error);
    return null;
  }
};

// Build ownership hierarchy using unified repository
const buildUnifiedOwnershipHierarchy = async () => {
  try {
    const repository = await getUnifiedRepository('ENTERPRISE');
    const allEntities = await repository.getAllEntities();
    const hierarchy = await repository.getOwnershipHierarchy();
    
    console.log('🔍 DEBUG: Building unified hierarchy with:', {
      entitiesCount: allEntities.length,
      hierarchyNodes: hierarchy.length
    });

    // Create a map of entity ownership relationships
    const ownershipMap = new Map<string, string[]>(); // ownedEntityId -> ownerEntityIds[]
    const reverseOwnershipMap = new Map<string, string[]>(); // ownerEntityId -> ownedEntityIds[]
    
    // Get all ownerships to build relationships
    const allOwnerships: UnifiedOwnership[] = [];
    for (const entity of allEntities) {
      const entityOwnerships = await repository.getOwnershipsByEntity(entity.id);
      allOwnerships.push(...entityOwnerships);
    }
    
    // Build ownership relationships
    allOwnerships.forEach(ownership => {
      const ownerEntityId = ownership.ownerEntityId;
      const ownedEntityId = ownership.ownedEntityId;
      
      if (ownership.shares > 0 && ownerEntityId !== ownedEntityId) {
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
    });
    
    // Create entity levels
    const entityLevels = new Map<string, number>();
    const visited = new Set<string>();
    
    // Find root entities (not owned by anyone)
    const rootEntities = allEntities.filter(entity => {
      const owners = ownershipMap.get(entity.id) || [];
      return owners.length === 0;
    });
    
    console.log('🌱 DEBUG: Root entities:', rootEntities.map(e => ({ name: e.name, id: e.id })));
    
    // Assign levels
    const assignLevel = (entityId: string, level: number) => {
      if (visited.has(entityId)) return;
      visited.add(entityId);
      entityLevels.set(entityId, level);
      
      const ownedEntities = reverseOwnershipMap.get(entityId) || [];
      ownedEntities.forEach(ownedId => {
        assignLevel(ownedId, level + 1);
      });
    };
    
    rootEntities.forEach(entity => {
      assignLevel(entity.id, 0);
    });
    
    // Handle orphaned entities
    allEntities.forEach(entity => {
      if (!entityLevels.has(entity.id)) {
        entityLevels.set(entity.id, 0);
      }
    });
    
    // Group by level
    const levelGroups = new Map<number, string[]>();
    entityLevels.forEach((level, entityId) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(entityId);
    });
    
    return { entityLevels, levelGroups, ownershipMap, reverseOwnershipMap, allEntities };
  } catch (error) {
    console.error('❌ Error building unified ownership hierarchy:', error);
    return null;
  }
};

// Generate canvas structure using unified repository
export const generateUnifiedCanvasStructure = async () => {
  console.log('🔄 Generating unified hierarchical canvas structure');
  
  const hierarchyData = await buildUnifiedOwnershipHierarchy();
  if (!hierarchyData) {
    return { nodes: [], edges: [] };
  }
  
  const { entityLevels, levelGroups, allEntities } = hierarchyData;
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeIds = new Set<string>();
  
  // Layout constants
  const LEVEL_HEIGHT = 250;
  const NODE_WIDTH = 250;
  const NODE_SPACING = 80;
  const START_Y = 50;
  
  // Position nodes by hierarchy level
  levelGroups.forEach((entityIds, level) => {
    const y = START_Y + (level * LEVEL_HEIGHT);
    const totalWidth = entityIds.length * NODE_WIDTH + (entityIds.length - 1) * NODE_SPACING;
    const startX = Math.max(50, (Math.max(1200, window.innerWidth) - totalWidth) / 2);
    
    entityIds.forEach((entityId, index) => {
      const entity = allEntities.find(e => e.id === entityId);
      if (!entity) return;
      
      const x = startX + (index * (NODE_WIDTH + NODE_SPACING));
      const finalPosition = entity.position || { x, y };
      
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
  try {
    const repository = await getUnifiedRepository('ENTERPRISE');
    
    for (const entity of allEntities) {
      const capTableData = await getUnifiedCapTableData(entity.id);
      if (!capTableData || capTableData.totalShares === 0) continue;

      capTableData.stakeholders.forEach((stakeholder) => {
        if (stakeholder.sharesOwned <= 0) return;
        
        const sourceNodeId = stakeholder.entityId;
        
        if (sourceNodeId && nodeIds.has(sourceNodeId) && sourceNodeId !== entity.id) {
          const edgeId = `e-${sourceNodeId}-${entity.id}`;
          
          edges.push({
            id: edgeId,
            source: sourceNodeId,
            target: entity.id,
            label: `${stakeholder.ownershipPercentage.toFixed(1)}%`,
            style: { stroke: '#3b82f6', strokeWidth: 2 },
            labelStyle: { fill: '#3b82f6', fontWeight: 600 },
          });
        }
      });
    }
  } catch (error) {
    console.error('❌ Error creating unified edges:', error);
  }

  console.log('✅ Unified canvas structure generated - Nodes:', nodes.length, 'Edges:', edges.length);
  
  return { nodes, edges };
};
