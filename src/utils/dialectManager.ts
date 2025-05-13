// src/utils/dialectManager.ts
import { DiagramState, DatabaseDialect } from "@/types";

export const SUPPORTED_DIALECTS: DatabaseDialect[] = [
  { name: "MySQL", key: "mysql", version: "8.0" },
  { name: "PostgreSQL", key: "postgresql", version: "15" },
  { name: "SQL Server", key: "sqlserver", version: "2022" },
  { name: "SQLite", key: "sqlite", version: "3.41" },
  { name: "Oracle", key: "oracle", version: "21c" },
];

export interface DialectFeatures {
  supportsArrays: boolean;
  supportsJson: boolean;
  supportsEnums: boolean;
  supportsUuid: boolean;
  supportsInheritance: boolean;
  maxIdentifierLength: number;
  reservedKeywords: string[];
  validationRules: string[];
}

export const DIALECT_FEATURES: Record<string, DialectFeatures> = {
  mysql: {
    supportsArrays: false,
    supportsJson: true,
    supportsEnums: true,
    supportsUuid: false,
    supportsInheritance: false,
    maxIdentifierLength: 64,
    reservedKeywords: [
      "ADD",
      "ALL",
      "ALTER",
      "ANALYZE",
      "AND",
      "AS",
      "ASC",
      "BEFORE",
    ],
    validationRules: ["numeric_column > 0", "length(string_column) > 5"],
  },
  postgresql: {
    supportsArrays: true,
    supportsJson: true,
    supportsEnums: true,
    supportsUuid: true,
    supportsInheritance: true,
    maxIdentifierLength: 63,
    reservedKeywords: [
      "ALL",
      "ANALYSE",
      "ANALYZE",
      "AND",
      "ANY",
      "ARRAY",
      "AS",
      "ASC",
    ],
    validationRules: [
      "numeric_column > 0",
      "length(string_column) > 5",
      "numeric_column BETWEEN 1 AND 100",
    ],
  },
  sqlserver: {
    supportsArrays: false,
    supportsJson: false,
    supportsEnums: false,
    supportsUuid: true,
    supportsInheritance: false,
    maxIdentifierLength: 128,
    reservedKeywords: [
      "ADD",
      "ALL",
      "ALTER",
      "AND",
      "ANY",
      "AS",
      "ASC",
      "AUTHORIZATION",
    ],
    validationRules: ["numeric_column > 0", "LEN(string_column) > 5"],
  },
  sqlite: {
    supportsArrays: false,
    supportsJson: true,
    supportsEnums: false,
    supportsUuid: false,
    supportsInheritance: false,
    maxIdentifierLength: 1024,
    reservedKeywords: [
      "ABORT",
      "ACTION",
      "ADD",
      "AFTER",
      "ALL",
      "ALTER",
      "ANALYZE",
      "AND",
    ],
    validationRules: ["numeric_column > 0", "length(string_column) > 5"],
  },
  oracle: {
    supportsArrays: false,
    supportsJson: true,
    supportsEnums: false,
    supportsUuid: false,
    supportsInheritance: false,
    maxIdentifierLength: 128,
    reservedKeywords: [
      "ACCESS",
      "ADD",
      "ALL",
      "ALTER",
      "AND",
      "ANY",
      "AS",
      "ASC",
    ],
    validationRules: ["numeric_column > 0", "LENGTH(string_column) > 5"],
  },
};

export function validateIdentifier(name: string, dialect: string): boolean {
  const features = DIALECT_FEATURES[dialect];
  if (!features) return true;

  if (name.length > features.maxIdentifierLength) {
    return false;
  }

  // Check if it's a reserved keyword
  if (features.reservedKeywords.includes(name.toUpperCase())) {
    return false;
  }

  return true;
}

export function getSupportedTypes(dialect: string): string[] {
  const baseTypes = [
    "INT",
    "VARCHAR",
    "TEXT",
    "BOOLEAN",
    "DATE",
    "TIMESTAMP",
    "FLOAT",
    "DOUBLE",
    "DECIMAL",
  ];

  if (DIALECT_FEATURES[dialect]?.supportsJson) {
    baseTypes.push("JSON");
  }

  if (DIALECT_FEATURES[dialect]?.supportsArrays) {
    baseTypes.push("ARRAY");
  }

  if (DIALECT_FEATURES[dialect]?.supportsEnums) {
    baseTypes.push("ENUM");
  }

  if (DIALECT_FEATURES[dialect]?.supportsUuid) {
    baseTypes.push("UUID");
  }

  return baseTypes;
}
