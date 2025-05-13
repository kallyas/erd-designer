// src/utils/exportManager.ts
import { DiagramState } from "@/types";
import { generateSQL } from "@/utils/sqlGenerator";

export type ExportFormat = "sql" | "png" | "pdf" | "json" | "orm";
export type OrmType =
  | "sequelize"
  | "typeorm"
  | "mongoose"
  | "prisma"
  | "sqlalchemy";

export async function exportDiagram(
  diagram: DiagramState,
  format: ExportFormat,
  options?: any
): Promise<string | Blob> {
  switch (format) {
    case "sql":
      return exportSQL(diagram, options?.dialect || "mysql");
    case "png":
      return exportPNG(diagram, options);
    case "pdf":
      return exportPDF(diagram, options);
    case "json":
      return exportJSON(diagram);
    case "orm":
      return exportORM(diagram, options?.orm || "sequelize");
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

function exportSQL(diagram: DiagramState, dialect: string): string {
  return generateSQL(diagram, dialect);
}

async function exportPNG(diagram: DiagramState, options?: any): Promise<Blob> {
  // Assuming you have a reference to the ReactFlow instance
  if (!options?.reactFlowInstance) {
    throw new Error("ReactFlow instance is required for PNG export");
  }

  try {
    const reactFlowInstance = options.reactFlowInstance;

    // Get the viewport dimensions
    const { width, height } = reactFlowInstance.getViewport();

    // Create a new canvas with the dimensions of the diagram
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    // Set the canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Draw a white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Get the SVG element from ReactFlow
    const svgElement = reactFlowInstance.toSVG();
    if (!svgElement) throw new Error("Could not generate SVG from ReactFlow");

    // Convert SVG to a data URL
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create an image from the SVG
    const img = new Image();

    // Return a promise that resolves with the blob
    return new Promise<Blob>((resolve, reject) => {
      img.onload = () => {
        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to convert canvas to blob"));
          }
        }, "image/png");

        // Clean up
        URL.revokeObjectURL(svgUrl);
      };

      img.onerror = () => {
        reject(new Error("Failed to load SVG as image"));
        URL.revokeObjectURL(svgUrl);
      };

      img.src = svgUrl;
    });
  } catch (error) {
    console.error("Error exporting to PNG:", error);
    throw error;
  }
}

async function exportPDF(diagram: DiagramState, options?: any): Promise<Blob> {
  // First export to PNG
  const pngBlob = await exportPNG(diagram, options);

  // For PDF generation, you'd typically use a library like jsPDF
  // This is a simplified version without jsPDF

  // Create a basic PDF document with the PNG embedded
  // In a real implementation, you'd use jsPDF or a server-side PDF generator

  // Mock PDF implementation for now
  return new Blob([`%PDF-1.4\n%MOCK PDF WITH DIAGRAM\n`], {
    type: "application/pdf",
  });
}

function exportJSON(diagram: DiagramState): string {
  return JSON.stringify(diagram, null, 2);
}

function exportORM(diagram: DiagramState, ormType: OrmType): string {
  // This would be a relatively complex function to convert diagrams to ORM code
  // Here's a simplified version for Sequelize

  let code = "";

  switch (ormType) {
    case "sequelize":
      code = generateSequelizeModels(diagram);
      break;
    case "typeorm":
      code = generateTypeORMEntities(diagram);
      break;
    case "mongoose":
      code = generateMongooseSchemas(diagram);
      break;
    case "prisma":
      code = generatePrismaSchema(diagram);
      break;
    case "sqlalchemy":
      code = generateSQLAlchemyModels(diagram);
      break;
    default:
      throw new Error(`Unsupported ORM type: ${ormType}`);
  }

  return code;
}

