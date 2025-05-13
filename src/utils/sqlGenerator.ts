
import { DiagramState, Column, TableData, Constraint, RelationshipSuggestion } from "../types";

export function generateSQL(state: DiagramState): string {
  const { nodes, edges } = state;
  
  // Start with creating tables
  let sql = "";
  
  // Add SQL for each table
  nodes.forEach((node) => {
    const tableData: TableData = node.data;
    
    sql += `CREATE TABLE ${formatTableName(tableData.tableName)} (\n`;
    
    // Add columns
    const columnDefinitions = tableData.columns.map((column) => {
      let columnSql = `  ${formatColumnName(column.name)} ${formatColumnType(column)}`;
      
      // Add NOT NULL constraint if applicable
      if (!column.isNullable) {
        columnSql += " NOT NULL";
      }
      
      // Add DEFAULT constraint if applicable
      const defaultConstraint = column.constraints?.find(c => c.type === 'DEFAULT');
      if (defaultConstraint && defaultConstraint.defaultValue) {
        columnSql += ` DEFAULT ${defaultConstraint.defaultValue}`;
      }
      
      // Check for UNIQUE constraint at column level
      if (column.isUnique) {
        columnSql += " UNIQUE";
      }
      
      return columnSql;
    });
    
    // Add primary key constraints
    const primaryKeys = tableData.columns.filter(col => col.isPrimaryKey);
    if (primaryKeys.length > 0) {
      columnDefinitions.push(`  PRIMARY KEY (${primaryKeys.map(pk => formatColumnName(pk.name)).join(", ")})`);
    }

    // Add foreign key constraints for columns that are foreign keys
    tableData.columns
      .filter(col => col.isForeignKey && col.referencesTable && col.referencesColumn)
      .forEach(fk => {
        columnDefinitions.push(
          `  FOREIGN KEY (${formatColumnName(fk.name)}) REFERENCES ${formatTableName(fk.referencesTable!)}(${formatColumnName(fk.referencesColumn!)})`
        );
      });
    
    // Add CHECK constraints
    tableData.columns.forEach(column => {
      const checkConstraints = column.constraints?.filter(c => c.type === 'CHECK' && c.expression);
      if (checkConstraints && checkConstraints.length > 0) {
        checkConstraints.forEach(constraint => {
          columnDefinitions.push(`  CHECK (${constraint.expression})`);
        });
      }
    });
    
    // Add UNIQUE constraints for multiple columns if needed
    // (For now we just handle single column unique constraints at the column level)
    
    sql += columnDefinitions.join(",\n");
    sql += "\n);\n\n";
  });
  
  return sql;
}

function formatTableName(name: string): string {
  return `\`${name}\``;
}

function formatColumnName(name: string): string {
  return `\`${name}\``;
}

function formatColumnType(column: Column): string {
  switch (column.type) {
    case "VARCHAR":
      return `VARCHAR(${column.length || 255})`;
    case "INT":
      return "INT";
    case "TEXT":
      return "TEXT";
    case "BOOLEAN":
      return "BOOLEAN";
    case "DATE":
      return "DATE";
    case "TIMESTAMP":
      return "TIMESTAMP";
    case "FLOAT":
      return "FLOAT";
    case "DOUBLE":
      return "DOUBLE";
    case "DECIMAL":
      return "DECIMAL(10,2)";
    default:
      return "VARCHAR(255)";
  }
}

export function formatSQLForDisplay(sql: string): string {
  // Highlight SQL keywords
  let formattedSql = sql
    .replace(/\b(CREATE|TABLE|PRIMARY|KEY|FOREIGN|REFERENCES|INT|VARCHAR|TEXT|BOOLEAN|DATE|TIMESTAMP|FLOAT|DOUBLE|DECIMAL|NOT|NULL|UNIQUE|CHECK|DEFAULT)\b/g, match => 
      `<span class="keyword">${match}</span>`
    )
    // Highlight table names
    .replace(/`([^`]+)`/g, (match, tableName) => 
      `<span class="table-name">\`${tableName}\`</span>`
    )
    // Highlight data types
    .replace(/<span class="keyword">(INT|VARCHAR|TEXT|BOOLEAN|DATE|TIMESTAMP|FLOAT|DOUBLE|DECIMAL)<\/span>(\(\d+(?:,\d+)?\))?/g, (match, dataType, size) => 
      `<span class="data-type">${dataType}${size || ''}</span>`
    )
    // Highlight constraints
    .replace(/<span class="keyword">(PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|UNIQUE|CHECK|DEFAULT)<\/span>/g, (match, constraint) => 
      `<span class="constraint">${constraint}</span>`
    );
  
  return formattedSql;
}

