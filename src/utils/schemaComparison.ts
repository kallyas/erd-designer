// src/utils/schemaComparison.ts
import { DiagramState, TableData } from "@/types";

export interface SchemaComparisonResult {
  tablesAdded: TableDiff[];
  tablesRemoved: TableDiff[];
  tablesModified: TableDiff[];
  summary: {
    totalChanges: number;
    addedTables: number;
    removedTables: number;
    modifiedTables: number;
    columnsAdded: number;
    columnsRemoved: number;
    columnsModified: number;
    constraintsChanged: number;
  };
}

export interface TableDiff {
  tableName: string;
  schema?: string;
  columnsAdded?: ColumnDiff[];
  columnsRemoved?: ColumnDiff[];
  columnsModified?: ColumnDiff[];
  constraintsChanged?: ConstraintDiff[];
}

export interface ColumnDiff {
  columnName: string;
  oldType?: string;
  newType?: string;
  changes?: {
    property: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface ConstraintDiff {
  type: string;
  oldValue?: any;
  newValue?: any;
}

export function compareSchemas(
  schema1: DiagramState,
  schema2: DiagramState
): SchemaComparisonResult {
  const result: SchemaComparisonResult = {
    tablesAdded: [],
    tablesRemoved: [],
    tablesModified: [],
    summary: {
      totalChanges: 0,
      addedTables: 0,
      removedTables: 0,
      modifiedTables: 0,
      columnsAdded: 0,
      columnsRemoved: 0,
      columnsModified: 0,
      constraintsChanged: 0,
    },
  };

  // Create maps of table names to data for easier lookup
  const schema1Tables = new Map<string, TableData>();
  const schema2Tables = new Map<string, TableData>();

  schema1.nodes.forEach((node) => {
    schema1Tables.set(node.data.tableName, node.data);
  });

  schema2.nodes.forEach((node) => {
    schema2Tables.set(node.data.tableName, node.data);
  });

  // Find added tables
  for (const [tableName, tableData] of schema2Tables.entries()) {
    if (!schema1Tables.has(tableName)) {
      result.tablesAdded.push({
        tableName,
        schema: tableData.schema,
      });
      result.summary.addedTables++;
      result.summary.totalChanges++;
    }
  }

  // Find removed tables
  for (const [tableName, tableData] of schema1Tables.entries()) {
    if (!schema2Tables.has(tableName)) {
      result.tablesRemoved.push({
        tableName,
        schema: tableData.schema,
      });
      result.summary.removedTables++;
      result.summary.totalChanges++;
    }
  }

  // Find modified tables
  for (const [tableName, table1] of schema1Tables.entries()) {
    if (schema2Tables.has(tableName)) {
      const table2 = schema2Tables.get(tableName)!;
      const tableDiff = compareTable(table1, table2);

      if (tableDiff) {
        result.tablesModified.push(tableDiff);
        result.summary.modifiedTables++;

        // Update summary counts
        result.summary.columnsAdded += tableDiff.columnsAdded?.length || 0;
        result.summary.columnsRemoved += tableDiff.columnsRemoved?.length || 0;
        result.summary.columnsModified +=
          tableDiff.columnsModified?.length || 0;
        result.summary.constraintsChanged +=
          tableDiff.constraintsChanged?.length || 0;

        result.summary.totalChanges +=
          (tableDiff.columnsAdded?.length || 0) +
          (tableDiff.columnsRemoved?.length || 0) +
          (tableDiff.columnsModified?.length || 0) +
          (tableDiff.constraintsChanged?.length || 0);
      }
    }
  }

  return result;
}

function compareTable(table1: TableData, table2: TableData): TableDiff | null {
  const diff: TableDiff = {
    tableName: table1.tableName,
    schema: table1.schema,
    columnsAdded: [],
    columnsRemoved: [],
    columnsModified: [],
    constraintsChanged: [],
  };

  // Check schema change
  if (table1.schema !== table2.schema) {
    diff.constraintsChanged!.push({
      type: "Schema",
      oldValue: table1.schema,
      newValue: table2.schema,
    });
  }

  // Compare columns
  const columns1 = new Map(table1.columns.map((col) => [col.name, col]));
  const columns2 = new Map(table2.columns.map((col) => [col.name, col]));

  // Find added columns
  for (const [colName, colData] of columns2.entries()) {
    if (!columns1.has(colName)) {
      diff.columnsAdded!.push({
        columnName: colName,
        newType: colData.type,
      });
    }
  }

  // Find removed columns
  for (const [colName, colData] of columns1.entries()) {
    if (!columns2.has(colName)) {
      diff.columnsRemoved!.push({
        columnName: colName,
        oldType: colData.type,
      });
    }
  }

  // Find modified columns
  for (const [colName, col1] of columns1.entries()) {
    if (columns2.has(colName)) {
      const col2 = columns2.get(colName)!;
      const colChanges = compareColumn(col1, col2);

      if (colChanges.length > 0) {
        diff.columnsModified!.push({
          columnName: colName,
          oldType: col1.type,
          newType: col2.type,
          changes: colChanges,
        });
      }
    }
  }

  // Check for comments and other table-level properties
  if (table1.comment !== table2.comment) {
    diff.constraintsChanged!.push({
      type: "Comment",
      oldValue: table1.comment,
      newValue: table2.comment,
    });
  }

  // Clean up empty arrays
  if (diff.columnsAdded!.length === 0) delete diff.columnsAdded;
  if (diff.columnsRemoved!.length === 0) delete diff.columnsRemoved;
  if (diff.columnsModified!.length === 0) delete diff.columnsModified;
  if (diff.constraintsChanged!.length === 0) delete diff.constraintsChanged;

  // Return null if no changes
  if (
    !diff.columnsAdded &&
    !diff.columnsRemoved &&
    !diff.columnsModified &&
    !diff.constraintsChanged
  ) {
    return null;
  }

  return diff;
}

function compareColumn(
  col1: any,
  col2: any
): { property: string; oldValue: any; newValue: any }[] {
  const changes: { property: string; oldValue: any; newValue: any }[] = [];

  // Compare basic properties
  if (col1.type !== col2.type) {
    changes.push({
      property: "Type",
      oldValue: col1.type,
      newValue: col2.type,
    });
  }

  if (col1.length !== col2.length) {
    changes.push({
      property: "Length",
      oldValue: col1.length,
      newValue: col2.length,
    });
  }

  if (col1.isPrimaryKey !== col2.isPrimaryKey) {
    changes.push({
      property: "Primary Key",
      oldValue: col1.isPrimaryKey,
      newValue: col2.isPrimaryKey,
    });
  }

  if (col1.isForeignKey !== col2.isForeignKey) {
    changes.push({
      property: "Foreign Key",
      oldValue: col1.isForeignKey,
      newValue: col2.isForeignKey,
    });
  }

  if (col1.isNullable !== col2.isNullable) {
    changes.push({
      property: "Nullable",
      oldValue: col1.isNullable,
      newValue: col2.isNullable,
    });
  }

  if (col1.isUnique !== col2.isUnique) {
    changes.push({
      property: "Unique",
      oldValue: col1.isUnique,
      newValue: col2.isUnique,
    });
  }

  // Compare references
  if (
    col1.referencesTable !== col2.referencesTable ||
    col1.referencesColumn !== col2.referencesColumn
  ) {
    changes.push({
      property: "References",
      oldValue: col1.referencesTable
        ? `${col1.referencesTable}.${col1.referencesColumn}`
        : null,
      newValue: col2.referencesTable
        ? `${col2.referencesTable}.${col2.referencesColumn}`
        : null,
    });
  }

  // Compare constraints
  if (JSON.stringify(col1.constraints) !== JSON.stringify(col2.constraints)) {
    changes.push({
      property: "Constraints",
      oldValue: col1.constraints,
      newValue: col2.constraints,
    });
  }

  // Compare enum values
  if (
    col1.type === "ENUM" &&
    col2.type === "ENUM" &&
    JSON.stringify(col1.enumValues) !== JSON.stringify(col2.enumValues)
  ) {
    changes.push({
      property: "Enum Values",
      oldValue: col1.enumValues?.join(", "),
      newValue: col2.enumValues?.join(", "),
    });
  }

  return changes;
}
