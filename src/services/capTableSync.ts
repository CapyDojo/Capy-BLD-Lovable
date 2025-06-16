
import { Node, Edge } from '@xyflow/react';
import { getCapTableByEntityId, getAllEntities } from '@/data/mockData';
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
  const capTable = getCapTableByEntityId(entityId);
  if (!capTable) return null;

  const totalShares = capTable.investments.reduce((sum, inv) => sum + inv.sharesOwned, 0);
  const availableShares = capTable.authorizedShares - totalShares;

  const stakeholders: SyncedStakeholderData[] = capTable.investments.map((investment) => {
    const shareholder = capTable.shareholders.find(s => s.id === investment.shareholderId);
    const shareClass = capTable.shareClasses.find(sc => sc.id === investment.shareClassId);
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
  const allEntities = getAllEntities();
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeIds = new Set<string>();

  // Create entity nodes
  allEntities.forEach((entity, index) => {
    const position = { 
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

  // Create stakeholder nodes and edges using synced data
  allEntities.forEach((entity) => {
    const syncedData = syncCapTableData(entity.id);
    if (!syncedData || syncedData.totalShares === 0) return;

    const parentNode = nodes.find(n => n.id === entity.id);
    if (!parentNode) return;

    const individualStakeholders = syncedData.stakeholders.filter(
      sh => sh.type === 'Individual' || sh.type === 'Pool'
    );
    const entityStakeholders = syncedData.stakeholders.filter(
      sh => sh.type === 'Entity' && sh.entityId
    );

    // Create edges for entity stakeholders
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
      
      edges.push({
        id: `e-${shareholderNodeId}-${entity.id}`,
        source: shareholderNodeId,
        target: entity.id,
        label: `${stakeholder.ownershipPercentage.toFixed(1)}%`,
        style: { stroke: '#8b5cf6', strokeWidth: 1.5 },
        labelStyle: { fill: '#8b5cf6', fontWeight: 500 },
      });
    });
  });

  return { nodes, edges };
};
