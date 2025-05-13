
import { DiagramState, Column, TableData } from "../types";

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
    .replace(/\b(CREATE|TABLE|PRIMARY|KEY|FOREIGN|REFERENCES|INT|VARCHAR|TEXT|BOOLEAN|DATE|TIMESTAMP|FLOAT|DOUBLE|DECIMAL|NOT|NULL)\b/g, match => 
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
    .replace(/<span class="keyword">(PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL)<\/span>/g, (match, constraint) => 
      `<span class="constraint">${constraint}</span>`
    );
  
  return formattedSql;
}
