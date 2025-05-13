
import { useCallback, useState, forwardRef, useImperativeHandle } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css"; // Fixed import path for styles

import TableNode from "./TableNode";
import { TableData, TableNode as TableNodeType, RelationshipEdge } from "@/types";

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
  const reactFlowInstance = useReactFlow();

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

  // Handle connection between nodes
  const onConnect = useCallback((connection: Connection) => {
    const edge: RelationshipEdge = {
      id: `edge-${Date.now()}`,
      ...connection,
      animated: true,
      style: { stroke: '#8B5CF6' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#8B5CF6',
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

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
});

ERDCanvas.displayName = "ERDCanvas";

export default ERDCanvas;
