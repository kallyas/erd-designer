// src/utils/aiSuggestions.ts
import {
  DiagramState,
  TableData,
  Column,
  RelationshipSuggestion,
} from "@/types";

// Define suggestion types
export type SuggestionType =
  | "missing_fk"
  | "index_opportunity"
  | "normalization_issue"
  | "naming_consistency"
  | "data_type_optimization"
  | "missing_timestamp"
  | "missing_constraints"
  | "security_concern";

export interface SchemaSuggestion {
  id: string;
  type: SuggestionType;
  priority: "high" | "medium" | "low";
  tableName: string;
  columnName?: string;
  description: string;
  reason: string;
  action?: string; // Optional code or action to implement suggestion
}

export function analyzeSchema(diagram: DiagramState): SchemaSuggestion[] {
  const suggestions: SchemaSuggestion[] = [];

  // Check for common tables or columns
  suggestions.push(...checkForCommonTables(diagram));

  // Check for missing foreign keys
  suggestions.push(...checkForMissingForeignKeys(diagram));

  // Check for indexing opportunities
  suggestions.push(...checkForIndexingOpportunities(diagram));

  // Check for normalization issues
  suggestions.push(...checkForNormalizationIssues(diagram));

  // Check for naming inconsistencies
  suggestions.push(...checkForNamingInconsistencies(diagram));

  // Check for data type optimizations
  suggestions.push(...checkForDataTypeOptimizations(diagram));

  // Check for missing timestamps
  suggestions.push(...checkForMissingTimestamps(diagram));

  // Check for missing constraints
  suggestions.push(...checkForMissingConstraints(diagram));

  // Check for security concerns
  suggestions.push(...checkForSecurityConcerns(diagram));

  return suggestions;
}

function checkForCommonTables(diagram: DiagramState): SchemaSuggestion[] {
  const suggestions: SchemaSuggestion[] = [];
  const tables = diagram.nodes.map((n) => n.data);

  // Common patterns to look for
  const commonPatterns = [
    {
      name: "users",
      description: "Standard users table",
      expectedColumns: ["id", "username", "email", "password", "created_at"],
    },
    {
      name: "roles",
      description: "User roles for permission management",
      expectedColumns: ["id", "name", "description"],
    },
    {
      name: "permissions",
      description: "Permissions for access control",
      expectedColumns: ["id", "name", "description"],
    },
  ];

  // Check for missing common tables
  commonPatterns.forEach((pattern) => {
    const tableExists = tables.some(
      (t) =>
        t.tableName.toLowerCase() === pattern.name ||
        t.tableName.toLowerCase() === `${pattern.name}_table` ||
        t.tableName.toLowerCase() === pattern.name.slice(0, -1) // Singular form
    );

    if (!tableExists) {
      suggestions.push({
        id: `missing-table-${pattern.name}-${Date.now()}`,
        type: "missing_fk",
        priority: "medium",
        tableName: pattern.name,
        description: `Consider adding a ${pattern.name} table for ${pattern.description}`,
        reason: `Most applications require a ${pattern.name} table for ${pattern.description}`,
      });
    }
  });

  // For existing common tables, check for missing columns
  commonPatterns.forEach((pattern) => {
    const table = tables.find(
      (t) =>
        t.tableName.toLowerCase() === pattern.name ||
        t.tableName.toLowerCase() === `${pattern.name}_table` ||
        t.tableName.toLowerCase() === pattern.name.slice(0, -1)
    );

    if (table) {
      const existingColumns = table.columns.map((c) => c.name.toLowerCase());

      pattern.expectedColumns.forEach((expectedCol) => {
        // Check for exact match or similar column names
        const hasColumn = existingColumns.some(
          (col) =>
            col === expectedCol.toLowerCase() ||
            col === `${expectedCol}_column` ||
            col === `${table.tableName.toLowerCase()}_${expectedCol}`
        );

        if (!hasColumn) {
          suggestions.push({
            id: `missing-column-${
              table.tableName
            }-${expectedCol}-${Date.now()}`,
            type: "missing_constraints",
            priority: "medium",
            tableName: table.tableName,
            columnName: expectedCol,
            description: `Consider adding a ${expectedCol} column to the ${table.tableName} table`,
            reason: `The ${expectedCol} column is typically expected in a ${pattern.name} table`,
          });
        }
      });
    }
  });

  return suggestions;
}