function generateSequelizeModels(diagram: DiagramState): string {
  let code = `const { DataTypes } = require('sequelize');\n\nmodule.exports = (sequelize) => {\n`;

  // Define models
  diagram.nodes.forEach((node) => {
    const table = node.data;
    code += `  const ${pascalCase(table.tableName)} = sequelize.define('${
      table.tableName
    }', {\n`;

    // Add columns
    table.columns.forEach((column) => {
      const dataType = mapToSequelizeType(column.type, column.length);

      code += `    ${column.name}: {\n`;
      code += `      type: ${dataType},\n`;

      if (column.isPrimaryKey) {
        code += `      primaryKey: true,\n`;
      }

      if (column.isNullable === false) {
        code += `      allowNull: false,\n`;
      }

      if (column.isUnique) {
        code += `      unique: true,\n`;
      }

      // Add any other constraints
      if (column.constraints?.length) {
        column.constraints.forEach((constraint) => {
          if (constraint.type === "DEFAULT" && constraint.defaultValue) {
            code += `      defaultValue: ${formatDefaultValue(
              constraint.defaultValue,
              column.type
            )},\n`;
          }
        });
      }

      code += `    },\n`;
    });

    code += `  }, {\n    tableName: '${table.tableName}',\n`;

    if (table.schema && table.schema !== "public") {
      code += `    schema: '${table.schema}',\n`;
    }

    code += `    timestamps: true\n  });\n\n`;
  });

  // Define associations
  code += `  // Define associations\n`;
  code += `  const models = sequelize.models;\n\n`;

  // For each foreign key, create an association
  diagram.nodes.forEach((node) => {
    const table = node.data;
    const fkColumns = table.columns.filter(
      (col) => col.isForeignKey && col.referencesTable
    );

    fkColumns.forEach((fk) => {
      const sourceModel = pascalCase(fk.referencesTable!);
      const targetModel = pascalCase(table.tableName);

      code += `  models.${sourceModel}.hasMany(models.${targetModel}, { foreignKey: '${fk.name}' });\n`;
      code += `  models.${targetModel}.belongsTo(models.${sourceModel}, { foreignKey: '${fk.name}' });\n\n`;
    });
  });

  code += `  return sequelize.models;\n};\n`;

  return code;
}

function generateTypeORMEntities(diagram: DiagramState): string {
  let code = "";

  diagram.nodes.forEach((node) => {
    const table = node.data;

    code += `import { Entity, Column, PrimaryGeneratedColumn`;

    // Import relationship decorators if needed
    const hasForeignKeys = table.columns.some((col) => col.isForeignKey);
    if (hasForeignKeys) {
      code += `, ManyToOne, OneToMany, JoinColumn`;
    }

    code += ` } from 'typeorm';\n\n`;

    // Import related entities
    const referencedTables = new Set<string>();
    table.columns.forEach((col) => {
      if (col.isForeignKey && col.referencesTable) {
        referencedTables.add(col.referencesTable);
      }
    });

    referencedTables.forEach((refTable) => {
      code += `import { ${pascalCase(
        refTable
      )} } from './${refTable}.entity';\n`;
    });

    if (referencedTables.size > 0) {
      code += `\n`;
    }

    // Define entity
    code += `@Entity({ name: '${table.tableName}'`;
    if (table.schema && table.schema !== "public") {
      code += `, schema: '${table.schema}'`;
    }
    code += ` })\n`;
    code += `export class ${pascalCase(table.tableName)} {\n`;

    // Add columns
    table.columns.forEach((column) => {
      if (column.isPrimaryKey) {
        code += `  @PrimaryGeneratedColumn()\n`;
      } else if (column.isForeignKey && column.referencesTable) {
        // Skip for now, we'll add relationships later
      } else {
        code += `  @Column({\n`;

        const typeormType = mapToTypeORMType(column.type, column.length);
        code += `    type: ${typeormType},\n`;

        if (column.isNullable === false) {
          code += `    nullable: false,\n`;
        }

        if (column.isUnique) {
          code += `    unique: true,\n`;
        }

        // Add other constraints
        column.constraints?.forEach((constraint) => {
          if (constraint.type === "DEFAULT" && constraint.defaultValue) {
            code += `    default: ${formatDefaultValue(
              constraint.defaultValue,
              column.type
            )},\n`;
          }
        });

        code += `  })\n`;
      }

      code += `  ${column.name}: ${mapToTypeScriptType(column.type)};\n\n`;
    });

    // Add relationships
    table.columns
      .filter((col) => col.isForeignKey && col.referencesTable)
      .forEach((fk) => {
        code += `  @ManyToOne(() => ${pascalCase(
          fk.referencesTable!
        )}, ${camelCase(fk.referencesTable!)} => ${camelCase(
          fk.referencesTable!
        )}.${camelCase(table.tableName)}s)\n`;
        code += `  @JoinColumn({ name: '${fk.name}' })\n`;
        code += `  ${camelCase(fk.referencesTable!)}: ${pascalCase(
          fk.referencesTable!
        )};\n\n`;
      });

    code += `}\n\n`;
  });

  return code;
}

