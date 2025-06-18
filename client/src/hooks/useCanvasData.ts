
import { useMemo, useEffect, useRef, useState } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import { generateUnifiedCanvasStructure } from '@/services/unifiedCanvasSync';
import { getUnifiedRepository } from '@/services/repositories/unified';
import { IUnifiedEntityRepository } from '@/services/repositories/unified/IUnifiedRepository';

const generateInitialState = async () => {
  console.log('🔄 Generating initial unified canvas state');
  return await generateUnifiedCanvasStructure();
};

export const useCanvasData = (refreshKey: number, isDeleting: boolean, selectedNode: any, setSelectedNode: any, setSidebarOpen: any) => {
  const positionsRef = useRef<{ [nodeId: string]: { x: number; y: number } }>({});
  const [repository, setRepository] = useState<IUnifiedEntityRepository | null>(null);
  const [initialData, setInitialData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize unified repository
  useEffect(() => {
    const initRepository = async () => {
      try {
        console.log('🔄 useCanvasData: Initializing unified repository...');
        const repo = await getUnifiedRepository('ENTERPRISE');
        setRepository(repo);
        console.log('✅ useCanvasData: Unified repository initialized');
      } catch (error) {
        console.error('❌ useCanvasData: Failed to initialize repository:', error);
      }
    };

    initRepository();
  }, []);

  // Load initial data asynchronously
  useEffect(() => {
    const loadInitialData = async () => {
      if (!repository) return;
      
      setIsLoading(true);
      try {
        console.log('🔄 useCanvasData: Loading initial unified data, refresh key:', refreshKey);
        const result = await generateInitialState();
        console.log('📊 useCanvasData: Generated', result.nodes.length, 'nodes and', result.edges.length, 'edges');
        
        // Apply saved positions
        const nodesWithPositions = result.nodes
          .filter(node => node && node.id)
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
        
        setInitialData({ nodes: nodesWithPositions, edges: result.edges });
      } catch (error) {
        console.error('❌ Error loading initial unified data:', error);
        setInitialData({ nodes: [], edges: [] });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [refreshKey, repository]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);

  // Update nodes and edges when initial data changes
  useEffect(() => {
    if (!isLoading) {
      setNodes(initialData.nodes);
      setEdges(initialData.edges);
    }
  }, [initialData, isLoading, setNodes, setEdges]);

  // Enhanced onNodesChange to track and persist position changes
  const enhancedOnNodesChange = async (changes: any) => {
    const positionChanges = [];
    
    changes.forEach((change: any) => {
      if (change.type === 'position' && change.position && change.id && !change.dragging) {
        // Save position locally for immediate UI update
        positionsRef.current[change.id] = change.position;
        positionChanges.push({ entityId: change.id, position: change.position });
      }
    });
    
    // Update UI immediately
    onNodesChange(changes);
    
    // Persist position changes to database
    if (repository && positionChanges.length > 0) {
      positionChanges.forEach(async ({ entityId, position }) => {
        try {
          await repository.updateEntity(entityId, { position }, 'user', 'Updated entity position');
          console.log('✅ Position saved for entity:', entityId, position);
        } catch (error) {
          console.error('❌ Failed to save position for entity:', entityId, error);
        }
      });
    }
  };

  // Subscribe to unified repository changes for auto-sync
  useEffect(() => {
    if (!repository) return;

    console.log('🔗 useCanvasData: Setting up unified repository subscription');
    const unsubscribe = repository.subscribe(async (event) => {
      if (isDeleting) {
        console.log('⏳ Skipping refresh during deletion process');
        return;
      }
      
      console.log('📡 useCanvasData: Unified repository event received:', event.type, event.entityId);
      
      try {
        const result = await generateUnifiedCanvasStructure();
        console.log('📊 useCanvasData: Setting new nodes count:', result.nodes.length, 'new edges count:', result.edges.length);
        
        const updatedNodes = result.nodes
          .filter(newNode => newNode && newNode.id)
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
        
        // Check if selected node still exists
        if (selectedNode && !updatedNodes.find(node => node.id === selectedNode.id)) {
          console.log('🚪 useCanvasData: Selected node was deleted, closing sidebar');
          setSelectedNode(null);
          setSidebarOpen(false);
        }
        
        setNodes(updatedNodes);
        setEdges(result.edges);
      } catch (error) {
        console.error('❌ Error refreshing unified canvas data:', error);
      }
    });

    return unsubscribe;
  }, [repository, selectedNode, isDeleting, setSelectedNode, setSidebarOpen, setNodes, setEdges]);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange: enhancedOnNodesChange,
    onEdgesChange,
    isLoading
  };
};
