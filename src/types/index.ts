
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

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  length?: number; // For types like VARCHAR(255)
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNullable: boolean;
  referencesTable?: string;
  referencesColumn?: string;
}

export interface TableData {
  id: string;
  tableName: string;
  columns: Column[];
}

export type TableNode = Node<TableData>;

export interface RelationshipEdge extends Edge {
  data?: {
    relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many';
    sourceColumn: string;
    targetColumn: string;
  }
}

export interface DiagramState {
  nodes: TableNode[];
  edges: RelationshipEdge[];
}