function generateMongooseSchemas(diagram: DiagramState): string {
  let code = `const mongoose = require('mongoose');\nconst { Schema } = mongoose;\n\n`;

  diagram.nodes.forEach((node) => {
    const table = node.data;

    code += `const ${camelCase(table.tableName)}Schema = new Schema({\n`;

    // Add fields
    table.columns.forEach((column) => {
      const mongooseType = mapToMongooseType(column.type);

      code += `  ${column.name}: {\n`;
      code += `    type: ${mongooseType},\n`;

      if (column.isNullable === false) {
        code += `    required: true,\n`;
      }

      if (column.isUnique) {
        code += `    unique: true,\n`;
      }

      // References for foreign keys
      if (column.isForeignKey && column.referencesTable) {
        code += `    ref: '${pascalCase(column.referencesTable)}',\n`;
      }

      // Default values
      column.constraints?.forEach((constraint) => {
        if (constraint.type === "DEFAULT" && constraint.defaultValue) {
          code += `    default: ${formatDefaultValue(
            constraint.defaultValue,
            column.type
          )},\n`;
        }
      });

      code += `  },\n`;
    });

    // Add timestamps
    code += `}, {\n  timestamps: true\n});\n\n`;

    // Create and export model
    code += `const ${pascalCase(
      table.tableName
    )} = mongoose.model('${pascalCase(table.tableName)}', ${camelCase(
      table.tableName
    )}Schema);\n`;
    code += `module.exports = ${pascalCase(table.tableName)};\n\n`;
  });

  return code;
}

function generatePrismaSchema(diagram: DiagramState): string {
  let code = `// This is your Prisma schema file\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\n`;

  // Add data source
  code += `datasource db {\n  provider = "postgresql" // Change to your database provider\n  url      = env("DATABASE_URL")\n}\n\n`;

  // Define models
  diagram.nodes.forEach((node) => {
    const table = node.data;

    code += `model ${pascalCase(table.tableName)} {\n`;

    // Add fields
    table.columns.forEach((column) => {
      const prismaType = mapToPrismaType(column.type, column.length);

      code += `  ${column.name} ${prismaType}`;

      // Add modifiers
      if (column.isPrimaryKey) {
        code += ` @id`;
      }

      if (column.isUnique) {
        code += ` @unique`;
      }

      // Foreign key references
      if (column.isForeignKey && column.referencesTable) {
        code += ` @relation(fields: [${column.name}], references: [${column.referencesColumn}])`;
      }

      // Default values
      column.constraints?.forEach((constraint) => {
        if (constraint.type === "DEFAULT" && constraint.defaultValue) {
          const defaultValue = formatPrismaDefaultValue(
            constraint.defaultValue,
            column.type
          );
          code += ` @default(${defaultValue})`;
        }
      });

      code += `\n`;
    });

    // Add relation fields
    // Find tables that reference this table
    const relatedTables = diagram.nodes.filter((otherNode) =>
      otherNode.data.columns.some(
        (col) => col.isForeignKey && col.referencesTable === table.tableName
      )
    );

    if (relatedTables.length > 0) {
      code += `\n  // Relations\n`;

      relatedTables.forEach((relatedNode) => {
        const relatedTable = relatedNode.data;
        const relatedColumn = relatedTable.columns.find(
          (col) => col.isForeignKey && col.referencesTable === table.tableName
        );

        if (relatedColumn) {
          code += `  ${camelCase(relatedTable.tableName)}s ${pascalCase(
            relatedTable.tableName
          )}[]\n`;
        }
      });
    }

    code += `}\n\n`;
  });

  return code;
}