function checkForMissingForeignKeys(diagram: DiagramState): SchemaSuggestion[] {
  const suggestions: SchemaSuggestion[] = [];
  const tables = diagram.nodes.map((n) => n.data);

  tables.forEach((table) => {
    // Look for columns that follow the pattern table_id or tableId
    table.columns.forEach((column) => {
      if (column.isForeignKey) return; // Skip existing foreign keys

      // Check for patterns like 'user_id', 'userId', etc.
      const nameMatch = column.name.match(/^(.+)_?id$/i);
      if (nameMatch) {
        const potentialTableName = nameMatch[1].toLowerCase();

        // Check if there's a table with this name
        const referencedTable = tables.find(
          (t) =>
            t.tableName.toLowerCase() === potentialTableName ||
            t.tableName.toLowerCase() === `${potentialTableName}s` || // Plural form
            t.tableName.toLowerCase() === `${potentialTableName}_table`
        );

        if (referencedTable) {
          // Check if the column type matches the primary key of the referenced table
          const primaryKey = referencedTable.columns.find(
            (c) => c.isPrimaryKey
          );

          if (primaryKey && column.type === primaryKey.type) {
            suggestions.push({
              id: `missing-fk-${table.tableName}-${column.name}-${Date.now()}`,
              type: "missing_fk",
              priority: "high",
              tableName: table.tableName,
              columnName: column.name,
              description: `Column ${column.name} looks like a foreign key to ${referencedTable.tableName}`,
              reason: `The column name and type match the primary key of the ${referencedTable.tableName} table`,
              action: `ALTER TABLE ${table.tableName} ADD CONSTRAINT fk_${table.tableName}_${column.name} FOREIGN KEY (${column.name}) REFERENCES ${referencedTable.tableName}(${primaryKey.name});`,
            });
          }
        }
      }
    });
  });

  return suggestions;
}

function checkForIndexingOpportunities(
  diagram: DiagramState
): SchemaSuggestion[] {
  const suggestions: SchemaSuggestion[] = [];
  const tables = diagram.nodes.map((n) => n.data);

  tables.forEach((table) => {
    // Foreign keys should typically be indexed
    table.columns
      .filter((col) => col.isForeignKey && !col.isPrimaryKey)
      .forEach((fkColumn) => {
        suggestions.push({
          id: `index-fk-${table.tableName}-${fkColumn.name}-${Date.now()}`,
          type: "index_opportunity",
          priority: "medium",
          tableName: table.tableName,
          columnName: fkColumn.name,
          description: `Consider adding an index on foreign key ${fkColumn.name}`,
          reason: `Foreign keys are frequently used in JOINs and WHERE clauses, making them ideal candidates for indexing`,
          action: `CREATE INDEX idx_${table.tableName}_${fkColumn.name} ON ${table.tableName}(${fkColumn.name});`,
        });
      });

    // Columns with unique constraints should be indexed
    table.columns
      .filter((col) => col.isUnique && !col.isPrimaryKey && !col.isForeignKey)
      .forEach((uniqueColumn) => {
        suggestions.push({
          id: `index-unique-${table.tableName}-${
            uniqueColumn.name
          }-${Date.now()}`,
          type: "index_opportunity",
          priority: "medium",
          tableName: table.tableName,
          columnName: uniqueColumn.name,
          description: `Consider adding a unique index on ${uniqueColumn.name}`,
          reason: `Columns with unique constraints can benefit from unique indexes for faster lookups`,
          action: `CREATE UNIQUE INDEX idx_${table.tableName}_${uniqueColumn.name} ON ${table.tableName}(${uniqueColumn.name});`,
        });
      });

    // Look for columns that are likely to be used in WHERE clauses
    const commonFilterColumns = [
      "status",
      "type",
      "category",
      "active",
      "enabled",
      "deleted",
    ];

    table.columns
      .filter(
        (col) =>
          commonFilterColumns.some((name) =>
            col.name.toLowerCase().includes(name)
          ) &&
          !col.isPrimaryKey &&
          !col.isForeignKey &&
          !col.isUnique
      )
      .forEach((filterColumn) => {
        suggestions.push({
          id: `index-filter-${table.tableName}-${
            filterColumn.name
          }-${Date.now()}`,
          type: "index_opportunity",
          priority: "low",
          tableName: table.tableName,
          columnName: filterColumn.name,
          description: `Consider adding an index on ${filterColumn.name}`,
          reason: `Columns like ${filterColumn.name} are often used in WHERE clauses and can benefit from indexing`,
          action: `CREATE INDEX idx_${table.tableName}_${filterColumn.name} ON ${table.tableName}(${filterColumn.name});`,
        });
      });
  });

  return suggestions;
}

