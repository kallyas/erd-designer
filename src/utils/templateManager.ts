// src/utils/templateManager.ts
import {
  TableTemplate,
  TableData,
  DiagramState,
  RelationshipEdge,
} from "@/types";

export const COMMON_TEMPLATES: TableTemplate[] = [
  {
    name: "User Authentication",
    description: "Basic user authentication tables",
    tables: [
      {
        id: "table-users",
        tableName: "users",
        columns: [
          {
            id: "col-users-id",
            name: "id",
            type: "INT",
            isPrimaryKey: true,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-users-username",
            name: "username",
            type: "VARCHAR",
            length: 50,
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            isUnique: true,
          },
          {
            id: "col-users-email",
            name: "email",
            type: "VARCHAR",
            length: 255,
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            isUnique: true,
          },
          {
            id: "col-users-password",
            name: "password_hash",
            type: "VARCHAR",
            length: 255,
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-users-created",
            name: "created_at",
            type: "TIMESTAMP",
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-users-updated",
            name: "updated_at",
            type: "TIMESTAMP",
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: true,
          },
        ],
      },
      {
        id: "table-roles",
        tableName: "roles",
        columns: [
          {
            id: "col-roles-id",
            name: "id",
            type: "INT",
            isPrimaryKey: true,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-roles-name",
            name: "name",
            type: "VARCHAR",
            length: 50,
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            isUnique: true,
          },
          {
            id: "col-roles-created",
            name: "created_at",
            type: "TIMESTAMP",
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
          },
        ],
      },
      {
        id: "table-user-roles",
        tableName: "user_roles",
        columns: [
          {
            id: "col-user-roles-id",
            name: "id",
            type: "INT",
            isPrimaryKey: true,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-user-roles-user",
            name: "user_id",
            type: "INT",
            isPrimaryKey: false,
            isForeignKey: true,
            isNullable: false,
            referencesTable: "users",
            referencesColumn: "id",
          },
          {
            id: "col-user-roles-role",
            name: "role_id",
            type: "INT",
            isPrimaryKey: false,
            isForeignKey: true,
            isNullable: false,
            referencesTable: "roles",
            referencesColumn: "id",
          },
        ],
      },
    ],
    relationships: [
      {
        id: "edge-users-user-roles",
        source: "table-users",
        target: "table-user-roles",
        animated: true,
        data: {
          relationshipType: "one-to-many",
          sourceColumn: "id",
          targetColumn: "user_id",
        },
      },
      {
        id: "edge-roles-user-roles",
        source: "table-roles",
        target: "table-user-roles",
        animated: true,
        data: {
          relationshipType: "one-to-many",
          sourceColumn: "id",
          targetColumn: "role_id",
        },
      },
    ],
  },
  {
    name: "Blog System",
    description: "Blog with posts, categories, and comments",
    tables: [
      {
        id: "table-posts",
        tableName: "posts",
        columns: [
          {
            id: "col-posts-id",
            name: "id",
            type: "INT",
            isPrimaryKey: true,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-posts-title",
            name: "title",
            type: "VARCHAR",
            length: 255,
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-posts-content",
            name: "content",
            type: "TEXT",
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-posts-author",
            name: "author_id",
            type: "INT",
            isPrimaryKey: false,
            isForeignKey: true,
            isNullable: false,
            referencesTable: "users",
            referencesColumn: "id",
          },
          {
            id: "col-posts-created",
            name: "created_at",
            type: "TIMESTAMP",
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-posts-updated",
            name: "updated_at",
            type: "TIMESTAMP",
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: true,
          },
        ],
      },
      {
        id: "table-categories",
        tableName: "categories",
        columns: [
          {
            id: "col-categories-id",
            name: "id",
            type: "INT",
            isPrimaryKey: true,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-categories-name",
            name: "name",
            type: "VARCHAR",
            length: 50,
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            isUnique: true,
          },
          {
            id: "col-categories-slug",
            name: "slug",
            type: "VARCHAR",
            length: 50,
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            isUnique: true,
          },
        ],
      },
      {
        id: "table-post-categories",
        tableName: "post_categories",
        columns: [
          {
            id: "col-post-categories-id",
            name: "id",
            type: "INT",
            isPrimaryKey: true,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-post-categories-post",
            name: "post_id",
            type: "INT",
            isPrimaryKey: false,
            isForeignKey: true,
            isNullable: false,
            referencesTable: "posts",
            referencesColumn: "id",
          },
          {
            id: "col-post-categories-category",
            name: "category_id",
            type: "INT",
            isPrimaryKey: false,
            isForeignKey: true,
            isNullable: false,
            referencesTable: "categories",
            referencesColumn: "id",
          },
        ],
      },
      {
        id: "table-comments",
        tableName: "comments",
        columns: [
          {
            id: "col-comments-id",
            name: "id",
            type: "INT",
            isPrimaryKey: true,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-comments-post",
            name: "post_id",
            type: "INT",
            isPrimaryKey: false,
            isForeignKey: true,
            isNullable: false,
            referencesTable: "posts",
            referencesColumn: "id",
          },
          {
            id: "col-comments-author",
            name: "author_id",
            type: "INT",
            isPrimaryKey: false,
            isForeignKey: true,
            isNullable: false,
            referencesTable: "users",
            referencesColumn: "id",
          },
          {
            id: "col-comments-content",
            name: "content",
            type: "TEXT",
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-comments-created",
            name: "created_at",
            type: "TIMESTAMP",
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
          },
        ],
      },
    ],
    relationships: [], // Relationships will be created based on foreign keys
  },
  {
    name: "E-commerce",
    description: "E-commerce system with products, orders, and customers",
    tables: [
      {
        id: "table-products",
        tableName: "products",
        columns: [
          {
            id: "col-products-id",
            name: "id",
            type: "INT",
            isPrimaryKey: true,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-products-name",
            name: "name",
            type: "VARCHAR",
            length: 255,
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-products-description",
            name: "description",
            type: "TEXT",
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: true,
          },
          {
            id: "col-products-price",
            name: "price",
            type: "DECIMAL",
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-products-stock",
            name: "stock_quantity",
            type: "INT",
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-products-created",
            name: "created_at",
            type: "TIMESTAMP",
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
          },
        ],
      },
      {
        id: "table-customers",
        tableName: "customers",
        columns: [
          {
            id: "col-customers-id",
            name: "id",
            type: "INT",
            isPrimaryKey: true,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-customers-user",
            name: "user_id",
            type: "INT",
            isPrimaryKey: false,
            isForeignKey: true,
            isNullable: true,
            referencesTable: "users",
            referencesColumn: "id",
          },
          {
            id: "col-customers-email",
            name: "email",
            type: "VARCHAR",
            length: 255,
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            isUnique: true,
          },
          {
            id: "col-customers-name",
            name: "name",
            type: "VARCHAR",
            length: 100,
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-customers-created",
            name: "created_at",
            type: "TIMESTAMP",
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
          },
        ],
      },
      {
        id: "table-orders",
        tableName: "orders",
        columns: [
          {
            id: "col-orders-id",
            name: "id",
            type: "INT",
            isPrimaryKey: true,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-orders-customer",
            name: "customer_id",
            type: "INT",
            isPrimaryKey: false,
            isForeignKey: true,
            isNullable: false,
            referencesTable: "customers",
            referencesColumn: "id",
          },
          {
            id: "col-orders-date",
            name: "order_date",
            type: "TIMESTAMP",
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-orders-status",
            name: "status",
            type: "ENUM",
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            enumValues: [
              "pending",
              "processing",
              "shipped",
              "delivered",
              "cancelled",
            ],
          },
          {
            id: "col-orders-total",
            name: "total_amount",
            type: "DECIMAL",
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
          },
        ],
      },
      {
        id: "table-order-items",
        tableName: "order_items",
        columns: [
          {
            id: "col-order-items-id",
            name: "id",
            type: "INT",
            isPrimaryKey: true,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-order-items-order",
            name: "order_id",
            type: "INT",
            isPrimaryKey: false,
            isForeignKey: true,
            isNullable: false,
            referencesTable: "orders",
            referencesColumn: "id",
          },
          {
            id: "col-order-items-product",
            name: "product_id",
            type: "INT",
            isPrimaryKey: false,
            isForeignKey: true,
            isNullable: false,
            referencesTable: "products",
            referencesColumn: "id",
          },
          {
            id: "col-order-items-quantity",
            name: "quantity",
            type: "INT",
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
          },
          {
            id: "col-order-items-price",
            name: "unit_price",
            type: "DECIMAL",
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
          },
        ],
      },
    ],
    relationships: [], // Relationships will be created based on foreign keys
  },
];