function generateSQLAlchemyModels(diagram: DiagramState): string {
  let code = `from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, create_engine\n`;
  code += `from sqlalchemy.ext.declarative import declarative_base\n`;
  code += `from sqlalchemy.orm import relationship\n\n`;

  code += `Base = declarative_base()\n\n`;

  // Define models
  diagram.nodes.forEach((node) => {
    const table = node.data;

    code += `class ${pascalCase(table.tableName)}(Base):\n`;
    code += `    __tablename__ = '${table.tableName}'\n`;

    if (table.schema && table.schema !== "public") {
      code += `    __table_args__ = {'schema': '${table.schema}'}\n`;
    }

    code += `\n`;

    // Add columns
    table.columns.forEach((column) => {
      const sqlalchemyType = mapToSQLAlchemyType(column.type, column.length);

      code += `    ${column.name} = Column(${sqlalchemyType}`;

      // Add attributes
      if (column.isPrimaryKey) {
        code += `, primary_key=True`;
      }

      if (column.isNullable === false && !column.isPrimaryKey) {
        code += `, nullable=False`;
      }

      if (column.isUnique) {
        code += `, unique=True`;
      }

      // Foreign key references
      if (
        column.isForeignKey &&
        column.referencesTable &&
        column.referencesColumn
      ) {
        code += `, ForeignKey('${column.referencesTable}.${column.referencesColumn}')`;
      }

      // Default values
      column.constraints?.forEach((constraint) => {
        if (constraint.type === "DEFAULT" && constraint.defaultValue) {
          const defaultValue = formatSQLAlchemyDefaultValue(
            constraint.defaultValue,
            column.type
          );
          code += `, default=${defaultValue}`;
        }
      });

      code += `)\n`;
    });

    // Add relationships
    const relationshipCode: string[] = [];

    // Relationships for foreign keys in this table
    table.columns
      .filter((col) => col.isForeignKey && col.referencesTable)
      .forEach((fk) => {
        relationshipCode.push(
          `    ${camelCase(fk.referencesTable!)} = relationship("${pascalCase(
            fk.referencesTable!
          )}")`
        );
      });

    // Reverse relationships from other tables to this one
    diagram.nodes.forEach((otherNode) => {
      if (otherNode.id === node.id) return;

      otherNode.data.columns
        .filter(
          (col) => col.isForeignKey && col.referencesTable === table.tableName
        )
        .forEach((fk) => {
          relationshipCode.push(
            `    ${camelCase(
              otherNode.data.tableName
            )}s = relationship("${pascalCase(
              otherNode.data.tableName
            )}", back_populates="${camelCase(table.tableName)}")`
          );
        });
    });

    if (relationshipCode.length > 0) {
      code += `\n    # Relationships\n`;
      code += relationshipCode.join("\n") + "\n";
    }

    code += `\n`;
  });

  return code;
}

