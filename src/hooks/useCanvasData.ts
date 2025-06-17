
import { useMemo, useEffect, useRef, useState } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import { generateSyncedCanvasStructure } from '@/services/capTableSync';
import { getUnifiedRepository } from '@/services/repositories/unified';
import { IUnifiedEntityRepository } from '@/services/repositories/unified/IUnifiedRepository';

const generateInitialState = () => {
  console.log('🔄 Generating initial canvas state');
  return generateSyncedCanvasStructure();
};

export const useCanvasData = (refreshKey: number, isDeleting: boolean, selectedNode: any, setSelectedNode: any, setSidebarOpen: any) => {
  // Store the latest positions in a ref to avoid dependency issues
  const positionsRef = useRef<{ [nodeId: string]: { x: number; y: number } }>({});
  const [repository, setRepository] = useState<IUnifiedEntityRepository | null>(null);

  // Initialize unified repository
  useEffect(() => {
    const initRepository = async () => {
      try {
        console.log('🔄 useCanvasData: Initializing unified repository...');
        const repo = await getUnifiedRepository('ENTERPRISE'); // Use enterprise by default
        setRepository(repo);
        console.log('✅ useCanvasData: Unified repository initialized');
      } catch (error) {
        console.error('❌ useCanvasData: Failed to initialize repository:', error);
        // Fallback to legacy if needed
        const fallbackRepo = await getUnifiedRepository('LEGACY');
        setRepository(fallbackRepo);
      }
    };

    initRepository();
  }, []);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    console.log('🔄 useCanvasData: Regenerating canvas structure due to refresh key:', refreshKey);
    const result = generateInitialState();
    console.log('📊 useCanvasData: Generated', result.nodes.length, 'nodes and', result.edges.length, 'edges');
    
    // Apply saved positions to initial nodes - filter out any undefined nodes
    const nodesWithPositions = result.nodes
      .filter(node => node && node.id) // Filter out undefined/invalid nodes
      .map(node => {
        const savedPosition = positionsRef.current[node.id];
        if (savedPosition) {
          return {
            ...node,
            position: savedPosition,
            data: {
              ...node.data,
              basePosition: node.data.basePosition || node.position
            }
          };
        }
        return node;
      });
    
    return { nodes: nodesWithPositions, edges: result.edges };
  }, [refreshKey]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Enhanced onNodesChange to track position changes
  const enhancedOnNodesChange = (changes: any) => {
    // Update position tracking for any position changes
    changes.forEach((change: any) => {
      if (change.type === 'position' && change.position && change.id) {
        positionsRef.current[change.id] = change.position;
      }
    });
    onNodesChange(changes);
  };

  // Subscribe to unified repository changes for auto-sync
  useEffect(() => {
    if (!repository) return;

    console.log('🔗 useCanvasData: Setting up unified repository subscription');
    const unsubscribe = repository.subscribe((event) => {
      // Skip refresh if we're in the middle of a deletion
      if (isDeleting) {
        console.log('⏳ Skipping refresh during deletion process');
        return;
      }
      
      console.log('📡 useCanvasData: Unified repository event received:', event.type, event.entityId);
      
      // Generate new canvas structure immediately
      const { nodes: newNodes, edges: newEdges } = generateInitialState();
      console.log('📊 useCanvasData: Setting new nodes count:', newNodes.length, 'new edges count:', newEdges.length);
      
      // Preserve existing node positions using the ref - filter out undefined nodes
      const updatedNodes = newNodes
        .filter(newNode => newNode && newNode.id) // Filter out undefined/invalid nodes
        .map(newNode => {
          const savedPosition = positionsRef.current[newNode.id];
          if (savedPosition) {
            return {
              ...newNode,
              position: savedPosition,
              data: {
                ...newNode.data,
                basePosition: newNode.data.basePosition || savedPosition
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
      
      // Update nodes and edges immediately
      setNodes(updatedNodes);
      setEdges(newEdges);
    });

    return unsubscribe;
  }, [repository, selectedNode, isDeleting, setSelectedNode, setSidebarOpen, setNodes, setEdges]);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange: enhancedOnNodesChange,
    onEdgesChange
  };
};