function checkForNormalizationIssues(
  diagram: DiagramState
): SchemaSuggestion[] {
  const suggestions: SchemaSuggestion[] = [];
  const tables = diagram.nodes.map((n) => n.data);

  tables.forEach((table) => {
    // Check for columns that might contain repeated data
    table.columns.forEach((column) => {
      // Look for array or JSON columns that could be normalized
      if (column.type === "ARRAY" || column.type === "JSON") {
        suggestions.push({
          id: `normalization-array-${table.tableName}-${
            column.name
          }-${Date.now()}`,
          type: "normalization_issue",
          priority: "medium",
          tableName: table.tableName,
          columnName: column.name,
          description: `Consider normalizing ${column.name} into a separate table`,
          reason: `Storing arrays or JSON in a column might indicate a need for a separate table to properly normalize the data`,
        });
      }

      // Look for columns with names suggesting lists
      if (
        column.name.toLowerCase().endsWith("list") ||
        column.name.toLowerCase().endsWith("ids") ||
        column.name.toLowerCase().endsWith("names") ||
        column.name.toLowerCase().includes("_list_")
      ) {
        suggestions.push({
          id: `normalization-list-${table.tableName}-${
            column.name
          }-${Date.now()}`,
          type: "normalization_issue",
          priority: "medium",
          tableName: table.tableName,
          columnName: column.name,
          description: `Column ${column.name} might contain multiple values that should be normalized`,
          reason: `Column names suggesting lists often indicate a one-to-many relationship that should be modeled as a separate table`,
        });
      }
    });

    // Check for tables with many columns (potential wide table issue)
    if (table.columns.length > 20) {
      suggestions.push({
        id: `normalization-wide-${table.tableName}-${Date.now()}`,
        type: "normalization_issue",
        priority: "low",
        tableName: table.tableName,
        description: `Table ${table.tableName} has ${table.columns.length} columns and might need to be split`,
        reason: `Tables with many columns could indicate a need for further normalization or splitting into multiple tables`,
      });
    }
  });

  return suggestions;
}

