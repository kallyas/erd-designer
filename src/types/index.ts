
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
  | 'DECIMAL'
  | 'JSON'
  | 'UUID'
  | 'ENUM'
  | 'ARRAY'
  | 'JSONB'
  | 'CUSTOM';

export interface Constraint {
  type: 'CHECK' | 'UNIQUE' | 'DEFAULT' | 'EXCLUSION' | 'FOREIGN_KEY' | 'NOT_NULL';
  expression?: string; // For CHECK constraints
  defaultValue?: string; // For DEFAULT constraints
  excludeExpression?: string; // For EXCLUSION constraints
}

export interface CustomType {
  name: string;
  baseType: string;
  description?: string;
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
  enumValues?: string[]; // For ENUM types
  comment?: string; // Documentation
  validationRules?: string[]; // Business logic validation rules
}

export interface TableData {
  id: string;
  tableName: string;
  columns: Column[];
  comment?: string;
  schema?: string; // For database schemas like 'public', 'auth', etc.
  tags?: string[]; // For organizing tables
  [key: string]: unknown; // Add index signature to satisfy Record<string, unknown>
}

export type TableNode = Node<TableData>;

export type RelationshipType = 'one-to-one' | 'one-to-many' | 'many-to-many' | 'inheritance';

export interface RelationshipEdge extends Edge {
  data?: {
    relationshipType: RelationshipType;
    sourceColumn: string;
    targetColumn: string;
    onDelete?: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'SET DEFAULT' | 'NO ACTION';
    onUpdate?: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'SET DEFAULT' | 'NO ACTION';
    [key: string]: unknown; // Add index signature
  }
}

export interface DiagramState {
  nodes: TableNode[];
  edges: RelationshipEdge[];
  version?: string;
  lastModified?: Date;
  dialect?: string;
  description?: string;
}

export interface RelationshipSuggestion {
  sourceTable: string;
  targetTable: string;
  relationshipType: RelationshipType;
  confidence: number; // 0-1 value indicating confidence in suggestion
  reason: string;
}

export interface DatabaseDialect {
  name: string;
  key: string;
  version?: string;
}

export interface ValidationRule {
  name: string;
  rule: string;
  tables: string[];
  description?: string;
}

// Export formats
export type ExportFormat = 'SQL' | 'PNG' | 'PDF' | 'JSON' | 'XML' | 'ORM';

// User for collaboration features
export interface User {
  id: string;
  name: string;
  avatar?: string;
}

// Version history
export interface VersionHistory {
  id: string;
  version: string;
  date: Date;
  author?: string;
  changes?: string;
  state: DiagramState;
}

// Table templates
export interface TableTemplate {
  name: string;
  description: string;
  tables: TableData[];
  relationships: RelationshipEdge[];
}