// Helper functions
function pascalCase(str: string): string {
  return str
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function camelCase(str: string): string {
  const pascal = pascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// Type mapping functions
function mapToSequelizeType(type: string, length?: number): string {
  switch (type) {
    case "INT":
      return "DataTypes.INTEGER";
    case "VARCHAR":
      return `DataTypes.STRING${length ? `(${length})` : ""}`;
    case "TEXT":
      return "DataTypes.TEXT";
    case "BOOLEAN":
      return "DataTypes.BOOLEAN";
    case "DATE":
      return "DataTypes.DATEONLY";
    case "TIMESTAMP":
      return "DataTypes.DATE";
    case "FLOAT":
      return "DataTypes.FLOAT";
    case "DOUBLE":
      return "DataTypes.DOUBLE";
    case "DECIMAL":
      return "DataTypes.DECIMAL";
    case "JSON":
      return "DataTypes.JSON";
    case "UUID":
      return "DataTypes.UUID";
    case "ENUM":
      return "DataTypes.ENUM";
    default:
      return "DataTypes.STRING";
  }
}

function mapToTypeORMType(type: string, length?: number): string {
  switch (type) {
    case "INT":
      return '"int"';
    case "VARCHAR":
      return `"varchar", { length: ${length || 255} }`;
    case "TEXT":
      return '"text"';
    case "BOOLEAN":
      return '"boolean"';
    case "DATE":
      return '"date"';
    case "TIMESTAMP":
      return '"timestamp"';
    case "FLOAT":
      return '"float"';
    case "DOUBLE":
      return '"double"';
    case "DECIMAL":
      return '"decimal"';
    case "JSON":
      return '"json"';
    case "UUID":
      return '"uuid"';
    case "ENUM":
      return '"enum"';
    default:
      return '"varchar"';
  }
}

function mapToTypeScriptType(type: string): string {
  switch (type) {
    case "INT":
      return "number";
    case "VARCHAR":
      return "string";
    case "TEXT":
      return "string";
    case "BOOLEAN":
      return "boolean";
    case "DATE":
      return "Date";
    case "TIMESTAMP":
      return "Date";
    case "FLOAT":
      return "number";
    case "DOUBLE":
      return "number";
    case "DECIMAL":
      return "number";
    case "JSON":
      return "any";
    case "UUID":
      return "string";
    case "ENUM":
      return "string";
    default:
      return "string";
  }
}

function mapToMongooseType(type: string): string {
  switch (type) {
    case "INT":
      return "Number";
    case "VARCHAR":
      return "String";
    case "TEXT":
      return "String";
    case "BOOLEAN":
      return "Boolean";
    case "DATE":
      return "Date";
    case "TIMESTAMP":
      return "Date";
    case "FLOAT":
      return "Number";
    case "DOUBLE":
      return "Number";
    case "DECIMAL":
      return "Number";
    case "JSON":
      return "Object";
    case "UUID":
      return "String";
    case "ENUM":
      return "String";
    default:
      return "String";
  }
}

function mapToPrismaType(type: string, length?: number): string {
  switch (type) {
    case "INT":
      return "Int";
    case "VARCHAR":
      return "String";
    case "TEXT":
      return "String";
    case "BOOLEAN":
      return "Boolean";
    case "DATE":
      return "DateTime";
    case "TIMESTAMP":
      return "DateTime";
    case "FLOAT":
      return "Float";
    case "DOUBLE":
      return "Float";
    case "DECIMAL":
      return "Decimal";
    case "JSON":
      return "Json";
    case "UUID":
      return "String";
    case "ENUM":
      return "String";
    default:
      return "String";
  }
}

function mapToSQLAlchemyType(type: string, length?: number): string {
  switch (type) {
    case "INT":
      return "Integer";
    case "VARCHAR":
      return `String(${length || 255})`;
    case "TEXT":
      return "Text";
    case "BOOLEAN":
      return "Boolean";
    case "DATE":
      return "Date";
    case "TIMESTAMP":
      return "DateTime";
    case "FLOAT":
      return "Float";
    case "DOUBLE":
      return "Float";
    case "DECIMAL":
      return "Numeric";
    case "JSON":
      return "JSON";
    case "UUID":
      return "String(36)";
    case "ENUM":
      return "Enum";
    default:
      return "String";
  }
}

function formatDefaultValue(value: string, type: string): string {
  if (type === "VARCHAR" || type === "TEXT" || type === "ENUM") {
    return `'${value.replace(/'/g, "\\'")}'`;
  }

  if (type === "BOOLEAN") {
    return value.toLowerCase() === "true" ? "true" : "false";
  }

  return value;
}

function formatPrismaDefaultValue(value: string, type: string): string {
  if (type === "VARCHAR" || type === "TEXT" || type === "ENUM") {
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  if (type === "BOOLEAN") {
    return value.toLowerCase() === "true" ? "true" : "false";
  }

  return value;
}

function formatSQLAlchemyDefaultValue(value: string, type: string): string {
  if (type === "VARCHAR" || type === "TEXT" || type === "ENUM") {
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  if (type === "BOOLEAN") {
    return value.toLowerCase() === "true" ? "True" : "False";
  }

  return value;
}