function checkForNamingInconsistencies(
  diagram: DiagramState
): SchemaSuggestion[] {
  const suggestions: SchemaSuggestion[] = [];
  const tables = diagram.nodes.map((n) => n.data);

  // Detect the dominant naming convention
  const tableConventions = {
    snake_case: 0,
    camelCase: 0,
    PascalCase: 0,
    other: 0,
  };

  const columnConventions = {
    snake_case: 0,
    camelCase: 0,
    PascalCase: 0,
    other: 0,
  };

  // Count conventions for table names
  tables.forEach((table) => {
    if (/^[a-z][a-z0-9_]*$/.test(table.tableName)) {
      tableConventions.snake_case++;
    } else if (/^[a-z][a-zA-Z0-9]*$/.test(table.tableName)) {
      tableConventions.camelCase++;
    } else if (/^[A-Z][a-zA-Z0-9]*$/.test(table.tableName)) {
      tableConventions.PascalCase++;
    } else {
      tableConventions.other++;
    }

    // Count conventions for column names
    table.columns.forEach((column) => {
      if (/^[a-z][a-z0-9_]*$/.test(column.name)) {
        columnConventions.snake_case++;
      } else if (/^[a-z][a-zA-Z0-9]*$/.test(column.name)) {
        columnConventions.camelCase++;
      } else if (/^[A-Z][a-zA-Z0-9]*$/.test(column.name)) {
        columnConventions.PascalCase++;
      } else {
        columnConventions.other++;
      }
    });
  });

  // Determine dominant conventions
  const dominantTableConvention = Object.entries(tableConventions).reduce(
    (a, b) => (a[1] > b[1] ? a : b)
  )[0];

  const dominantColumnConvention = Object.entries(columnConventions).reduce(
    (a, b) => (a[1] > b[1] ? a : b)
  )[0];

  // Check for inconsistent table naming
  tables.forEach((table) => {
    let tableConvention = "other";

    if (/^[a-z][a-z0-9_]*$/.test(table.tableName)) {
      tableConvention = "snake_case";
    } else if (/^[a-z][a-zA-Z0-9]*$/.test(table.tableName)) {
      tableConvention = "camelCase";
    } else if (/^[A-Z][a-zA-Z0-9]*$/.test(table.tableName)) {
      tableConvention = "PascalCase";
    }

    if (
      tableConvention !== dominantTableConvention &&
      dominantTableConvention !== "other"
    ) {
      suggestions.push({
        id: `naming-table-${table.tableName}-${Date.now()}`,
        type: "naming_consistency",
        priority: "low",
        tableName: table.tableName,
        description: `Table name ${table.tableName} doesn't follow the dominant ${dominantTableConvention} convention`,
        reason: `Consistent naming improves readability and maintainability`,
      });
    }

    // Check for inconsistent column naming
    table.columns.forEach((column) => {
      let columnConvention = "other";

      if (/^[a-z][a-z0-9_]*$/.test(column.name)) {
        columnConvention = "snake_case";
      } else if (/^[a-z][a-zA-Z0-9]*$/.test(column.name)) {
        columnConvention = "camelCase";
      } else if (/^[A-Z][a-zA-Z0-9]*$/.test(column.name)) {
        columnConvention = "PascalCase";
      }

      if (
        columnConvention !== dominantColumnConvention &&
        dominantColumnConvention !== "other"
      ) {
        suggestions.push({
          id: `naming-column-${table.tableName}-${column.name}-${Date.now()}`,
          type: "naming_consistency",
          priority: "low",
          tableName: table.tableName,
          columnName: column.name,
          description: `Column name ${column.name} doesn't follow the dominant ${dominantColumnConvention} convention`,
          reason: `Consistent naming improves readability and maintainability`,
        });
      }
    });
  });

  return suggestions;
}

function checkForDataTypeOptimizations(
  diagram: DiagramState
): SchemaSuggestion[] {
  const suggestions: SchemaSuggestion[] = [];
  const tables = diagram.nodes.map((n) => n.data);

  tables.forEach((table) => {
    table.columns.forEach((column) => {
      // Check for potentially oversized VARCHAR columns
      if (column.type === "VARCHAR" && column.length && column.length > 1000) {
        suggestions.push({
          id: `datatype-varchar-${table.tableName}-${
            column.name
          }-${Date.now()}`,
          type: "data_type_optimization",
          priority: "medium",
          tableName: table.tableName,
          columnName: column.name,
          description: `Consider using TEXT instead of VARCHAR(${column.length}) for column ${column.name}`,
          reason: `For very long strings, TEXT is often more appropriate than VARCHAR with a large length`,
        });
      }

      // Check for boolean values stored as INT
      if (
        column.type === "INT" &&
        (column.name.toLowerCase().startsWith("is_") ||
          column.name.toLowerCase().startsWith("has_") ||
          column.name.toLowerCase() === "active" ||
          column.name.toLowerCase() === "enabled" ||
          column.name.toLowerCase() === "deleted")
      ) {
        suggestions.push({
          id: `datatype-boolean-${table.tableName}-${
            column.name
          }-${Date.now()}`,
          type: "data_type_optimization",
          priority: "low",
          tableName: table.tableName,
          columnName: column.name,
          description: `Consider using BOOLEAN instead of INT for column ${column.name}`,
          reason: `Column name suggests a boolean value, which can be more clearly represented using a BOOLEAN type`,
        });
      }

      // Check for potentially unnecessary precision in DECIMAL columns
      if (
        column.type === "DECIMAL" &&
        column.name.toLowerCase().includes("price")
      ) {
        suggestions.push({
          id: `datatype-decimal-${table.tableName}-${
            column.name
          }-${Date.now()}`,
          type: "data_type_optimization",
          priority: "low",
          tableName: table.tableName,
          columnName: column.name,
          description: `Ensure DECIMAL(10,2) precision for price column ${column.name}`,
          reason: `Price columns typically need specific precision (e.g., DECIMAL(10,2)) to handle currency correctly`,
        });
      }
    });
  });

  return suggestions;
}

