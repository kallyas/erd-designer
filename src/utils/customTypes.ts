// src/utils/customTypes.ts
import { CustomType, ColumnType } from "@/types";

export interface CustomTypeValidationRule {
  rule: string;
  description: string;
}

export const BUILT_IN_TYPES: Record<
  string,
  {
    baseType: string;
    description: string;
    examples?: string[];
  }
> = {
  INT: {
    baseType: "INT",
    description: "Integer number",
    examples: ["1", "42", "-10"],
  },
  VARCHAR: {
    baseType: "VARCHAR",
    description: "Variable-length character string",
    examples: ["'Hello'", "'user@example.com'"],
  },
  TEXT: {
    baseType: "TEXT",
    description: "Unlimited length text",
    examples: ["'Lorem ipsum...'"],
  },
  BOOLEAN: {
    baseType: "BOOLEAN",
    description: "True/false value",
    examples: ["TRUE", "FALSE"],
  },
  DATE: {
    baseType: "DATE",
    description: "Calendar date (year, month, day)",
    examples: ["'2023-12-31'"],
  },
  TIMESTAMP: {
    baseType: "TIMESTAMP",
    description: "Date and time",
    examples: ["'2023-12-31 23:59:59'"],
  },
  FLOAT: {
    baseType: "FLOAT",
    description: "Floating-point number",
    examples: ["3.14", "-2.5"],
  },
  DOUBLE: {
    baseType: "DOUBLE",
    description: "Double-precision floating-point",
    examples: ["3.14159265359"],
  },
  DECIMAL: {
    baseType: "DECIMAL",
    description: "Fixed precision and scale number",
    examples: ["123.45"],
  },
  JSON: {
    baseType: "JSON",
    description: "JSON data",
    examples: ['\'{"key": "value"}\''],
  },
  UUID: {
    baseType: "UUID",
    description: "Universally unique identifier",
    examples: ["'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'"],
  },
  ENUM: {
    baseType: "ENUM",
    description: "List of predefined values",
    examples: ["'SMALL'", "'MEDIUM'", "'LARGE'"],
  },
  ARRAY: {
    baseType: "ARRAY",
    description: "Array of values (PostgreSQL)",
    examples: ["'{1, 2, 3}'", '\'{"apple", "banana"}\''],
  },
};

export const COMMON_CUSTOM_TYPES: CustomType[] = [
  {
    name: "Email",
    baseType: "VARCHAR",
    description: "Email address",
  },
  {
    name: "URL",
    baseType: "VARCHAR",
    description: "Web URL",
  },
  {
    name: "Phone",
    baseType: "VARCHAR",
    description: "Phone number",
  },
  {
    name: "Currency",
    baseType: "DECIMAL",
    description: "Monetary amount with fixed precision",
  },
  {
    name: "IPAddress",
    baseType: "VARCHAR",
    description: "IP address (v4 or v6)",
  },
  {
    name: "MacAddress",
    baseType: "VARCHAR",
    description: "MAC address",
  },
  {
    name: "Percentage",
    baseType: "DECIMAL",
    description: "Percentage value (0-100)",
  },
];

// Store custom types in local storage
export function saveCustomType(customType: CustomType): void {
  const existingTypes = getCustomTypes();
  const typeIndex = existingTypes.findIndex((t) => t.name === customType.name);

  if (typeIndex === -1) {
    existingTypes.push(customType);
  } else {
    existingTypes[typeIndex] = customType;
  }

  localStorage.setItem("erd-custom-types", JSON.stringify(existingTypes));
}

export function getCustomTypes(): CustomType[] {
  try {
    const typesJson = localStorage.getItem("erd-custom-types");
    if (!typesJson) return [...COMMON_CUSTOM_TYPES];

    return [...COMMON_CUSTOM_TYPES, ...JSON.parse(typesJson)] as CustomType[];
  } catch (error) {
    console.error("Error loading custom types:", error);
    return [...COMMON_CUSTOM_TYPES];
  }
}

export function deleteCustomType(typeName: string): boolean {
  try {
    // Don't allow deleting built-in common types
    if (COMMON_CUSTOM_TYPES.some((t) => t.name === typeName)) {
      return false;
    }

    const types = getCustomTypes().filter(
      (t) => !COMMON_CUSTOM_TYPES.some((ct) => ct.name === t.name)
    );
    const filtered = types.filter((t) => t.name !== typeName);

    if (filtered.length === types.length) {
      return false; // No type was removed
    }

    localStorage.setItem("erd-custom-types", JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Error deleting custom type:", error);
    return false;
  }
}

export function getValidationRulesForType(
  typeName: string
): CustomTypeValidationRule[] {
  const rules: Record<string, CustomTypeValidationRule[]> = {
    Email: [
      {
        rule: "value ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'",
        description: "Must be a valid email address",
      },
    ],
    URL: [
      {
        rule: "value ~ '^https?://[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}(/.*)?$'",
        description: "Must be a valid URL",
      },
    ],
    Phone: [
      {
        rule: "value ~ '^\\+?[0-9\\s-()]{7,20}$'",
        description: "Must be a valid phone number",
      },
    ],
    Currency: [
      {
        rule: "value >= 0",
        description: "Must be non-negative",
      },
    ],
    IPAddress: [
      {
        rule: "value ~ '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$'",
        description: "Must be a valid IPv4 address",
      },
    ],
    Percentage: [
      {
        rule: "value >= 0 AND value <= 100",
        description: "Must be between 0 and 100",
      },
    ],
  };

  return rules[typeName] || [];
}
