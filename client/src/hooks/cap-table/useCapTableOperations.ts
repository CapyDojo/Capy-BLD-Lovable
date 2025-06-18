
import { IUnifiedEntityRepository } from '@/services/repositories/unified/IUnifiedRepository';
import { StakeholderInput } from './types';

export const useCapTableOperations = (repository: IUnifiedEntityRepository | null, entityId: string) => {
  const createOwnership = async (ownershipData: StakeholderInput) => {
    if (!repository || !entityId) return;

    try {
      console.log('🔄 Creating ownership via unified repository:', ownershipData);
      
      await repository.createOwnership({
        ownedEntityId: entityId,
        ownerEntityId: ownershipData.ownerEntityId || '',
        shares: ownershipData.shares,
        shareClassId: ownershipData.shareClassId,
        effectiveDate: new Date(),
        createdBy: 'user',
        updatedBy: 'user'
      }, 'user');

      console.log('✅ Ownership creation completed via unified repository');
    } catch (error) {
      console.error('❌ Error creating ownership via unified repository:', error);
      throw error;
    }
  };

  return { createOwnership };
};