function checkForMissingTimestamps(diagram: DiagramState): SchemaSuggestion[] {
  const suggestions: SchemaSuggestion[] = [];
  const tables = diagram.nodes.map((n) => n.data);

  tables.forEach((table) => {
    // Check for created_at timestamp
    const hasCreatedAt = table.columns.some(
      (col) =>
        (col.name.toLowerCase() === "created_at" ||
          col.name.toLowerCase() === "createdat" ||
          col.name.toLowerCase() === "creation_date") &&
        (col.type === "TIMESTAMP" || col.type === "DATE")
    );

    if (!hasCreatedAt) {
      suggestions.push({
        id: `timestamp-created-${table.tableName}-${Date.now()}`,
        type: "missing_timestamp",
        priority: "medium",
        tableName: table.tableName,
        description: `Consider adding a created_at TIMESTAMP column to ${table.tableName}`,
        reason: `Tracking row creation time is valuable for auditing and data analysis`,
        action: `ALTER TABLE ${table.tableName} ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;`,
      });
    }

    // Check for updated_at timestamp
    const hasUpdatedAt = table.columns.some(
      (col) =>
        (col.name.toLowerCase() === "updated_at" ||
          col.name.toLowerCase() === "updatedat" ||
          col.name.toLowerCase() === "last_updated") &&
        (col.type === "TIMESTAMP" || col.type === "DATE")
    );

    if (!hasUpdatedAt) {
      suggestions.push({
        id: `timestamp-updated-${table.tableName}-${Date.now()}`,
        type: "missing_timestamp",
        priority: "low",
        tableName: table.tableName,
        description: `Consider adding an updated_at TIMESTAMP column to ${table.tableName}`,
        reason: `Tracking when rows are updated is useful for troubleshooting and auditing`,
        action: `ALTER TABLE ${table.tableName} ADD COLUMN updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP;`,
      });
    }
  });

  return suggestions;
}

