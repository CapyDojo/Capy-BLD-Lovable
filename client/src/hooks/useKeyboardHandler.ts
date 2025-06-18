
import { useEffect } from 'react';
import { Node } from '@xyflow/react';

export const useKeyboardHandler = (
  selectedNode: Node | null,
  deleteSelectedNode: () => void
) => {
  // Handle keyboard events - make backspace use the same deletion workflow
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle backspace/delete when we have a selected node and no input is focused
      if ((event.key === 'Backspace' || event.key === 'Delete') && selectedNode) {
        // Check if any input/textarea is focused
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).contentEditable === 'true'
        );
        
        if (!isInputFocused) {
          event.preventDefault();
          console.log('⌨️ Backspace/Delete pressed, triggering deletion workflow');
          deleteSelectedNode();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNode, deleteSelectedNode]);
};
