
import { useState } from 'react';
import { Node } from '@xyflow/react';

export const useCanvasState = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const triggerRefresh = () => {
    setRefreshKey(prev => {
      const newKey = prev + 1;
      console.log('🔄 useCanvasState: Refresh key updated from', prev, 'to', newKey);
      return newKey;
    });
  };

  return {
    refreshKey,
    selectedNode,
    setSelectedNode,
    sidebarOpen,
    setSidebarOpen,
    isDeleting,
    setIsDeleting,
    triggerRefresh
  };
};
