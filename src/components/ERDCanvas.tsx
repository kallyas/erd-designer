
// src/components/ERDCanvas.tsx
import {
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useMemo,
} from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  MarkerType,
  useReactFlow,
  Panel,
  NodeTypes,
  EdgeTypes,
  ConnectionLineType,
  ConnectionMode,
  MiniMap,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import TableNode from "./TableNode";
import GroupNode from "./GroupNode";
import { GroupNodeData } from "./GroupNode";
import CustomEdge from "./CustomEdge";
import {
  TableData,
  TableNode as TableNodeType,
  RelationshipEdge,
  RelationshipSuggestion,
  DiagramState,
} from "@/types";
import { suggestRelationships } from "@/utils/sqlGenerator";
import { suggestAdvancedRelationships } from "@/utils/aiSuggestions";
import {
  Users,
  Zap,
  LayoutGrid,
  Share2,
  Maximize,
  Minimize,
  Trash2,
  Lock,
  Layers,
  Flashlight,
  Workflow,
  GitFork,
  PlusCircle,
  BoxSelect,
} from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  applyGridLayout,
  applyCircularLayout,
  applyTreeLayout,
  applyForceDirectedLayout,
} from "@/utils/layoutAlgorithms";

const nodeTypes: NodeTypes = {
  tableNode: TableNode,
  groupNode: GroupNode,
};

const edgeTypes: EdgeTypes = {
  default: CustomEdge,
};

export interface ERDCanvasProps {
  onNodesChange: (nodes: TableNodeType[]) => void;
  onEdgesChange: (edges: RelationshipEdge[]) => void;
  initialDiagram?: DiagramState;
  readOnly?: boolean;
  relationshipStyle?: "arrows" | "crow" | "uml" | "lines";
  tableStyle?: "default" | "compact" | "detailed" | "minimal";
  colorScheme?: "default" | "monochrome" | "colorful" | "pastel";
}

