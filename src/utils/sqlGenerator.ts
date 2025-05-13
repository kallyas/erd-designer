
import { DiagramState, Column, TableData, Constraint } from "../types";

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
