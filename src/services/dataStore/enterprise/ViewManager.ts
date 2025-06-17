
import { Entity, ShareClass } from '@/types/entity';
import { UnifiedOwnership, CapTableView, EntityNode, ShareClassSummary } from '@/types/unified';

export class ViewManager {
  static async getCapTableView(
    entityId: string, 
    entities: Map<string, Entity>,
    ownerships: Map<string, UnifiedOwnership>,
    shareClasses: Map<string, ShareClass>
  ): Promise<CapTableView | null> {
    const entity = entities.get(entityId);
    if (!entity) return null;

    const entityOwnerships = Array.from(ownerships.values())
      .filter(o => o.ownedEntityId === entityId);

    const shareClassEntries = Array.from(shareClasses.values())
      .filter(sc => sc.entityId === entityId);

    // Build share class summaries with issued shares calculation
    const shareClassSummaries: ShareClassSummary[] = shareClassEntries.map(sc => {
      const issuedShares = entityOwnerships
        .filter(o => o.shareClassId === sc.id)
        .reduce((sum, o) => sum + o.shares, 0);
      
      return {
        id: sc.id,
        name: sc.name,
        type: sc.type,
        authorizedShares: sc.totalAuthorizedShares,
        issuedShares,
        votingRights: sc.votingRights
      };
    });

    // Calculate totals and build ownership summary
    const ownershipSummary = entityOwnerships.map(ownership => {
      const owner = entities.get(ownership.ownerEntityId);
      const shareClass = shareClasses.get(ownership.shareClassId);
      
      return {
        ownershipId: ownership.id,
        ownerEntityId: ownership.ownerEntityId,
        ownerName: owner?.name || 'Unknown',
        shares: ownership.shares,
        shareClassName: shareClass?.name || 'Unknown',
        effectiveDate: ownership.effectiveDate,
        percentage: 0 // Will be calculated below
      };
    });

    const totalShares = entityOwnerships.reduce((sum, o) => sum + o.shares, 0);
    
    // Calculate percentages
    ownershipSummary.forEach(summary => {
      summary.percentage = totalShares > 0 ? (summary.shares / totalShares) * 100 : 0;
    });

    return {
      entityId,
      entityName: entity.name,
      totalShares,
      ownershipSummary,
      shareClasses: shareClassSummaries,
      lastUpdated: new Date()
    };
  }

  static async getOwnershipHierarchy(
    entities: Map<string, Entity>,
    ownerships: Map<string, UnifiedOwnership>
  ): Promise<EntityNode[]> {
    const entitiesArray = Array.from(entities.values());
    const ownershipsArray = Array.from(ownerships.values());

    // Find root entities (entities that are not owned by anyone)
    const ownedEntityIds = new Set(ownershipsArray.map(o => o.ownedEntityId));
    const rootEntities = entitiesArray.filter(e => !ownedEntityIds.has(e.id));

    const buildNode = (entity: Entity): EntityNode => {
      const children = ownershipsArray
        .filter(o => o.ownerEntityId === entity.id)
        .map(o => {
          const childEntity = entities.get(o.ownedEntityId);
          return childEntity ? buildNode(childEntity) : null;
        })
        .filter(Boolean) as EntityNode[];

      return {
        entityId: entity.id,
        entityName: entity.name,
        entityType: entity.type,
        children,
        totalOwnedEntities: children.length
      };
    };

    return rootEntities.map(buildNode);
  }

  static async getEntityOwnershipChain(
    entityId: string,
    entities: Map<string, Entity>,
    ownerships: Map<string, UnifiedOwnership>
  ): Promise<EntityNode[]> {
    const chain: EntityNode[] = [];
    let currentEntityId = entityId;

    while (currentEntityId) {
      const entity = entities.get(currentEntityId);
      if (!entity) break;

      const owners = Array.from(ownerships.values())
        .filter(o => o.ownedEntityId === currentEntityId);

      const node: EntityNode = {
        entityId: entity.id,
        entityName: entity.name,
        entityType: entity.type,
        children: [],
        totalOwnedEntities: 0
      };

      chain.unshift(node);

      // Move up the chain (assuming single ownership for simplicity)
      currentEntityId = owners[0]?.ownerEntityId || '';
    }

    return chain;
  }
}
