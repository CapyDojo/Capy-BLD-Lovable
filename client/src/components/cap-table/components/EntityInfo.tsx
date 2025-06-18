
import React from 'react';
import { Entity } from '@/types/entity';
import { CapTableView } from '@/types/unified';

interface EntityInfoProps {
  entity: Entity;
  capTableView: CapTableView;
}

export const EntityInfo: React.FC<EntityInfoProps> = ({ entity, capTableView }) => {
  return (
    <div className="pt-4 border-t border-gray-200">
      <div className="text-sm text-gray-600 space-y-2">
        <div className="flex justify-between">
          <span>Entity Type:</span>
          <span className="font-medium">{entity.type}</span>
        </div>
        <div className="flex justify-between">
          <span>Jurisdiction:</span>
          <span className="font-medium">{entity.jurisdiction || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span>Total Shares:</span>
          <span className="font-medium">{capTableView.totalShares.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Shareholders:</span>
          <span className="font-medium">{capTableView.ownershipSummary.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Share Classes:</span>
          <span className="font-medium">{capTableView.shareClasses.length}</span>
        </div>
      </div>
    </div>
  );
};