function checkForMissingConstraints(diagram: DiagramState): SchemaSuggestion[] {
  const suggestions: SchemaSuggestion[] = [];
  const tables = diagram.nodes.map((n) => n.data);

  tables.forEach((table) => {
    // Check for primary key
    const hasPrimaryKey = table.columns.some((col) => col.isPrimaryKey);

    if (!hasPrimaryKey) {
      suggestions.push({
        id: `constraint-pk-${table.tableName}-${Date.now()}`,
        type: "missing_constraints",
        priority: "high",
        tableName: table.tableName,
        description: `Table ${table.tableName} is missing a primary key`,
        reason: `Primary keys ensure row uniqueness and improve query performance`,
      });
    }

    // Check for non-nullable columns that should be nullable
    table.columns.forEach((column) => {
      if (
        !column.isNullable &&
        !column.isPrimaryKey &&
        column.name.toLowerCase() !== "created_at" &&
        (column.name.toLowerCase() === "description" ||
          column.name.toLowerCase() === "notes" ||
          column.name.toLowerCase() === "comments" ||
          column.name.toLowerCase() === "bio" ||
          column.name.toLowerCase() === "address" ||
          column.name.toLowerCase() === "middle_name")
      ) {
        suggestions.push({
          id: `constraint-nullable-${table.tableName}-${
            column.name
          }-${Date.now()}`,
          type: "missing_constraints",
          priority: "low",
          tableName: table.tableName,
          columnName: column.name,
          description: `Consider making ${column.name} nullable`,
          reason: `Columns like descriptions, notes, and optional personal information are typically nullable`,
          action: `ALTER TABLE ${table.tableName} MODIFY ${column.name} ${column.type} NULL;`,
        });
      }
    });

    // Check for email columns without constraints
    const emailColumns = table.columns.filter(
      (col) =>
        col.name.toLowerCase().includes("email") && col.type === "VARCHAR"
    );

    emailColumns.forEach((emailCol) => {
      if (!emailCol.isUnique) {
        suggestions.push({
          id: `constraint-email-unique-${table.tableName}-${
            emailCol.name
          }-${Date.now()}`,
          type: "missing_constraints",
          priority: "medium",
          tableName: table.tableName,
          columnName: emailCol.name,
          description: `Consider adding a UNIQUE constraint to email column ${emailCol.name}`,
          reason: `Email addresses are typically unique per user`,
          action: `ALTER TABLE ${table.tableName} ADD CONSTRAINT uq_${table.tableName}_${emailCol.name} UNIQUE (${emailCol.name});`,
        });
      }

      // Check for check constraint on email format
      const hasCheckConstraint = emailCol.constraints?.some(
        (c) =>
          c.type === "CHECK" && c.expression?.toLowerCase().includes("email")
      );

      if (!hasCheckConstraint) {
        suggestions.push({
          id: `constraint-email-check-${table.tableName}-${
            emailCol.name
          }-${Date.now()}`,
          type: "missing_constraints",
          priority: "low",
          tableName: table.tableName,
          columnName: emailCol.name,
          description: `Consider adding a CHECK constraint for email format on ${emailCol.name}`,
          reason: `Validating email format at the database level can prevent invalid data`,
          action: `ALTER TABLE ${table.tableName} ADD CONSTRAINT chk_${table.tableName}_${emailCol.name} CHECK (${emailCol.name} ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');`,
        });
      }
    });
  });

  return suggestions;
}

function checkForSecurityConcerns(diagram: DiagramState): SchemaSuggestion[] {
  const suggestions: SchemaSuggestion[] = [];
  const tables = diagram.nodes.map((n) => n.data);

  tables.forEach((table) => {
    // Check for plain password columns
    const passwordColumns = table.columns.filter(
      (col) =>
        (col.name.toLowerCase() === "password" ||
          col.name.toLowerCase() === "user_password" ||
          col.name.toLowerCase() === "pass") &&
        col.type === "VARCHAR"
    );

    passwordColumns.forEach((pwdCol) => {
      suggestions.push({
        id: `security-password-${table.tableName}-${pwdCol.name}-${Date.now()}`,
        type: "security_concern",
        priority: "high",
        tableName: table.tableName,
        columnName: pwdCol.name,
        description: `Rename ${pwdCol.name} to password_hash to clarify that it should store hashed values`,
        reason: `Storing plain passwords is a security risk; column names should reinforce that only hashed values are stored`,
      });
    });

    // Check for credit card columns
    const creditCardColumns = table.columns.filter(
      (col) =>
        (col.name.toLowerCase().includes("credit_card") ||
          col.name.toLowerCase().includes("creditcard") ||
          col.name.toLowerCase().includes("card_number") ||
          col.name.toLowerCase().includes("cardnumber")) &&
        col.type === "VARCHAR"
    );

    creditCardColumns.forEach((ccCol) => {
      suggestions.push({
        id: `security-cc-${table.tableName}-${ccCol.name}-${Date.now()}`,
        type: "security_concern",
        priority: "high",
        tableName: table.tableName,
        columnName: ccCol.name,
        description: `Consider tokenizing credit card data or storing only last 4 digits`,
        reason: `Storing full credit card numbers poses security risks and may violate PCI compliance requirements`,
      });
    });

    // Check for sensitive data columns
    const sensitiveColumns = table.columns.filter(
      (col) =>
        (col.name.toLowerCase().includes("ssn") ||
          col.name.toLowerCase().includes("social_security") ||
          col.name.toLowerCase().includes("passport") ||
          col.name.toLowerCase().includes("tax_id")) &&
        col.type === "VARCHAR"
    );

    sensitiveColumns.forEach((senCol) => {
      suggestions.push({
        id: `security-sensitive-${table.tableName}-${
          senCol.name
        }-${Date.now()}`,
        type: "security_concern",
        priority: "high",
        tableName: table.tableName,
        columnName: senCol.name,
        description: `Consider encrypting or hashing sensitive data in ${senCol.name}`,
        reason: `Sensitive personal identifiers should be encrypted or hashed for security`,
      });
    });
  });

  return suggestions;
}