const ERDCanvas = forwardRef(
  (
    {
      onNodesChange: onNodesChangeProp,
      onEdgesChange: onEdgesChangeProp,
      initialDiagram,
      readOnly = false,
      relationshipStyle = "arrows",
      tableStyle = "default",
      colorScheme = "default",
    }: ERDCanvasProps,
    ref
  ) => {
    const [nodes, setNodes, onNodesChangeInternal] = useNodesState<TableNodeType>([]);
    const [edges, setEdges, onEdgesChangeInternal] = useEdgesState<RelationshipEdge>([]);
    
    const [suggestions, setSuggestions] = useState<RelationshipSuggestion[]>([]);
    const [advancedSuggestions, setAdvancedSuggestions] = useState<RelationshipSuggestion[]>([]);
    const [showSuggestion, setShowSuggestion] = useState<{
      x: number;
      y: number;
      suggestion: RelationshipSuggestion;
    } | null>(null);
    const [currentLayout, setCurrentLayout] = useState("default");
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [activeUsers, setActiveUsers] = useState<{ id: string; name: string; color: string }[]>([
      { id: "u1", name: "You", color: "#4CAF50" },
    ]);
    const [lockedNodes, setLockedNodes] = useState<string[]>([]);
    const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
    const [showMinimap, setShowMinimap] = useState(false);
    const [showAISuggestions, setShowAISuggestions] = useState(true);
    const [activeGroups, setActiveGroups] = useState<{ id: string; name: string; nodes: string[] }[]>([]);

    const reactFlowInstance = useReactFlow();

    // Initialize from initial diagram
    useEffect(() => {
      if (initialDiagram) {
        setNodes(initialDiagram.nodes || []);
        setEdges(initialDiagram.edges || []);
      }
    }, [initialDiagram, setNodes, setEdges]);

    // Propagate nodes/edges changes to parent component
    useEffect(() => {
      onNodesChangeProp(nodes);
    }, [nodes, onNodesChangeProp]);

    useEffect(() => {
      onEdgesChangeProp(edges);
    }, [edges, onEdgesChangeProp]);

    // Generate relationship suggestions
    useEffect(() => {
      if (nodes.length > 1 && !readOnly) {
        const tableData = nodes.map(node => node.data);
        // Cast needed to fix type errors while maintaining the core functionality
        const newSuggestions = suggestRelationships(tableData as TableData[]);
        setSuggestions(newSuggestions);

        if (showAISuggestions) {
          const advSuggestions = suggestAdvancedRelationships({ 
            nodes: nodes as unknown as Node[], 
            edges: edges as unknown as Edge[] 
          });
          setAdvancedSuggestions(advSuggestions);
        } else {
          setAdvancedSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setAdvancedSuggestions([]);
      }
    }, [nodes, edges, showAISuggestions, readOnly]);


    // Expose API to parent
    useImperativeHandle(ref, () => ({
      addNewTable: (position = { x: Math.random() * 400, y: Math.random() * 400 }) => addNewTable(position),
      getNodes: () => nodes,
      getEdges: () => edges,
      applyLayout: (layout: string) => applyLayout(layout),
      setTableStyle: (style: string) => {
        console.log("Set table style (visual update not fully implemented):", style);
      },
      setRelationshipStyle: (style: string) => {
        console.log("Set relationship style (visual update not fully implemented):", style);
      },
      setColorScheme: (scheme: string) => {
        console.log("Set color scheme (visual update not fully implemented):", scheme);
      },
      getDiagramState: (): DiagramState => ({ nodes, edges }),
      centerView: () => reactFlowInstance.fitView(),
      zoomIn: () => reactFlowInstance.zoomIn(),
      zoomOut: () => reactFlowInstance.zoomOut(),
      deleteSelected: () => deleteSelectedNodes(),
    }));

    const handleNodesChange = useCallback(
      (changes: NodeChange[]) => {
        if (readOnly) return;
        // Type assertion to match the library's expected type
        onNodesChangeInternal(changes as NodeChange<TableNodeType>[]);
      },
      [onNodesChangeInternal, readOnly]
    );

    const handleEdgesChange = useCallback(
      (changes: EdgeChange[]) => {
        if (readOnly) return;
        // Type assertion to match the library's expected type
        onEdgesChangeInternal(changes as EdgeChange<RelationshipEdge>[]);
      },
      [onEdgesChangeInternal, readOnly]
    );

    const applyLayout = useCallback(
      (layout: string) => {
        if (readOnly || nodes.length <= 1) {
          if (nodes.length <= 1) toast.info("Need more than one table to apply a layout.");
          return;
        }
        
        let updatedNodes;
        const currentNodes = reactFlowInstance.getNodes();
        const currentEdges = reactFlowInstance.getEdges();

        switch (layout) {
          case "grid": 
            updatedNodes = applyGridLayout(currentNodes as Node[]); 
            break;
          case "circular": 
            updatedNodes = applyCircularLayout(currentNodes as Node[]); 
            break;
          case "hierarchical": 
            updatedNodes = applyTreeLayout(currentNodes as Node[], currentEdges as Edge[]); 
            break;
          case "force": 
            updatedNodes = applyForceDirectedLayout(currentNodes as Node[], currentEdges as Edge[]); 
            break;
          default: 
            return;
        }
        
        // Type assertion to maintain compatibility
        setNodes(updatedNodes as unknown as TableNodeType[]);
        setCurrentLayout(layout);
        reactFlowInstance.fitView({duration: 300});
        toast.success(`Applied ${layout} layout`);
      },
      [nodes.length, readOnly, setNodes, reactFlowInstance]
    );

    const onConnect = useCallback(
      (connection: Connection) => {
        if (readOnly) return;

        let markerType = MarkerType.ArrowClosed;
        if (relationshipStyle === 'crow') markerType = MarkerType.Arrow;

        const newEdge: RelationshipEdge = {
          id: `edge-${Date.now()}-${connection.source}-${connection.target}`,
          ...connection,
          animated: true,
          style: {
            stroke: colorScheme === 'monochrome' ? '#525252' :
                    colorScheme === 'colorful' ? '#6366F1' :
                    colorScheme === 'pastel' ? '#8B5CF6' : '#525252',
            strokeWidth: 1.5,
          },
          markerEnd: {
            type: markerType,
            color: colorScheme === 'monochrome' ? '#525252' :
                   colorScheme === 'colorful' ? '#6366F1' :
                   colorScheme === 'pastel' ? '#8B5CF6' : '#525252',
          },
          type: relationshipStyle === 'lines' ? 'default' : 'custom',
          data: {
            relationshipType: 'one-to-many', 
            sourceColumn: '',
            targetColumn: '',
          },
        };
        setEdges((eds) => addEdge(newEdge, eds));

        // Update foreign key in target table
        const sourceNode = nodes.find(n => n.id === connection.source);
        const targetNode = nodes.find(n => n.id === connection.target);

        if (sourceNode && targetNode) {
          const sourceTableData = sourceNode.data as TableData;
          const targetTableData = { ...targetNode.data } as TableData;
          targetTableData.columns = [...targetTableData.columns]; 

          const sourcePrimaryKey = sourceTableData.columns.find(col => col.isPrimaryKey);
          if (sourcePrimaryKey) {
            const fkName = `${sourceTableData.tableName.toLowerCase()}_${sourcePrimaryKey.name}`;
            const fkExists = targetTableData.columns.some(col => col.name === fkName);

            if (!fkExists) {
              targetTableData.columns.push({
                id: `${targetNode.id}-col-${Date.now()}`,
                name: fkName,
                type: sourcePrimaryKey.type,
                length: sourcePrimaryKey.length,
                isPrimaryKey: false,
                isForeignKey: true,
                isNullable: true,
                referencesTable: sourceTableData.tableName,
                referencesColumn: sourcePrimaryKey.name,
              });

              setNodes(nds =>
                nds.map(n =>
                  n.id === targetNode.id ? { ...n, data: targetTableData } : n
                )
              );
              
              // Update edge data with actual column names
              setEdges(eds => eds.map(e => e.id === newEdge.id ? { ...e, data: {...e.data, sourceColumn: sourcePrimaryKey.name, targetColumn: fkName }} : e));
            } else {
              toast.info(`Foreign key ${fkName} already exists in ${targetTableData.tableName}.`);
            }
          }
        }
      },
      [readOnly, relationshipStyle, colorScheme, setEdges, nodes, setNodes]
    );

    const addNewTable = useCallback(
      (position = { x: 100, y: 100 }) => {
        if (readOnly) return;
        const id = `table-${Date.now()}`;
        const newNode: TableNodeType = {
          id,
          type: "tableNode",
          position,
          data: {
            id,
            tableName: `NewTable_${Math.floor(Math.random() * 1000)}`,
            style: tableStyle,
            colorScheme,
            columns: [
              {
                id: `${id}-col-pk`, name: "id", type: "INT",
                isPrimaryKey: true, isForeignKey: false, isNullable: false,
              },
            ],
          },
        };
        setNodes(nds => [...nds, newNode]);
        toast.success(`Table ${newNode.data.tableName} added.`);
      },
      [readOnly, tableStyle, colorScheme, setNodes]
    );

    const onSelectionChange = useCallback(({ nodes: selectedNodesList }: { nodes: Node[], edges: Edge[] }) => {
      setSelectedNodeIds(selectedNodesList.map(node => node.id));
    }, []);

    const deleteSelectedNodes = useCallback(() => {
      if (readOnly || selectedNodeIds.length === 0) return;

      const lockedSelected = selectedNodeIds.filter(id => lockedNodes.includes(id));
      if (lockedSelected.length > 0) {
        toast.error(`Cannot delete ${lockedSelected.length} locked node(s). Unlock them first.`);
        return;
      }

      setNodes(nds => nds.filter(node => !selectedNodeIds.includes(node.id)));
      setEdges(eds => eds.filter(edge => !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)));
      
      toast.success(`${selectedNodeIds.length} item(s) deleted.`);
      setSelectedNodeIds([]);
    }, [readOnly, selectedNodeIds, lockedNodes, setNodes, setEdges]);

    // Toggle node lock
    const toggleNodeLock = useCallback((nodeId: string) => {
      if (readOnly) return;
      setLockedNodes(prev => {
        const isLocked = prev.includes(nodeId);
        if (isLocked) {
          toast.info(`Node ${nodeId} unlocked.`);
          return prev.filter(id => id !== nodeId);
        } else {
          toast.info(`Node ${nodeId} locked.`);
          return [...prev, nodeId];
        }
      });
    }, [readOnly]);


    const handleNodeMouseEnter = useCallback(
      (event: React.MouseEvent, node: Node) => {
        if (!showAISuggestions || readOnly) return;
        const allSuggestions = [...suggestions, ...advancedSuggestions];
        const relevantSuggestions = allSuggestions.filter(
          s => s.sourceTable === (node.data as any).tableName || s.targetTable === (node.data as any).tableName
        );
        if (relevantSuggestions.length > 0) {
          const bestSuggestion = relevantSuggestions.sort((a, b) => b.confidence - a.confidence)[0];
          setShowSuggestion({ x: event.clientX, y: event.clientY, suggestion: bestSuggestion });
        }
      },
      [suggestions, advancedSuggestions, showAISuggestions, readOnly]
    );

    const handleNodeMouseLeave = useCallback(() => {
      setShowSuggestion(null);
    }, []);

    const applySuggestion = useCallback(() => {
      if (!showSuggestion || readOnly) return;
      const { suggestion } = showSuggestion;
      const sourceNode = nodes.find(n => n.data.tableName === suggestion.sourceTable);
      const targetNode = nodes.find(n => n.data.tableName === suggestion.targetTable);

      if (sourceNode && targetNode) {
        onConnect({
          source: sourceNode.id, target: targetNode.id,
          sourceHandle: null, targetHandle: null,
        });
        setShowSuggestion(null);
        toast.success("Applied suggested relationship!");
      } else {
        toast.error("Could not apply suggestion: nodes not found.");
      }
    }, [showSuggestion, nodes, onConnect, readOnly]);

    const createGroup = useCallback(() => {
      if (readOnly || selectedNodeIds.length < 2) {
        toast.warning("Select at least 2 tables to create a group.");
        return;
      }
      const groupName = `Group ${activeGroups.length + 1}`;
      const newGroup = { id: `group-${Date.now()}`, name: groupName, nodes: [...selectedNodeIds] };
      setActiveGroups(prev => [...prev, newGroup]);
      toast.success(`Created group "${groupName}" with ${selectedNodeIds.length} tables. (Visual grouping WIP)`);
    }, [readOnly, selectedNodeIds, activeGroups]);


    const connectionLineStyle = useMemo(() => ({
      stroke: colorScheme === 'monochrome' ? '#525252' :
              colorScheme === 'colorful' ? '#6366F1' :
              colorScheme === 'pastel' ? '#8B5CF6' : '#525252',
      strokeWidth: 1.5,
      strokeDasharray: relationshipStyle === 'uml' ? '5,5' : undefined,
    }), [relationshipStyle, colorScheme]);

    return (
      <div className="h-full w-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeMouseEnter={handleNodeMouseEnter}
          onNodeMouseLeave={handleNodeMouseLeave}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          snapToGrid={snapToGrid}
          snapGrid={[15, 15]}
          minZoom={0.1}
          maxZoom={2.5}
          defaultEdgeOptions={{
            style: { stroke: '#71717a', strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#71717a' },
          }}
          connectionLineStyle={connectionLineStyle}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionMode={ConnectionMode.Loose}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={!readOnly}
          selectNodesOnDrag={true}
          zoomOnDoubleClick={!readOnly}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#a3a3a3" gap={16} variant={"dots" as BackgroundVariant} />
          <Controls showInteractive={!readOnly} />
          {showMinimap && (
            <MiniMap 
              nodeStrokeWidth={3} 
              nodeColor={(n) => {
                return (n.style?.background as string) || '#efefef';
              }}
              pannable 
              zoomable
              className="bg-white/70 backdrop-blur-sm"
            />
          )}

          {/* Panel: Top-Left - Core Actions */}
          <Panel position="top-left" className="flex gap-2 p-2 bg-background/80 backdrop-blur-sm rounded-md shadow-lg">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => addNewTable()} disabled={readOnly}>
                    <PlusCircle className="h-4 w-4 mr-1.5" /> Add Table
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Create a new table</TooltipContent>
              </Tooltip>
              {selectedNodeIds.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="destructive" size="sm" onClick={deleteSelectedNodes} disabled={readOnly}>
                      <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete selected items</TooltipContent>
                </Tooltip>
              )}
              {selectedNodeIds.length > 1 && (
                 <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={createGroup} disabled={readOnly}>
                      <BoxSelect className="h-4 w-4 mr-1.5" /> Create Group
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Group selected tables</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </Panel>

          {/* Panel: Top-Right - Canvas/View Options */}
          <Panel position="top-right" className="flex items-center gap-3 p-2 bg-background/80 backdrop-blur-sm rounded-md shadow-lg">
            <TooltipProvider>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ai-suggestions-switch"
                  checked={showAISuggestions}
                  onCheckedChange={setShowAISuggestions}
                  disabled={readOnly}
                />
                <label htmlFor="ai-suggestions-switch" className="text-xs flex items-center cursor-pointer select-none">
                  <Zap className="h-4 w-4 mr-1 text-yellow-500" /> AI Hints
                </label>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setSnapToGrid(s => !s)} className="h-8 w-8">
                    <LayoutGrid className={`h-4 w-4 ${snapToGrid ? 'text-primary' : 'text-muted-foreground'}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Snap to Grid ({snapToGrid ? "On" : "Off"})</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button variant="ghost" size="icon" onClick={() => setShowMinimap(s => !s)} className="h-8 w-8">
                    {showMinimap ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Minimap</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Panel>
          
          {/* Panel: Bottom-Left - Layout Algorithms */}
          <Panel position="bottom-left" className="flex gap-1.5 p-1.5 bg-background/80 backdrop-blur-sm rounded-md shadow-lg">
            <TooltipProvider>
              {[
                { name: "Grid", icon: LayoutGrid, layout: "grid" },
                { name: "Circle", icon: Layers, layout: "circular" },
                { name: "Hierarchy", icon: GitFork, layout: "hierarchical" },
                { name: "Auto", icon: Workflow, layout: "force" },
              ].map(item => (
                <Tooltip key={item.layout}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={currentLayout === item.layout ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => applyLayout(item.layout)}
                      disabled={readOnly || nodes.length <=1}
                      className="h-8 w-8"
                    >
                      <item.icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Apply {item.name} Layout</TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </Panel>

          {/* Panel: Bottom-Right - Info & Collaboration */}
          <Panel position="bottom-right" className="flex flex-col items-end gap-2 p-2 bg-background/80 backdrop-blur-sm rounded-md shadow-lg">
            <div className="flex gap-2">
              <Badge variant="outline">Tables: {nodes.length}</Badge>
              <Badge variant="outline">Links: {edges.length}</Badge>
              {lockedNodes.length > 0 && <Badge variant="outline" className="text-amber-600 border-amber-500"><Lock className="h-3 w-3 mr-1" />{lockedNodes.length}</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="flex -space-x-2">
                  {activeUsers.map(user => (
                    <TooltipProvider key={user.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="h-6 w-6 rounded-full text-xs flex items-center justify-center text-white border-2 border-background"
                            style={{ backgroundColor: user.color }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{user.name}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Share link copied to clipboard!");
                }}
              >
                <Share2 className="h-3.5 w-3.5 mr-1" /> Share
              </Button>
            </div>
          </Panel>
        </ReactFlow>

        {/* Relationship Suggestion Popup */}
        {showSuggestion && showAISuggestions && !readOnly && (
          <Card
            className="fixed shadow-xl border bg-background"
            style={{
              left: Math.min(showSuggestion.x + 15, window.innerWidth - 320),
              top: Math.min(showSuggestion.y + 15, window.innerHeight - 200),
              zIndex: 1001,
              width: '300px',
            }}
          >
            <CardContent className="p-3 space-y-1.5">
              <div className="text-sm font-semibold flex items-center">
                <Flashlight className="h-4 w-4 mr-2 text-yellow-500" />
                Relationship Hint
              </div>
              <p className="text-xs">
                Suggesting: <span className="font-medium">{showSuggestion.suggestion.sourceTable}</span>
                <span className="mx-1">→</span>
                <span className="font-medium">{showSuggestion.suggestion.targetTable}</span>
              </p>
              <div className="text-xs space-x-1">
                <Badge variant="secondary">{showSuggestion.suggestion.relationshipType}</Badge>
                <Badge variant="outline">
                  {Math.round(showSuggestion.suggestion.confidence * 100)}% match
                </Badge>
              </div>
              {showSuggestion.suggestion.reason && (
                <p className="text-xs text-muted-foreground italic mt-1">{showSuggestion.suggestion.reason}</p>
              )}
            </CardContent>
            <CardFooter className="pt-2 pb-3 px-3">
              <Button size="sm" className="w-full" onClick={applySuggestion} disabled={readOnly}>
                Apply Suggestion
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    );
  }
);

ERDCanvas.displayName = "ERDCanvas";

export default ERDCanvas;
