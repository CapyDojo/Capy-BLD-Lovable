
import { getUnifiedRepository } from '@/services/repositories/unified';
import { AddStakeholderInput, StakeholderUpdate } from './types';

export const addStakeholder = async (entityId: string, stakeholder: AddStakeholderInput) => {
  console.log('➕ Adding stakeholder to entity via unified repository:', entityId, stakeholder);
  
  try {
    const repository = await getUnifiedRepository('ENTERPRISE');
    
    // Create owner entity if it doesn't exist (for new stakeholders)
    let ownerEntityId = stakeholder.name; // Use name as ID for now
    
    const existingOwner = await repository.getEntity(ownerEntityId);
    if (!existingOwner) {
      await repository.createEntity({
        name: stakeholder.name,
        type: (stakeholder.type || 'Individual') as any,
        jurisdiction: stakeholder.type === 'Individual' ? undefined : 'Delaware',
        metadata: {}
      }, 'user', 'Created from stakeholder addition');
    }
    
    // Create ownership relationship
    await repository.createOwnership({
      ownerEntityId,
      ownedEntityId: entityId,
      shares: stakeholder.sharesOwned,
      shareClassId: stakeholder.shareClass,
      effectiveDate: new Date(),
      createdBy: 'user',
      updatedBy: 'user'
    }, 'user');
    
    console.log('✅ Stakeholder added via unified repository');
  } catch (error) {
    console.error('❌ Error adding stakeholder via unified repository:', error);
  }
};

export const updateStakeholder = async (entityId: string, stakeholderId: string, updates: StakeholderUpdate) => {
  console.log('📝 Updating stakeholder via unified repository:', stakeholderId, 'in entity:', entityId, updates);
  
  try {
    const repository = await getUnifiedRepository('ENTERPRISE');
    
    // Update ownership record
    await repository.updateOwnership(stakeholderId, {
      shares: updates.sharesOwned,
      shareClassId: updates.shareClass,
      updatedBy: 'user'
    }, 'user', 'Updated stakeholder details');
    
    console.log('✅ Stakeholder updated via unified repository');
  } catch (error) {
    console.error('❌ Error updating stakeholder via unified repository:', error);
  }
};

export const deleteStakeholder = async (entityId: string, stakeholderId: string) => {
  console.log('🗑️ Deleting stakeholder via unified repository:', stakeholderId, 'from entity:', entityId);
  
  try {
    const repository = await getUnifiedRepository('ENTERPRISE');
    await repository.deleteOwnership(stakeholderId, 'user', 'Deleted stakeholder');
    console.log('✅ Stakeholder deleted via unified repository');
  } catch (error) {
    console.error('❌ Error deleting stakeholder via unified repository:', error);
  }
};