// More advanced relationship suggestions beyond the basic ones in sqlGenerator.ts
export function suggestAdvancedRelationships(
  diagram: DiagramState
): RelationshipSuggestion[] {
  const suggestions: RelationshipSuggestion[] = [];
  const tables = diagram.nodes.map((n) => n.data);

  // Look for potentially missing many-to-many relationships
  for (let i = 0; i < tables.length; i++) {
    for (let j = i + 1; j < tables.length; j++) {
      const table1 = tables[i];
      const table2 = tables[j];

      // For each pair of tables, see if they might need a join table
      const table1IsSingular = !table1.tableName.endsWith("s");
      const table2IsSingular = !table2.tableName.endsWith("s");

      // If both tables have plural names, they might need a many-to-many
      if (!table1IsSingular && !table2IsSingular) {
        // Check if a join table already exists
        const joinTable1Name = `${table1.tableName.slice(0, -1)}_${
          table2.tableName
        }`;
        const joinTable2Name = `${table2.tableName.slice(0, -1)}_${
          table1.tableName
        }`;
        const joinTable3Name = `${table1.tableName}_${table2.tableName}`;

        const joinTableExists = tables.some(
          (t) =>
            t.tableName === joinTable1Name ||
            t.tableName === joinTable2Name ||
            t.tableName === joinTable3Name
        );

        if (!joinTableExists) {
          // Check if there are existing relationships between these tables
          const hasRelationship = diagram.edges.some((edge) => {
            const sourceNode = diagram.nodes.find((n) => n.id === edge.source);
            const targetNode = diagram.nodes.find((n) => n.id === edge.target);

            return (
              (sourceNode?.data.tableName === table1.tableName &&
                targetNode?.data.tableName === table2.tableName) ||
              (sourceNode?.data.tableName === table2.tableName &&
                targetNode?.data.tableName === table1.tableName)
            );
          });

          if (!hasRelationship) {
            suggestions.push({
              sourceTable: table1.tableName,
              targetTable: table2.tableName,
              relationshipType: "many-to-many",
              confidence: 0.6,
              reason: `Tables with plural names '${table1.tableName}' and '${table2.tableName}' often have a many-to-many relationship. Consider creating a join table.`,
            });
          }
        }
      }
    }
  }

  // Look for missing one-to-many relationships based on entity names
  for (const table of tables) {
    // Check if table name contains an entity name that could be related
    const tableNameWords = table.tableName.toLowerCase().split(/[_\s]+/);

    for (const otherTable of tables) {
      if (otherTable.id === table.id) continue;

      const otherTableName = otherTable.tableName.toLowerCase();

      // Check if any word in the table name appears in another table name
      for (const word of tableNameWords) {
        if (word.length <= 2) continue; // Skip short words

        if (
          otherTableName === word ||
          otherTableName === `${word}s` ||
          otherTableName === `${word}_table` ||
          otherTableName.startsWith(`${word}_`) ||
          otherTableName.endsWith(`_${word}`)
        ) {
          // Check if a relationship already exists
          const hasRelationship = diagram.edges.some((edge) => {
            const sourceNode = diagram.nodes.find((n) => n.id === edge.source);
            const targetNode = diagram.nodes.find((n) => n.id === edge.target);

            return (
              (sourceNode?.data.tableName === table.tableName &&
                targetNode?.data.tableName === otherTable.tableName) ||
              (sourceNode?.data.tableName === otherTable.tableName &&
                targetNode?.data.tableName === table.tableName)
            );
          });

          // Check if there's an existing foreign key
          const hasForeignKey =
            table.columns.some(
              (col) =>
                col.isForeignKey && col.referencesTable === otherTable.tableName
            ) ||
            otherTable.columns.some(
              (col) =>
                col.isForeignKey && col.referencesTable === table.tableName
            );

          if (!hasRelationship && !hasForeignKey) {
            suggestions.push({
              sourceTable: otherTable.tableName,
              targetTable: table.tableName,
              relationshipType: "one-to-many",
              confidence: 0.5,
              reason: `Tables '${otherTable.tableName}' and '${table.tableName}' appear to be related based on naming patterns. Consider adding a foreign key.`,
            });
          }

          break;
        }
      }
    }
  }

  return suggestions;
}

