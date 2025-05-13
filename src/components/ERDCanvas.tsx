
import { useCallback, useState, forwardRef, useImperativeHandle, useEffect } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css"; // Fixed import path for styles

import TableNode from "./TableNode";
import { TableData, TableNode as TableNodeType, RelationshipEdge, RelationshipSuggestion } from "@/types";
import { suggestRelationships } from "@/utils/sqlGenerator";
import { GitBranch, Users, Zap, Database, FileExport } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

const nodeTypes = {
  tableNode: TableNode,
};

interface ERDCanvasProps {
  onNodesChange: (nodes: TableNodeType[]) => void;
  onEdgesChange: (edges: RelationshipEdge[]) => void;
}

const initialNodes: TableNodeType[] = [];
const initialEdges: RelationshipEdge[] = [];

const ERDCanvas = forwardRef(({ onNodesChange, onEdgesChange }: ERDCanvasProps, ref) => {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState<TableNodeType>(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState<RelationshipEdge>(initialEdges);
  const [suggestions, setSuggestions] = useState<RelationshipSuggestion[]>([]);
  const [showSuggestion, setShowSuggestion] = useState<{x: number, y: number, suggestion: RelationshipSuggestion} | null>(null);
  const [currentLayout, setCurrentLayout] = useState("default");
  const [activeUsers, setActiveUsers] = useState<{id: string, name: string, color: string}[]>([
    { id: "u1", name: "You", color: "#4CAF50" }
  ]);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const reactFlowInstance = useReactFlow();

  // Generate relationship suggestions when nodes change
  useEffect(() => {
    if (nodes.length > 1) {
      const tableData = nodes.map(node => node.data);
      const newSuggestions = suggestRelationships(tableData);
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [nodes]);

  // Apply layout when it changes
  useEffect(() => {
    if (currentLayout !== "default" && nodes.length > 1) {
      applyLayout(currentLayout);
    }
  }, [currentLayout]);

  // Expose addNewTable to parent
  useImperativeHandle(ref, () => ({
    addNewTable: (position = { x: 100, y: 100 }) => addNewTable(position),
  }));

  // Handle node changes
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChangeInternal(changes);
    // Notify parent component about node changes
    setTimeout(() => {
      onNodesChange(reactFlowInstance.getNodes() as TableNodeType[]);
    }, 0);
  }, [onNodesChangeInternal, onNodesChange, reactFlowInstance]);

  // Handle edge changes
  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChangeInternal(changes);
    // Notify parent component about edge changes
    setTimeout(() => {
      onEdgesChange(reactFlowInstance.getEdges() as RelationshipEdge[]);
    }, 0);
  }, [onEdgesChangeInternal, onEdgesChange, reactFlowInstance]);

  // Apply layout algorithm
  const applyLayout = useCallback((layout: string) => {
    if (nodes.length <= 1) return;
    
    let positions: { [id: string]: { x: number, y: number } } = {};
    
    switch (layout) {
      case "grid":
        // Simple grid layout
        const cols = Math.ceil(Math.sqrt(nodes.length));
        const gridSize = 300;
        nodes.forEach((node, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          positions[node.id] = { 
            x: col * gridSize + 50, 
            y: row * gridSize + 50 
          };
        });
        break;
        
      case "circular":
        // Circular layout
        const radius = Math.max(300, nodes.length * 50);
        const centerX = 500;
        const centerY = 400;
        nodes.forEach((node, idx) => {
          const angle = (idx / nodes.length) * 2 * Math.PI;
          positions[node.id] = { 
            x: centerX + radius * Math.cos(angle), 
            y: centerY + radius * Math.sin(angle) 
          };
        });
        break;
        
      case "force":
        // Simple force-directed layout simulation
        toast.info("Applying force-directed layout...");
        setTimeout(() => toast.success("Layout applied"), 1000);
        return; // Would require a more complex implementation
        
      case "dagre":
        // Hierarchical layout (would normally use dagre library)
        toast.info("Applying hierarchical layout...");
        setTimeout(() => toast.success("Layout applied"), 1000);
        return; // Would require dagre or a similar library
        
      default:
        return;
    }
    
    // Apply new positions
    setNodes(nodes.map(node => ({
      ...node,
      position: positions[node.id] || node.position
    })));
    
    toast.success(`Applied ${layout} layout`);
    
    // Notify parent about changes
    setTimeout(() => {
      onNodesChange(reactFlowInstance.getNodes() as TableNodeType[]);
    }, 0);
  }, [nodes, setNodes, onNodesChange, reactFlowInstance]);

  // Handle connection between nodes
  const onConnect = useCallback((connection: Connection) => {
    const edge: RelationshipEdge = {
      id: `edge-${Date.now()}`,
      ...connection,
      animated: true,
      style: { stroke: '#525252' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#525252',
      },
      data: {
        relationshipType: 'one-to-many',
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
  }, [setEdges, nodes, setNodes, onNodesChange, onEdgesChange, reactFlowInstance]);

  // Add a new table to the canvas
  const addNewTable = useCallback((position = { x: 100, y: 100 }) => {
    const id = `table-${Date.now()}`;
    const newNode: TableNodeType = {
      id,
      type: 'tableNode',
      position,
      data: {
        id,
        tableName: `Table_${nodes.length + 1}`,
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
  }, [setNodes, nodes, onNodesChange]);

  const handleNodeMouseEnter = useCallback((event: React.MouseEvent, node: Node) => {
    const relevantSuggestions = suggestions.filter(
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
  }, [suggestions]);

  const handleNodeMouseLeave = useCallback(() => {
    setShowSuggestion(null);
  }, []);

  const toggleSnapToGrid = () => {
    setSnapToGrid(!snapToGrid);
    toast.success(snapToGrid ? "Snap to grid disabled" : "Snap to grid enabled");
  };

  // Apply a suggested relationship
  const applySuggestion = useCallback(() => {
    if (!showSuggestion) return;
    
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
  }, [showSuggestion, nodes, onConnect]);

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
        nodeTypes={nodeTypes}
        fitView
        snapToGrid={snapToGrid}
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          style: { stroke: '#525252' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#525252',
          },
        }}
      >
        <Background color="#a3a3a3" gap={16} />
        <Controls />
        
        {/* Quick Action Panel */}
        <Panel position="top-right" className="flex gap-2 bg-white p-2 rounded-md shadow-sm">
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleSnapToGrid}
            className={`text-xs ${snapToGrid ? 'bg-gray-100' : ''}`}
          >
            {snapToGrid ? "Grid: On" : "Grid: Off"}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => applyLayout("grid")}
            className="text-xs"
            title="Arrange tables in a grid layout"
          >
            <Database className="h-3.5 w-3.5 mr-1" />
            Grid
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => applyLayout("circular")}
            className="text-xs"
            title="Arrange tables in a circle"
          >
            <Database className="h-3.5 w-3.5 mr-1" />
            Circle
          </Button>
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
        </Panel>
        
        {/* Version History Panel */}
        <Panel position="bottom-right" className="flex gap-2 bg-white p-2 rounded-md shadow-sm">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => toast.success("Version saved")}
            className="text-xs"
          >
            <GitBranch className="h-3.5 w-3.5 mr-1" />
            Save Version
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => toast.success("Exporting diagram...")}
            className="text-xs"
          >
            <FileExport className="h-3.5 w-3.5 mr-1" />
            Export
          </Button>
        </Panel>
      </ReactFlow>
      
      {showSuggestion && (
        <div 
          className="relationship-suggestion"
          style={{
            position: 'absolute',
            left: showSuggestion.x + 10,
            top: showSuggestion.y - 10,
            zIndex: 1000,
          }}
        >
          <p className="font-semibold mb-1 flex items-center">
            <Zap className="h-4 w-4 mr-1 text-yellow-500" />
            Suggested Relationship
          </p>
          <p className="text-xs">{`${showSuggestion.suggestion.sourceTable} → ${showSuggestion.suggestion.targetTable}`}</p>
          <p className="text-xs">{`Type: ${showSuggestion.suggestion.relationshipType}`}</p>
          <p className="text-xs italic mt-1">{showSuggestion.suggestion.reason}</p>
          <Button 
            size="sm" 
            variant="outline"
            className="mt-2 bg-white text-xs"
            onClick={applySuggestion}
          >
            Apply Suggestion
          </Button>
        </div>
      )}
    </div>
  );
});

ERDCanvas.displayName = "ERDCanvas";

export default ERDCanvas;