// Function to suggest relationships between tables based on column names and data types
export function suggestRelationships(nodes: TableData[]): RelationshipSuggestion[] {
  const suggestions: RelationshipSuggestion[] = [];
  
  for (const sourceTable of nodes) {
    for (const targetTable of nodes) {
      if (sourceTable.id === targetTable.id) continue;
      
      // Look for potential foreign key relationships
      for (const targetColumn of targetTable.columns) {
        // Check if column name matches pattern "tablename_id" or "tablenameid"
        const possibleSourceTableName = sourceTable.tableName.toLowerCase();
        const columnNameLower = targetColumn.name.toLowerCase();
        
        if (columnNameLower === `${possibleSourceTableName}_id` || 
            columnNameLower === `${possibleSourceTableName}id`) {
          
          // Find the primary key in the source table
          const sourcePK = sourceTable.columns.find(col => col.isPrimaryKey);
          
          if (sourcePK && targetColumn.type === sourcePK.type) {
            suggestions.push({
              sourceTable: sourceTable.tableName,
              targetTable: targetTable.tableName,
              relationshipType: 'one-to-many',
              confidence: 0.8,
              reason: `Column name "${targetColumn.name}" in "${targetTable.tableName}" suggests a relationship with "${sourceTable.tableName}"`
            });
          }
        }
      }
    }
  }
  
  return suggestions;
}

// Parse SQL to generate diagram
export function parseSQL(sql: string): DiagramState {
  const lines = sql.split('\n');
  const nodes: TableData[] = [];
  const edges: any[] = [];
  
  let currentTable: TableData | null = null;
  let tableName = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for CREATE TABLE statement
    const createTableMatch = line.match(/CREATE\s+TABLE\s+[`"]?([^`"\s(]+)[`"]?\s*\(/i);
    if (createTableMatch) {
      tableName = createTableMatch[1].replace(/[`"]/g, '');
      const tableId = `table-${Date.now()}-${nodes.length}`;
      
      currentTable = {
        id: tableId,
        tableName,
        columns: []
      };
      
      continue;
    }
    
    // End of table definition
    if (line === ');' && currentTable) {
      nodes.push(currentTable);
      currentTable = null;
      continue;
    }
    
    // Skip if not in a table definition
    if (!currentTable) continue;
    
    // Check for column definition
    const columnMatch = line.match(/^\s*[`"]?([^`"\s,]+)[`"]?\s+([A-Za-z0-9()]+)(.+)?[,]?$/);
    if (columnMatch && !line.startsWith('PRIMARY KEY') && !line.startsWith('FOREIGN KEY') && !line.startsWith('CHECK')) {
      const columnName = columnMatch[1];
      const columnType = columnMatch[2].toUpperCase();
      const columnOptions = columnMatch[3] || '';
      
      const isPrimaryKey = /PRIMARY\s+KEY/i.test(columnOptions);
      const isNullable = !/NOT\s+NULL/i.test(columnOptions);
      const isUnique = /UNIQUE/i.test(columnOptions);
      
      const lengthMatch = columnType.match(/\((\d+)\)/);
      const length = lengthMatch ? parseInt(lengthMatch[1]) : undefined;
      
      const constraints: Constraint[] = [];
      
      // Check for DEFAULT constraint
      const defaultMatch = columnOptions.match(/DEFAULT\s+([^,\s]+)/i);
      if (defaultMatch) {
        constraints.push({
          type: 'DEFAULT',
          defaultValue: defaultMatch[1]
        });
      }
      
      // Check for CHECK constraint
      const checkMatch = columnOptions.match(/CHECK\s+\((.+?)\)/i);
      if (checkMatch) {
        constraints.push({
          type: 'CHECK',
          expression: checkMatch[1]
        });
      }
      
      const column: Column = {
        id: `${currentTable.id}-col-${currentTable.columns.length}`,
        name: columnName,
        type: columnType.split('(')[0] as any,
        length,
        isPrimaryKey,
        isForeignKey: false,
        isNullable,
        isUnique,
        constraints
      };
      
      currentTable.columns.push(column);
    }
    
    // Check for FOREIGN KEY constraints
    const fkMatch = line.match(/FOREIGN\s+KEY\s+\(\s*[`"]?([^`"\s)]+)[`"]?\s*\)\s+REFERENCES\s+[`"]?([^`"\s(]+)[`"]?\s*\(\s*[`"]?([^`"\s)]+)[`"]?\s*\)/i);
    if (fkMatch && currentTable) {
      const fkColumnName = fkMatch[1];
      const refTableName = fkMatch[2];
      const refColumnName = fkMatch[3];
      
      // Find the column
      const column = currentTable.columns.find(col => col.name === fkColumnName);
      if (column) {
        column.isForeignKey = true;
        column.referencesTable = refTableName;
        column.referencesColumn = refColumnName;
      }
    }
  }
  
  // Generate edges based on foreign keys
  for (const table of nodes) {
    for (const column of table.columns) {
      if (column.isForeignKey && column.referencesTable && column.referencesColumn) {
        const targetTable = nodes.find(t => t.tableName === column.referencesTable);
        if (targetTable) {
          edges.push({
            id: `edge-${Date.now()}-${edges.length}`,
            source: targetTable.id,
            target: table.id,
            animated: true,
            style: { stroke: '#525252' },
            markerEnd: {
              type: 'arrowclosed',
              color: '#525252',
            },
            data: {
              relationshipType: 'one-to-many',
              sourceColumn: column.referencesColumn,
              targetColumn: column.name
            }
          });
        }
      }
    }
  }
  
  return {
    nodes: nodes.map((tableData, index) => ({
      id: tableData.id,
      type: 'tableNode',
      position: { x: 100 + (index * 300), y: 100 + (index * 50) },
      data: tableData
    })),
    edges
  };
}
