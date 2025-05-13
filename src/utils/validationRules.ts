// src/utils/validationRules.ts
import { TableData, ValidationRule } from "@/types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateDiagram(
  tables: TableData[],
  rules: ValidationRule[]
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
  };

  // Validate table rules
  rules.forEach((rule) => {
    const applicableTables = rule.tables.length
      ? tables.filter((t) => rule.tables.includes(t.tableName))
      : tables;

    applicableTables.forEach((table) => {
      const isValid = evaluateRule(table, rule.rule);
      if (!isValid) {
        result.isValid = false;
        result.errors.push(
          `Table "${table.tableName}" failed validation rule "${rule.name}": ${rule.rule}`
        );
      }
    });
  });

  // Validate standard database constraints
  tables.forEach((table) => {
    // Check for duplicate column names
    const columnNames = table.columns.map((c) => c.name);
    const uniqueNames = new Set(columnNames);
    if (uniqueNames.size < columnNames.length) {
      result.isValid = false;
      result.errors.push(
        `Table "${table.tableName}" has duplicate column names`
      );
    }

    // Ensure primary key exists
    const hasPrimaryKey = table.columns.some((c) => c.isPrimaryKey);
    if (!hasPrimaryKey) {
      result.isValid = false;
      result.errors.push(`Table "${table.tableName}" has no primary key`);
    }

    // Check foreign key references
    table.columns
      .filter(
        (col) => col.isForeignKey && col.referencesTable && col.referencesColumn
      )
      .forEach((fk) => {
        const targetTable = tables.find(
          (t) => t.tableName === fk.referencesTable
        );
        if (!targetTable) {
          result.isValid = false;
          result.errors.push(
            `Foreign key "${fk.name}" in table "${table.tableName}" references non-existent table "${fk.referencesTable}"`
          );
          return;
        }

        const targetColumn = targetTable.columns.find(
          (c) => c.name === fk.referencesColumn
        );
        if (!targetColumn) {
          result.isValid = false;
          result.errors.push(
            `Foreign key "${fk.name}" in table "${table.tableName}" references non-existent column "${fk.referencesColumn}" in table "${fk.referencesTable}"`
          );
          return;
        }

        // Check type compatibility
        if (fk.type !== targetColumn.type) {
          result.isValid = false;
          result.errors.push(
            `Foreign key "${fk.name}" in table "${table.tableName}" has type "${fk.type}" which is incompatible with referenced column type "${targetColumn.type}"`
          );
        }
      });
  });

  return result;
}

function evaluateRule(table: TableData, rule: string): boolean {
  // For simplicity, we'll implement a few basic rules
  // In a full implementation, you'd want to use a rule engine or parser

  try {
    // Handle common rule patterns
    if (rule.includes("has_column")) {
      const columnMatch = rule.match(/has_column\(['"]([^'"]+)['"]\)/);
      if (columnMatch) {
        const columnName = columnMatch[1];
        return table.columns.some((c) => c.name === columnName);
      }
    }

    if (rule.includes("min_columns")) {
      const countMatch = rule.match(/min_columns\((\d+)\)/);
      if (countMatch) {
        const minCount = parseInt(countMatch[1]);
        return table.columns.length >= minCount;
      }
    }

    if (rule.includes("has_column_type")) {
      const typeMatch = rule.match(
        /has_column_type\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/
      );
      if (typeMatch) {
        const columnName = typeMatch[1];
        const typeName = typeMatch[2];
        const column = table.columns.find((c) => c.name === columnName);
        return column ? column.type === typeName : false;
      }
    }

    if (rule.includes("naming_convention")) {
      // Check if table name follows snake_case
      if (rule.includes("snake_case")) {
        return /^[a-z][a-z0-9_]*$/.test(table.tableName);
      }

      // Check if table name follows CamelCase
      if (rule.includes("camel_case")) {
        return /^[A-Z][a-zA-Z0-9]*$/.test(table.tableName);
      }
    }

    return true;
  } catch (error) {
    console.error("Error evaluating rule:", error);
    return false;
  }
}

export function createValidationRule(
  name: string,
  rule: string,
  tables: string[] = [],
  description?: string
): ValidationRule {
  return {
    name,
    rule,
    tables,
    description,
  };
}

export const COMMON_VALIDATION_RULES: ValidationRule[] = [
  {
    name: "PK Required",
    rule: "has_primary_key",
    tables: [],
    description: "Every table must have a primary key",
  },
  {
    name: "ID Column",
    rule: "has_column('id')",
    tables: [],
    description: "Every table should have an 'id' column",
  },
  {
    name: "Created At",
    rule: "has_column('created_at')",
    tables: [],
    description: "Every table should have a 'created_at' timestamp",
  },
  {
    name: "Updated At",
    rule: "has_column('updated_at')",
    tables: [],
    description: "Every table should have an 'updated_at' timestamp",
  },
  {
    name: "Snake Case Naming",
    rule: "naming_convention('snake_case')",
    tables: [],
    description: "Table names should follow snake_case naming convention",
  },
];
