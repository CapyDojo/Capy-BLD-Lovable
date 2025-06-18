
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2 } from 'lucide-react';

interface StakeholderListItemProps {
  item: {
    id: string;
    name: string;
    shareClass: string;
    sharesOwned: number;
    ownershipPercentage?: number;
  };
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}

export const StakeholderListItem: React.FC<StakeholderListItemProps> = ({
  item,
  onEdit,
  onDelete,
}) => {
  const getSecurityTypeBadgeColor = (shareClass: string) => {
    if (shareClass.includes('Common')) return 'bg-green-100 text-green-800';
    if (shareClass.includes('Preferred')) return 'bg-purple-100 text-purple-800';
    if (shareClass.includes('Options')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 relative group hover:bg-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-medium text-gray-900 truncate">
            {item.name}
          </h5>
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant="secondary" 
              className={`text-xs ${getSecurityTypeBadgeColor(item.shareClass)}`}
            >
              {item.shareClass}
            </Badge>
            <span className="text-xs text-gray-500">
              {item.sharesOwned > 0 ? `${item.sharesOwned.toLocaleString()}` : 'No shares'}
            </span>
            <span className="text-xs text-gray-600 font-medium">
              {item.ownershipPercentage ? `${item.ownershipPercentage.toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
          <button 
            onClick={() => onEdit(item)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <Edit2 className="h-3 w-3" />
          </button>
          <button 
            onClick={() => onDelete(item.id)}
            className="text-gray-400 hover:text-red-600 p-1"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
