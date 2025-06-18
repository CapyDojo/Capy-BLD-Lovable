
import { useState } from 'react';
import { useCapTableRepository } from './cap-table/useCapTableRepository';
import { useCapTableData } from './cap-table/useCapTableData';
import { useCapTableComputation } from './cap-table/useCapTableComputation';
import { useCapTableOperations } from './cap-table/useCapTableOperations';
import { CapTableData } from './cap-table/types';

export const useCapTable = (entityId: string): CapTableData | null => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const repository = useCapTableRepository();
  const { entity, capTableView } = useCapTableData(repository, entityId, refreshTrigger);
  const computedData = useCapTableComputation(entity, capTableView, refreshTrigger);
  const { createOwnership } = useCapTableOperations(repository, entityId);

  const refreshCapTable = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!computedData) {
    return null;
  }

  return {
    ...computedData,
    refreshCapTable,
  };
};

// Re-export stakeholder operations for backward compatibility
export { addStakeholder, updateStakeholder, deleteStakeholder } from './cap-table/stakeholderOperations';
export type { CapTableData } from './cap-table/types';