// Save custom templates
export function saveTemplate(template: TableTemplate): void {
  const existingTemplates = getCustomTemplates();
  const templateIndex = existingTemplates.findIndex(
    (t) => t.name === template.name
  );

  if (templateIndex === -1) {
    existingTemplates.push(template);
  } else {
    existingTemplates[templateIndex] = template;
  }

  localStorage.setItem(
    "erd-custom-templates",
    JSON.stringify(existingTemplates)
  );
}

// Get all templates (built-in + custom)
export function getAllTemplates(): TableTemplate[] {
  return [...COMMON_TEMPLATES, ...getCustomTemplates()];
}

// Get custom templates only
export function getCustomTemplates(): TableTemplate[] {
  try {
    const templatesJson = localStorage.getItem("erd-custom-templates");
    if (!templatesJson) return [];

    return JSON.parse(templatesJson) as TableTemplate[];
  } catch (error) {
    console.error("Error loading custom templates:", error);
    return [];
  }
}

export function deleteTemplate(templateName: string): boolean {
  try {
    // Don't allow deleting built-in templates
    if (COMMON_TEMPLATES.some((t) => t.name === templateName)) {
      return false;
    }

    const templates = getCustomTemplates();
    const filtered = templates.filter((t) => t.name !== templateName);

    if (filtered.length === templates.length) {
      return false; // No template was removed
    }

    localStorage.setItem("erd-custom-templates", JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Error deleting template:", error);
    return false;
  }
}

// Create template from current diagram
export function createTemplateFromDiagram(
  diagram: DiagramState,
  name: string,
  description: string
): TableTemplate {
  return {
    name,
    description,
    tables: diagram.nodes.map((node) => node.data),
    relationships: diagram.edges,
  };
}

// Apply a template to a diagram
export function applyTemplate(
  template: TableTemplate,
  position = { x: 100, y: 100 }
): DiagramState {
  // Create a new diagram based on the template
  const tables = template.tables.map((table, index) => {
    const x = position.x + (index % 3) * 300;
    const y = position.y + Math.floor(index / 3) * 250;

    // Generate new IDs for the table and all columns to avoid conflicts
    const newTableId = `table-${Date.now()}-${index}`;

    // Create a deep copy of the table with new IDs
    const newTable = {
      ...table,
      id: newTableId,
      columns: table.columns.map((col, colIndex) => ({
        ...col,
        id: `${newTableId}-col-${colIndex}`,
      })),
    };

    return {
      id: newTableId,
      type: "tableNode",
      position: { x, y },
      data: newTable,
    };
  });

  // Create an ID mapping to update relationship references
  const idMapping: Record<string, string> = {};
  template.tables.forEach((oldTable, index) => {
    idMapping[oldTable.id] = tables[index].id;
  });

  // Create relationships based on the template
  const edges = template.relationships.map((rel, index) => {
    return {
      id: `edge-${Date.now()}-${index}`,
      source: idMapping[rel.source] || rel.source,
      target: idMapping[rel.target] || rel.target,
      animated: true,
      data: rel.data,
    };
  });

  // Add relationships based on foreign keys if not explicitly defined
  tables.forEach((sourceNode) => {
    sourceNode.data.columns
      .filter((col) => col.isForeignKey && col.referencesTable)
      .forEach((fkCol, fkIndex) => {
        // Find the target table
        const targetTable = tables.find(
          (t) => t.data.tableName === fkCol.referencesTable
        );

        if (targetTable) {
          // Check if this relationship already exists in edges
          const existingEdge = edges.some(
            (edge) =>
              edge.source === targetTable.id &&
              edge.target === sourceNode.id &&
              edge.data?.targetColumn === fkCol.name
          );

          if (!existingEdge) {
            edges.push({
              id: `edge-${Date.now()}-auto-${fkIndex}`,
              source: targetTable.id,
              target: sourceNode.id,
              animated: true,
              data: {
                relationshipType: "one-to-many",
                sourceColumn: fkCol.referencesColumn,
                targetColumn: fkCol.name,
              },
            });
          }
        }
      });
  });

  return {
    nodes: tables,
    edges,
  };
}

// Merge a template with existing diagram
export function mergeTemplateWithDiagram(
  template: TableTemplate,
  diagram: DiagramState,
  position = { x: 100, y: 100 }
): DiagramState {
  const templateDiagram = applyTemplate(template, position);

  // Merge nodes
  const combinedNodes = [...diagram.nodes, ...templateDiagram.nodes];

  // Merge edges
  const combinedEdges = [...diagram.edges, ...templateDiagram.edges];

  return {
    nodes: combinedNodes,
    edges: combinedEdges,
  };
}
