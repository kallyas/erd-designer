// src/components/ERDCanvas.tsx
import { useCallback, useState, forwardRef, useImperativeHandle, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  useReactFlow,
  Panel,
  NodeTypes,
  EdgeTypes,
  ConnectionLineType,
  ConnectionMode
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import TableNode from "./TableNode";
import GroupNode from "./GroupNode"; // New component for node grouping
import CustomEdge from "./CustomEdge"; // New component for styled edges
import { 
  TableData, 
  TableNode as TableNodeType, 
  RelationshipEdge, 
  RelationshipSuggestion, 
  DiagramState 
} from "@/types";
import { suggestRelationships } from "@/utils/sqlGenerator";
import { suggestAdvancedRelationships } from "@/utils/aiSuggestions";
import { 
  GitBranch, 
  Users, 
  Zap, 
  Database, 
  FileExport, 
  LayoutGrid,
  Share2,
  Maximize,
  Minimize,
  Trash2,
  Lock,
  Unlock,
  Copy,
  Layers,
  Flashlight,
  Workflow,
  GitFork
} from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { 
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  applyGridLayout, 
  applyCircularLayout, 
  applyTreeLayout, 
  applyForceDirectedLayout 
} from "@/utils/layoutAlgorithms";

// Define the node types
const nodeTypes: NodeTypes = {
  tableNode: TableNode,
  groupNode: GroupNode
};

// Define edge types
const edgeTypes: EdgeTypes = {
  default: CustomEdge
};

export interface ERDCanvasProps {
  onNodesChange: (nodes: TableNodeType[]) => void;
  onEdgesChange: (edges: RelationshipEdge[]) => void;
  initialDiagram?: DiagramState;
  readOnly?: boolean;
  relationshipStyle?: 'arrows' | 'crow' | 'uml' | 'lines';
  tableStyle?: 'default' | 'compact' | 'detailed' | 'minimal';
  colorScheme?: 'default' | 'monochrome' | 'colorful' | 'pastel';
}

const ERDCanvas = forwardRef(({ 
  onNodesChange, 
  onEdgesChange, 
  initialDiagram,
  readOnly = false,
  relationshipStyle = 'arrows',
  tableStyle = 'default',
  colorScheme = 'default'
}: ERDCanvasProps, ref) => {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState<TableNodeType>(
    initialDiagram?.nodes || []
  );
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState<RelationshipEdge>(
    initialDiagram?.edges || []
  );
  const [suggestions, setSuggestions] = useState<RelationshipSuggestion[]>([]);
  const [advancedSuggestions, setAdvancedSuggestions] = useState<RelationshipSuggestion[]>([]);
  const [showSuggestion, setShowSuggestion] = useState<{
    x: number, 
    y: number, 
    suggestion: RelationshipSuggestion
  } | null>(null);
  const [currentLayout, setCurrentLayout] = useState("default");
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [activeUsers, setActiveUsers] = useState<{id: string, name: string, color: string}[]>([
    { id: "u1", name: "You", color: "#4CAF50" }
  ]);
  const [lockedNodes, setLockedNodes] = useState<string[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [showMinimap, setShowMinimap] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(true);
  const [groupMode, setGroupMode] = useState(false);
  const [activeGroups, setActiveGroups] = useState<{id: string, name: string, nodes: string[]}[]>([]);
  
  const reactFlowInstance = useReactFlow();

  // Initialize from initial diagram if provided
  useEffect(() => {
    if (initialDiagram && initialDiagram.nodes.length > 0) {
      setNodes(initialDiagram.nodes);
      setEdges(initialDiagram.edges);
    }
  }, [initialDiagram, setNodes, setEdges]);

  // Generate relationship suggestions when nodes change
  useEffect(() => {
    if (nodes.length > 1) {
      const tableData = nodes.map(node => node.data);
      const newSuggestions = suggestRelationships(tableData);
      setSuggestions(newSuggestions);
      
      // Generate more advanced suggestions using AI
      if (showAISuggestions) {
        const advancedSuggestions = suggestAdvancedRelationships({
          nodes,
          edges
        });
        setAdvancedSuggestions(advancedSuggestions);
      }
    } else {
      setSuggestions([]);
      setAdvancedSuggestions([]);
    }
  }, [nodes, edges, showAISuggestions]);

  // Apply layout when it changes
  useEffect(() => {
    if (currentLayout !== "default" && nodes.length > 1) {
      applyLayout(currentLayout);
    }
  }, [currentLayout]);

  // Expose addNewTable to parent
  useImperativeHandle(ref, () => ({
    addNewTable: (position = { x: 100, y: 100 }) => addNewTable(position),
    getNodes: () => nodes,
    getEdges: () => edges,
    applyLayout: (layout: string) => applyLayout(layout),
    setTableStyle: (style: string) => console.log("Set table style:", style),
    setRelationshipStyle: (style: string) => console.log("Set relationship style:", style),
    setColorScheme: (scheme: string) => console.log("Set color scheme:", scheme),
    getDiagramState: () => ({ nodes, edges }),
    centerView: () => reactFlowInstance.fitView(),
    zoomIn: () => reactFlowInstance.zoomIn(),
    zoomOut: () => reactFlowInstance.zoomOut(),
    deleteSelected: () => deleteSelected()
  }));

  // Handle node changes
  const handleNodesChange = useCallback((changes: any) => {
    if (readOnly) return;
    
    onNodesChangeInternal(changes);
    // Filter out irrelevant changes to avoid unnecessary updates
    const relevantChanges = changes.filter((change: any) => 
      change.type === 'remove' || 
      (change.type === 'position' && !change.dragging)
    );
    
    if (relevantChanges.length > 0) {
      // Notify parent component about node changes
      setTimeout(() => {
        onNodesChange(reactFlowInstance.getNodes() as TableNodeType[]);
      }, 0);
    }
  }, [onNodesChangeInternal, onNodesChange, reactFlowInstance, readOnly]);

  // Handle edge changes
  const handleEdgesChange = useCallback((changes: any) => {
    if (readOnly) return;
    
    onEdgesChangeInternal(changes);
    // Notify parent component about edge changes
    setTimeout(() => {
      onEdgesChange(reactFlowInstance.getEdges() as RelationshipEdge[]);
    }, 0);
  }, [onEdgesChangeInternal, onEdgesChange, reactFlowInstance, readOnly]);

  // Apply layout algorithm
  const applyLayout = useCallback((layout: string) => {
    if (nodes.length <= 1) return;
    
    let updatedNodes;
    
    switch (layout) {
      case "grid":
        updatedNodes = applyGridLayout(nodes);
        break;
      case "circular":
        updatedNodes = applyCircularLayout(nodes);
        break;
      case "hierarchical":
        updatedNodes = applyTreeLayout(nodes, edges);
        break;
      case "force":
        updatedNodes = applyForceDirectedLayout(nodes, edges);
        break;
      default:
        return;
    }
    
    // Apply new positions
    setNodes(updatedNodes);
    setCurrentLayout(layout);
    
    // Notify parent about changes
    setTimeout(() => {
      onNodesChange(reactFlowInstance.getNodes() as TableNodeType[]);
    }, 0);
    
    toast.success(`Applied ${layout} layout`);
  }, [nodes, edges, setNodes, onNodesChange, reactFlowInstance]);

  // Handle connection between nodes
  const onConnect = useCallback((connection: Connection) => {
    if (readOnly) return;
    
    // Determine relationship type based on selected style
    let markerType = MarkerType.ArrowClosed;
    let relationshipType = 'one-to-many';
    
    if (relationshipStyle === 'crow') {
      markerType = MarkerType.Arrow;
      // In a real implementation, you'd have custom markers for crow's foot
    }
    
    const edge: RelationshipEdge = {
      id: `edge-${Date.now()}`,
      ...connection,
      animated: true,
      style: { 
        stroke: colorScheme === 'monochrome' ? '#525252' : 
                colorScheme === 'colorful' ? '#6366F1' : 
                colorScheme === 'pastel' ? '#8B5CF6' : '#525252'
      },
      markerEnd: {
        type: markerType,
        color: colorScheme === 'monochrome' ? '#525252' : 
               colorScheme === 'colorful' ? '#6366F1' : 
               colorScheme === 'pastel' ? '#8B5CF6' : '#525252',
      },
      type: relationshipStyle === 'lines' ? 'default' : 'custom',
      data: {
        relationshipType,
        sourceColumn: '',
        targetColumn: '',
      }
    };
    
    setEdges((eds) => addEdge(edge, eds));
    
    // Update foreign key in target table
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    
    if (sourceNode && targetNode) {
      const sourceData = sourceNode.data as TableData;
      const targetData = targetNode.data as TableData;
      
      // Find primary key in source table
      const sourcePrimaryKey = sourceData.columns.find(col => col.isPrimaryKey);
      
      if (sourcePrimaryKey) {
        // Create foreign key column in target table
        const fkName = `${sourceData.tableName.toLowerCase()}_id`;
        const fkExists = targetData.columns.some(col => col.name === fkName);
        
        if (!fkExists) {
          targetData.columns.push({
            id: `${targetNode.id}-col-${Date.now()}`,
            name: fkName,
            type: sourcePrimaryKey.type,
            length: sourcePrimaryKey.length,
            isPrimaryKey: false,
            isForeignKey: true,
            isNullable: true,
            referencesTable: sourceData.tableName,
            referencesColumn: sourcePrimaryKey.name,
          });
          
          // Update the connection data with column names
          setEdges(prevEdges => 
            prevEdges.map(e => 
              e.id === edge.id 
                ? { 
                    ...e, 
                    data: { 
                      ...e.data, 
                      sourceColumn: sourcePrimaryKey.name, 
                      targetColumn: fkName 
                    } 
                  }
                : e
            )
          );
          
          // Force update
          setNodes([...nodes]);
        }
      }
    }

    // Notify parent components
    setTimeout(() => {
      onNodesChange(reactFlowInstance.getNodes() as TableNodeType[]);
      onEdgesChange(reactFlowInstance.getEdges() as RelationshipEdge[]);
    }, 0);
  }, [setEdges, nodes, setNodes, onNodesChange, onEdgesChange, reactFlowInstance, readOnly, relationshipStyle, colorScheme]);

  // Add a new table to the canvas
  const addNewTable = useCallback((position = { x: 100, y: 100 }) => {
    if (readOnly) return;
    
    const id = `table-${Date.now()}`;
    const newNode: TableNodeType = {
      id,
      type: 'tableNode',
      position,
      data: {
        id,
        tableName: `Table_${nodes.length + 1}`,
        style: tableStyle,
        colorScheme,
        columns: [
          {
            id: `${id}-col-1`,
            name: 'id',
            type: 'INT',
            isPrimaryKey: true,
            isForeignKey: false,
            isNullable: false,
          }
        ],
      },
    };
    
    setNodes(nds => [...nds, newNode]);
    
    // Notify parent component
    setTimeout(() => {
      onNodesChange([...nodes, newNode]);
    }, 0);
  }, [setNodes, nodes, onNodesChange, readOnly, tableStyle, colorScheme]);

  // Handle nodes selection
  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    setSelectedNodes(selectedNodes.map(node => node.id));
  }, []);

  // Delete selected nodes
  const deleteSelected = useCallback(() => {
    if (readOnly || selectedNodes.length === 0) return;
    
    const lockedSelected = selectedNodes.filter(id => lockedNodes.includes(id));
    if (lockedSelected.length > 0) {
      toast.error("Cannot delete locked nodes. Unlock them first.");
      return;
    }
    
    // Delete nodes
    setNodes(nodes => nodes.filter(node => !selectedNodes.includes(node.id)));
    
    // Delete related edges
    setEdges(edges => edges.filter(edge => 
      !selectedNodes.includes(edge.source) && !selectedNodes.includes(edge.target)
    ));
    
    // Notify parent
    setTimeout(() => {
      onNodesChange(reactFlowInstance.getNodes() as TableNodeType[]);
      onEdgesChange(reactFlowInstance.getEdges() as RelationshipEdge[]);
    }, 0);
    
    setSelectedNodes([]);
    toast.success("Selected items deleted");
  }, [selectedNodes, lockedNodes, setNodes, setEdges, onNodesChange, onEdgesChange, reactFlowInstance, readOnly]);

  // Handle node mouse hover for suggestions
  const handleNodeMouseEnter = useCallback((event: React.MouseEvent, node: Node) => {
    if (!showAISuggestions) return;
    
    // Combine basic and advanced suggestions
    const allSuggestions = [...suggestions, ...advancedSuggestions];
    
    const relevantSuggestions = allSuggestions.filter(
      s => s.sourceTable === node.data.tableName || s.targetTable === node.data.tableName
    );
    
    if (relevantSuggestions.length > 0) {
      // Get the best suggestion
      const bestSuggestion = relevantSuggestions.sort((a, b) => b.confidence - a.confidence)[0];
      setShowSuggestion({
        x: event.clientX,
        y: event.clientY - 100,
        suggestion: bestSuggestion
      });
    }
  }, [suggestions, advancedSuggestions, showAISuggestions]);

  const handleNodeMouseLeave = useCallback(() => {
    setShowSuggestion(null);
  }, []);

  const toggleSnapToGrid = () => {
    setSnapToGrid(!snapToGrid);
    toast.success(snapToGrid ? "Snap to grid disabled" : "Snap to grid enabled");
  };

  // Apply a suggested relationship
  const applySuggestion = useCallback(() => {
    if (!showSuggestion || readOnly) return;
    
    const { suggestion } = showSuggestion;
    const sourceNode = nodes.find(n => n.data.tableName === suggestion.sourceTable);
    const targetNode = nodes.find(n => n.data.tableName === suggestion.targetTable);
    
    if (sourceNode && targetNode) {
      // Create a connection
      const connection: Connection = {
        source: sourceNode.id,
        target: targetNode.id,
        sourceHandle: `${sourceNode.id}-source`,
        targetHandle: `${targetNode.id}-target`,
      };
      
      onConnect(connection);
      setShowSuggestion(null);
      toast.success("Applied suggested relationship");
    }
  }, [showSuggestion, nodes, onConnect, readOnly]);

  // Toggle node lock
  const toggleNodeLock = useCallback((nodeId: string) => {
    setLockedNodes(prev => {
      if (prev.includes(nodeId)) {
        return prev.filter(id => id !== nodeId);
      } else {
        return [...prev, nodeId];
      }
    });
  }, []);

  // Create a group from selected nodes
  const createGroup = useCallback(() => {
    if (selectedNodes.length < 2) {
      toast.error("Select at least 2 nodes to create a group");
      return;
    }
    
    const groupName = `Group ${activeGroups.length + 1}`;
    const newGroup = {
      id: `group-${Date.now()}`,
      name: groupName,
      nodes: [...selectedNodes]
    };
    
    setActiveGroups(prev => [...prev, newGroup]);
    
    // In a real implementation, you might create a visual group node
    // that contains these nodes
    
    toast.success(`Created group "${groupName}" with ${selectedNodes.length} tables`);
  }, [selectedNodes, activeGroups]);

  // Get connection line style based on relationship style
  const connectionLineStyle = useMemo(() => {
    return {
      stroke: colorScheme === 'monochrome' ? '#525252' : 
              colorScheme === 'colorful' ? '#6366F1' : 
              colorScheme === 'pastel' ? '#8B5CF6' : '#525252',
      strokeWidth: 1.5,
      strokeDasharray: relationshipStyle === 'uml' ? '5,5' : undefined
    };
  }, [relationshipStyle, colorScheme]);

  return (
    <div className="h-full w-full">
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
        maxZoom={2}
        defaultEdgeOptions={{
          style: { stroke: '#525252' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#525252',
          },
        }}
        connectionLineStyle={connectionLineStyle}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionMode={ConnectionMode.Loose}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        selectNodesOnDrag={true}
        zoomOnDoubleClick={!readOnly}
        panOnDrag={!readOnly || !groupMode}
        proOptions={{ hideAttribution: true }}
        nodesFocusable={!readOnly}
        edgesFocusable={!readOnly}
      >
        <Background color="#a3a3a3" gap={16} />
        <Controls showInteractive={true} />
        
        {/* Quick Action Panel */}
        <Panel position="top-right" className="flex gap-2 bg-white p-2 rounded-md shadow-sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={toggleSnapToGrid}
                  className={`text-xs ${snapToGrid ? 'bg-gray-100' : ''}`}
                >
                  {snapToGrid ? "Grid: On" : "Grid: Off"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle snap to grid</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowMinimap(!showMinimap)}
                  className={`text-xs ${showMinimap ? 'bg-gray-100' : ''}`}
                >
                  {showMinimap ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle minimap</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Tabs defaultValue="layout" className="w-56">
            <TabsList className="h-7 grid grid-cols-2">
              <TabsTrigger value="layout" className="text-xs h-6">Layout</TabsTrigger>
              <TabsTrigger value="group" className="text-xs h-6">Groups</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {selectedNodes.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={deleteSelected}
              className="text-xs text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          )}
        </Panel>
        
        {/* Layout Controls */}
        <Panel position="top-center" className="flex gap-2 bg-white p-2 rounded-md shadow-sm mt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => applyLayout("grid")}
            className="text-xs"
            title="Arrange tables in a grid layout"
          >
            <LayoutGrid className="h-3.5 w-3.5 mr-1" />
            Grid
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => applyLayout("circular")}
            className="text-xs"
            title="Arrange tables in a circle"
          >
            <Layers className="h-3.5 w-3.5 mr-1" />
            Circle
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => applyLayout("hierarchical")}
            className="text-xs"
            title="Arrange tables hierarchically"
          >
            <GitFork className="h-3.5 w-3.5 mr-1" />
            Hierarchy
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => applyLayout("force")}
            className="text-xs"
            title="Apply force-directed layout"
          >
            <Workflow className="h-3.5 w-3.5 mr-1" />
            Auto
          </Button>
        </Panel>
        
        {/* AI Suggestions Toggle */}
        <Panel position="bottom-center" className="flex gap-2 bg-white p-2 rounded-md shadow-sm mb-2">
          <div className="flex items-center space-x-2">
            <Switch 
              checked={showAISuggestions} 
              onCheckedChange={setShowAISuggestions} 
              id="ai-mode"
            />
            <label htmlFor="ai-mode" className="text-xs flex items-center cursor-pointer">
              <Zap className="h-3.5 w-3.5 mr-1 text-yellow-500" />
              AI Suggestions
            </label>
          </div>
        </Panel>
        
        {/* Collaboration Panel */}
        <Panel position="bottom-left" className="flex gap-2 bg-white p-2 rounded-md shadow-sm">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4 text-gray-600" />
            <div className="flex -space-x-2">
              {activeUsers.map(user => (
                <div 
                  key={user.id}
                  className="h-6 w-6 rounded-full text-xs flex items-center justify-center text-white"
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                >
                  {user.name.charAt(0)}
                </div>
              ))}
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-xs"
            onClick={() => toast.success("Copied share link to clipboard")}
          >
            <Share2 className="h-3.5 w-3.5 mr-1" />
            Share
          </Button>
        </Panel>
        
        {/* Version Control Panel */}
        <Panel position="bottom-right" className="flex gap-2 bg-white p-2 rounded-md shadow-sm">
          <Badge variant="outline" className="bg-white">
            {nodes.length} Tables
          </Badge>
          
          <Badge variant="outline" className="bg-white">
            {edges.length} Relationships
          </Badge>
          
          {lockedNodes.length > 0 && (
            <Badge variant="outline" className="bg-white">
              <Lock className="h-3 w-3 mr-1" />
              {lockedNodes.length} Locked
            </Badge>
          )}
        </Panel>
        
        {/* Minimap */}
        {showMinimap && (
          <div className="absolute right-4 bottom-16 w-48 h-36 bg-white/80 border rounded shadow-md overflow-hidden">
            {/* Here you would implement a minimap of your diagram */}
            <div className="p-2 text-xs text-center text-gray-500">
              Diagram Overview
            </div>
          </div>
        )}
      </ReactFlow>
      
      {/* Relationship Suggestion Popup */}
      {showSuggestion && showAISuggestions && (
        <Card 
          className="relationship-suggestion"
          style={{
            position: 'absolute',
            left: showSuggestion.x + 10,
            top: showSuggestion.y - 10,
            zIndex: 1000,
            maxWidth: '300px'
          }}
        >
          <CardContent className="p-3 space-y-2">
            <div className="font-semibold flex items-center">
              <Flashlight className="h-4 w-4 mr-1 text-yellow-500" />
              Suggested Relationship
            </div>
            <p className="text-xs">
              <span className="font-medium">{showSuggestion.suggestion.sourceTable}</span>
              {" → "}
              <span className="font-medium">{showSuggestion.suggestion.targetTable}</span>
            </p>
            <p className="text-xs">
              <Badge variant="outline" className="mr-1">
                {showSuggestion.suggestion.relationshipType}
              </Badge>
              <Badge variant="outline">
                {Math.round(showSuggestion.suggestion.confidence * 100)}% confidence
              </Badge>
            </p>
            <p className="text-xs italic mt-1">{showSuggestion.suggestion.reason}</p>
          </CardContent>
          <CardFooter className="pt-0 pb-3 px-3">
            <Button 
              size="sm" 
              variant="outline"
              className="text-xs"
              onClick={applySuggestion}
            >
              Apply Suggestion
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
});

ERDCanvas.displayName = "ERDCanvas";

export default ERDCanvas;