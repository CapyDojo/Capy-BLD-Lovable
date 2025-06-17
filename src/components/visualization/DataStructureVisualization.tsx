
import React, { useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Database, Users, Building2, Share, Link } from 'lucide-react';

interface DataStructureNode extends Node {
  data: {
    label: string;
    type: 'entity' | 'relationship' | 'shareClass' | 'computed';
    description: string;
    properties: string[];
    icon: React.ReactNode;
  };
}

const DataStructureVisualization: React.FC = () => {
  const { nodes, edges } = useMemo(() => {
    const nodes: DataStructureNode[] = [
      // Core Entity Node
      {
        id: 'entity',
        type: 'custom',
        position: { x: 300, y: 100 },
        data: {
          label: 'Entity',
          type: 'entity',
          description: 'Core business entity (Corporation, LLC, Partnership, Trust, Individual)',
          properties: [
            'id: string',
            'name: string',
            'type: EntityTypes',
            'jurisdiction?: string',
            'registrationNumber?: string',
            'incorporationDate?: Date',
            'address?: string',
            'position?: { x, y }',
            'metadata: Record<string, any>',
            'createdAt: Date',
            'updatedAt: Date',
            'version: number'
          ],
          icon: <Building2 className="h-5 w-5" />
        }
      },

      // Ownership Relationship Node
      {
        id: 'ownership',
        type: 'custom', 
        position: { x: 600, y: 300 },
        data: {
          label: 'OwnershipRelationship',
          type: 'relationship',
          description: 'Defines ownership between entities with share-based tracking',
          properties: [
            'id: string',
            'ownerEntityId: string',
            'ownedEntityId: string', 
            'shares: number // Source of truth',
            'shareClassId: string',
            'effectiveDate: Date',
            'expiryDate?: Date',
            'createdAt: Date',
            'updatedAt: Date',
            'version: number'
          ],
          icon: <Link className="h-5 w-5" />
        }
      },

      // Share Class Node
      {
        id: 'shareClass',
        type: 'custom',
        position: { x: 50, y: 300 },
        data: {
          label: 'ShareClass',
          type: 'shareClass',
          description: 'Defines equity instruments and their characteristics',
          properties: [
            'id: string',
            'entityId: string',
            'name: string',
            'type: ShareClassType',
            'totalAuthorizedShares: number',
            'votingRights: boolean',
            'liquidationPreference?: number',
            'dividendRate?: number',
            'createdAt: Date',
            'updatedAt: Date'
          ],
          icon: <Share className="h-5 w-5" />
        }
      },

      // Ownership Summary (Computed)
      {
        id: 'ownershipSummary',
        type: 'custom',
        position: { x: 300, y: 500 },
        data: {
          label: 'OwnershipSummary',
          type: 'computed',
          description: 'Computed view aggregating ownership data for an entity',
          properties: [
            'entityId: string',
            'totalShares: number',
            'ownerships: OwnershipDetail[]',
            'availableShares: number'
          ],
          icon: <Database className="h-5 w-5" />
        }
      },

      // Entity Service
      {
        id: 'entityService',
        type: 'custom',
        position: { x: 650, y: 100 },
        data: {
          label: 'EntityService',
          type: 'entity',
          description: 'Business logic layer managing entity operations',
          properties: [
            'createEntity()',
            'updateEntity()',
            'deleteEntity()',
            'createOwnership()',
            'createSubsidiary()',
            'getOwnershipSummary()'
          ],
          icon: <Users className="h-5 w-5" />
        }
      }
    ];

    const edges: Edge[] = [
      // Entity to ShareClass (one-to-many)
      {
        id: 'entity-shareClass',
        source: 'entity',
        target: 'shareClass',
        label: '1:N',
        type: 'smoothstep',
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        labelStyle: { fill: '#3b82f6', fontWeight: 600 }
      },

      // Entity to Ownership (as owner)
      {
        id: 'entity-ownership-owner',
        source: 'entity',
        target: 'ownership',
        label: 'owner',
        type: 'smoothstep',
        style: { stroke: '#10b981', strokeWidth: 2 },
        labelStyle: { fill: '#10b981', fontWeight: 600 }
      },

      // Entity to Ownership (as owned)
      {
        id: 'entity-ownership-owned',
        source: 'entity',
        target: 'ownership',
        label: 'owned',
        type: 'smoothstep',
        style: { stroke: '#f59e0b', strokeWidth: 2 },
        labelStyle: { fill: '#f59e0b', fontWeight: 600 }
      },

      // ShareClass to Ownership
      {
        id: 'shareClass-ownership',
        source: 'shareClass',
        target: 'ownership',
        label: 'defines',
        type: 'smoothstep',
        style: { stroke: '#8b5cf6', strokeWidth: 2 },
        labelStyle: { fill: '#8b5cf6', fontWeight: 600 }
      },

      // Ownership to Summary (computed)
      {
        id: 'ownership-summary',
        source: 'ownership',
        target: 'ownershipSummary',
        label: 'aggregates',
        type: 'smoothstep',
        style: { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5,5' },
        labelStyle: { fill: '#ef4444', fontWeight: 600 }
      },

      // Entity Service connections
      {
        id: 'service-entity',
        source: 'entityService',
        target: 'entity',
        label: 'manages',
        type: 'smoothstep',
        style: { stroke: '#6b7280', strokeWidth: 1 },
        labelStyle: { fill: '#6b7280' }
      },

      {
        id: 'service-ownership',
        source: 'entityService',
        target: 'ownership',
        label: 'creates',
        type: 'smoothstep',
        style: { stroke: '#6b7280', strokeWidth: 1 },
        labelStyle: { fill: '#6b7280' }
      }
    ];

    return { nodes, edges };
  }, []);

  const nodeTypes = {
    custom: ({ data }: { data: DataStructureNode['data'] }) => {
      const getNodeColor = (type: string) => {
        switch (type) {
          case 'entity': return 'bg-blue-50 border-blue-200 text-blue-800';
          case 'relationship': return 'bg-green-50 border-green-200 text-green-800';
          case 'shareClass': return 'bg-purple-50 border-purple-200 text-purple-800';
          case 'computed': return 'bg-red-50 border-red-200 text-red-800';
          default: return 'bg-gray-50 border-gray-200 text-gray-800';
        }
      };

      return (
        <div className={`p-4 rounded-lg border-2 shadow-sm min-w-[280px] max-w-[350px] ${getNodeColor(data.type)}`}>
          <div className="flex items-center space-x-2 mb-2">
            {data.icon}
            <h3 className="font-semibold text-sm">{data.label}</h3>
          </div>
          
          <p className="text-xs opacity-75 mb-3 leading-relaxed">{data.description}</p>
          
          <div className="text-xs space-y-1">
            <div className="font-medium mb-1">Properties:</div>
            {data.properties.slice(0, 6).map((prop, index) => (
              <div key={index} className="font-mono text-xs opacity-80 truncate">
                {prop}
              </div>
            ))}
            {data.properties.length > 6 && (
              <div className="text-xs opacity-60">
                ... +{data.properties.length - 6} more
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
        >
          <Controls />
          <MiniMap 
            nodeStrokeColor="#374151"
            nodeColor="#f3f4f6"
            nodeBorderRadius={8}
          />
          <Background color="#e5e7eb" gap={20} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default DataStructureVisualization;