// Provide optimization recommendations for schema
export function suggestSchemaOptimizations(
  diagram: DiagramState
): SchemaSuggestion[] {
  const suggestions: SchemaSuggestion[] = [];
  const tables = diagram.nodes.map((n) => n.data);

  // Check for tables with no foreign keys (potential islands)
  tables.forEach((table) => {
    const hasForeignKeys = table.columns.some((col) => col.isForeignKey);
    const isReferencedByOthers = tables.some(
      (t) =>
        t.id !== table.id &&
        t.columns.some(
          (col) => col.isForeignKey && col.referencesTable === table.tableName
        )
    );

    if (!hasForeignKeys && !isReferencedByOthers) {
      suggestions.push({
        id: `optimization-island-${table.tableName}-${Date.now()}`,
        type: "normalization_issue",
        priority: "medium",
        tableName: table.tableName,
        description: `Table ${table.tableName} is isolated with no relationships to other tables`,
        reason: `Isolated tables may indicate missing relationships or a need to integrate this entity with the rest of the data model`,
      });
    }
  });

  // Check for potential composite indexes
  tables.forEach((table) => {
    // Look for typical composite index patterns
    // Example: Columns often queried together
    const foreignKeys = table.columns.filter((col) => col.isForeignKey);

    // If a table has multiple foreign keys, they might benefit from a composite index
    if (foreignKeys.length >= 2) {
      const fkNames = foreignKeys.map((fk) => fk.name).join(", ");

      suggestions.push({
        id: `optimization-composite-index-${table.tableName}-${Date.now()}`,
        type: "index_opportunity",
        priority: "medium",
        tableName: table.tableName,
        description: `Consider adding a composite index on foreign keys: ${fkNames}`,
        reason: `Tables with multiple foreign keys often benefit from composite indexes if these columns are frequently queried together`,
        action: `CREATE INDEX idx_${table.tableName}_composite ON ${table.tableName}(${fkNames});`,
      });
    }

    // Look for timestamp + foreign key patterns (common in logs, activity tables)
    const timestampColumns = table.columns.filter(
      (col) => col.type === "TIMESTAMP" || col.type === "DATE"
    );

    if (timestampColumns.length > 0 && foreignKeys.length > 0) {
      // Example: created_at + user_id (common query pattern)
      const timestampCol = timestampColumns.find(
        (col) =>
          col.name.toLowerCase() === "created_at" ||
          col.name.toLowerCase() === "timestamp" ||
          col.name.toLowerCase() === "date"
      );

      if (timestampCol) {
        foreignKeys.forEach((fk) => {
          suggestions.push({
            id: `optimization-ts-fk-index-${table.tableName}-${
              timestampCol.name
            }-${fk.name}-${Date.now()}`,
            type: "index_opportunity",
            priority: "medium",
            tableName: table.tableName,
            description: `Consider adding a composite index on ${timestampCol.name} and ${fk.name}`,
            reason: `Timestamp + foreign key combinations are frequently used in filtering and sorting operations`,
            action: `CREATE INDEX idx_${table.tableName}_${timestampCol.name}_${fk.name} ON ${table.tableName}(${fk.name}, ${timestampCol.name});`,
          });
        });
      }
    }
  });

  return suggestions;
}
