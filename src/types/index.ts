
import { Node, Edge } from "@xyflow/react";

export type ColumnType = 
  | 'INT'
  | 'VARCHAR'
  | 'TEXT'
  | 'BOOLEAN'
  | 'DATE'
  | 'TIMESTAMP'
  | 'FLOAT'
  | 'DOUBLE'
  | 'DECIMAL';

export interface Constraint {
  type: 'CHECK' | 'UNIQUE' | 'DEFAULT';
  expression?: string; // For CHECK constraints
  defaultValue?: string; // For DEFAULT constraints
}

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  length?: number; // For types like VARCHAR(255)
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNullable: boolean;
  isUnique?: boolean;
  constraints?: Constraint[];
  referencesTable?: string;
  referencesColumn?: string;
}

export interface TableData {
  id: string;
  tableName: string;
  columns: Column[];
  [key: string]: unknown; // Add index signature to satisfy Record<string, unknown>
}

export type TableNode = Node<TableData>;

export type RelationshipType = 'one-to-one' | 'one-to-many' | 'many-to-many';

export interface RelationshipEdge extends Edge {
  data?: {
    relationshipType: RelationshipType;
    sourceColumn: string;
    targetColumn: string;
    [key: string]: unknown; // Add index signature
  }
}

export interface DiagramState {
  nodes: TableNode[];
  edges: RelationshipEdge[];
}

export interface RelationshipSuggestion {
  sourceTable: string;
  targetTable: string;
  relationshipType: RelationshipType;
  confidence: number; // 0-1 value indicating confidence in suggestion
  reason: string;
}
