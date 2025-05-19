
// src/components/types/index.ts
import { NodeProps as ReactFlowNodeProps, Edge, EdgeProps } from "@xyflow/react";
import { GroupNodeData } from "../GroupNode";
import { TableData, RelationshipType } from "@/types";

// Common component prop types to improve consistency across components
export interface ERDComponentProps {
  readOnly?: boolean;
  id?: string;
  selected?: boolean;
}

// Enhanced type for TableNode props
export interface TableNodeProps extends ERDComponentProps {
  data: TableData;
}

// Type for relationship suggestion UI component
export interface RelationshipSuggestionCardProps {
  x: number;
  y: number;
  suggestion: {
    sourceTable: string;
    targetTable: string;
    relationshipType: string;
    confidence: number;
    reason?: string;
  };
  onApply: () => void;
  onClose: () => void;
}

// Types for specific node renderers
export type GroupNodeProps = ReactFlowNodeProps<GroupNodeData>;
export type TableNodeComponentProps = ReactFlowNodeProps<TableData>;

// Helper type for edge data
export interface RelationshipEdgeData {
  relationshipType?: RelationshipType;
  sourceColumn?: string;
  targetColumn?: string;
  onDelete?: string;
  onUpdate?: string;
}

// Custom edge type for the CustomEdge component
export type CustomEdgeProps = EdgeProps<RelationshipEdgeData>;
