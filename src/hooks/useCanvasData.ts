import { useMemo, useEffect } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import { generateSyncedCanvasStructure } from '@/services/capTableSync';
import { dataStore } from '@/services/dataStore';

const generateInitialState = () => {
  console.log('🔄 Generating initial canvas state');
  return generateSyncedCanvasStructure();
};

export const useCanvasData = (refreshKey: number, isDeleting: boolean, selectedNode: any, setSelectedNode: any, setSidebarOpen: any) => {
  // Subscribe to data store changes for auto-sync
  useEffect(() => {
    console.log('🔗 Setting up data store subscription in useCanvasData');
    const unsubscribe = dataStore.subscribe(() => {
      // Skip refresh if we're in the middle of a deletion
      if (isDeleting) {
        console.log('⏳ Skipping refresh during deletion process');
        return;
      }
      
      console.log('📡 useCanvasData: Data store changed, triggering refresh');
      
      // Check if selected node's entity still exists
      if (selectedNode) {
        const entity = dataStore.getEntityById(selectedNode.id);
        if (!entity) {
          console.log('🚪 Selected node entity deleted, closing sidebar');
          setSelectedNode(null);
          setSidebarOpen(false);
        }
      }
    });
    return unsubscribe;
  }, [selectedNode, isDeleting, setSelectedNode, setSidebarOpen]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    console.log('🔄 useCanvasData: Regenerating canvas structure due to refresh key:', refreshKey);
    const result = generateInitialState();
    console.log('📊 useCanvasData: Generated', result.nodes.length, 'nodes and', result.edges.length, 'edges');
    return result;
  }, [refreshKey]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when data changes - preserve positions
  useEffect(() => {
    // Skip updates if we're in the middle of a deletion
    if (isDeleting) {
      console.log('⏳ Skipping nodes/edges update during deletion');
      return;
    }
    
    console.log('🔄 useCanvasData: Updating nodes and edges from data store changes');
    const { nodes: newNodes, edges: newEdges } = generateInitialState();
    console.log('📊 useCanvasData: Setting new nodes count:', newNodes.length, 'new edges count:', newEdges.length);
    
    // Preserve existing node positions
    const updatedNodes = newNodes.map(newNode => {
      const existingNode = nodes.find(n => n.id === newNode.id);
      if (existingNode) {
        // Keep the current position and any other state
        return {
          ...newNode,
          position: existingNode.position,
          data: {
            ...newNode.data,
            basePosition: existingNode.data.basePosition || newNode.data.basePosition
          }
        };
      }
      return newNode;
    });
    
    // Check if selected node still exists in new nodes
    if (selectedNode && !updatedNodes.find(node => node.id === selectedNode.id)) {
      console.log('🚪 useCanvasData: Selected node was deleted, closing sidebar');
      setSelectedNode(null);
      setSidebarOpen(false);
    }
    
    setNodes(updatedNodes);
    setEdges(newEdges);
  }, [refreshKey, setNodes, setEdges, selectedNode, isDeleting, setSelectedNode, setSidebarOpen, nodes]);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange
  };
};
