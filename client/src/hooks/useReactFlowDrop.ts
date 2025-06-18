import { useCallback, useRef } from 'react';
import { getUnifiedRepository } from '@/services/repositories/unified';
import { EntityTypes } from '@/types/entity';

type DraggableNodeType = EntityTypes;

export const useReactFlowDrop = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const createNode = useCallback(async (type: DraggableNodeType, position: { x: number; y: number }) => {
    const id = `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🎯 Creating node of type:', type, 'at position:', position, 'with id:', id);

    try {
      const repository = await getUnifiedRepository('ENTERPRISE');
      
      const newEntity = {
        name: `New ${type}`,
        type,
        jurisdiction: type === 'Individual' ? undefined : 'Delaware',
        registrationNumber: type === 'Individual' ? undefined : `REG-${Date.now()}`,
        incorporationDate: type === 'Individual' ? undefined : new Date(),
        address: 'TBD',
        position, // Store the exact drop position
        metadata: { position }
      };
      
      console.log('➕ Creating new entity in unified repository:', newEntity);
      await repository.createEntity(newEntity, 'user', `Created ${type} entity from canvas`);
      console.log('✅ Entity added to unified repository with position:', position);
    } catch (error) {
      console.error('❌ Error creating entity via unified repository:', error);
    }
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as DraggableNodeType;

      console.log('🎯 Drop event:', {
        type,
        clientX: event.clientX,
        clientY: event.clientY,
      });

      if (typeof type === 'undefined' || !type) {
        console.warn('⚠️ No valid type found in drop data');
        return;
      }

      // Simple screen position for drop
      const position = {
        x: event.clientX - 100,
        y: event.clientY - 50,
      };

      console.log('🎯 Drop position:', position);
      createNode(type, position);
    },
    [createNode]
  );

  return {
    onDrop,
    onDragOver,
    reactFlowWrapper,
  };
};