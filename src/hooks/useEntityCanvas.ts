
import { useCanvasState } from './useCanvasState';
import { useCanvasData } from './useCanvasData';
import { useCanvasDeletion } from './useCanvasDeletion';
import { useCanvasEvents } from './useCanvasEvents';
import { useKeyboardHandler } from './useKeyboardHandler';

export const useEntityCanvas = () => {
  const {
    refreshKey,
    selectedNode,
    setSelectedNode,
    sidebarOpen,
    setSidebarOpen,
    isDeleting,
    setIsDeleting,
    triggerRefresh
  } = useCanvasState();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange
  } = useCanvasData(refreshKey, isDeleting, selectedNode, setSelectedNode, setSidebarOpen);

  const { deleteSelectedNode } = useCanvasDeletion(
    selectedNode,
    setIsDeleting,
    setSidebarOpen,
    setSelectedNode
  );

  const {
    reactFlowWrapper,
    onConnect,
    onNodeClick,
    createNode,
    onDragOver,
    onDrop,
    updateSelectedNode
  } = useCanvasEvents(selectedNode, setSelectedNode, setSidebarOpen);

  useKeyboardHandler(selectedNode, deleteSelectedNode);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    selectedNode,
    sidebarOpen,
    setSidebarOpen,
    reactFlowWrapper,
    createNode,
    onDragOver,
    onDrop,
    updateSelectedNode,
    deleteSelectedNode,
  };
};
