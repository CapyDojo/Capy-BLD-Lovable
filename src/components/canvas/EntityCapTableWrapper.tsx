
import React, { useState } from 'react';
import { EntityCapTableSection } from './EntityCapTableSection';
import { EntityCapTableSectionV2 } from './EntityCapTableSectionV2';
import { migrationBridge } from '@/services/dataStore/MigrationBridge';

interface EntityCapTableWrapperProps {
  entityId: string;
}

export const EntityCapTableWrapper: React.FC<EntityCapTableWrapperProps> = ({ entityId }) => {
  const [useV2, setUseV2] = useState(false);

  React.useEffect(() => {
    // Enable migration for this component if using V2
    if (useV2) {
      migrationBridge.enableMigrationFor('EntityCapTableSection');
    }
  }, [useV2]);

  return (
    <div>
      {/* Feature flag toggle for testing */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-sm font-medium text-blue-900">Migration Testing</h5>
            <p className="text-xs text-blue-700">Switch between legacy and enterprise data stores</p>
          </div>
          <button
            onClick={() => setUseV2(!useV2)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              useV2 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-300 text-gray-700'
            }`}
          >
            {useV2 ? 'Enterprise Store' : 'Legacy Store'}
          </button>
        </div>
      </div>

      {/* Render appropriate version */}
      {useV2 ? (
        <EntityCapTableSectionV2 entityId={entityId} />
      ) : (
        <EntityCapTableSection entityId={entityId} />
      )}
    </div>
  );
};
