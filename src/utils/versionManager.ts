// src/utils/versionManager.ts
import { DiagramState, VersionHistory } from "@/types";

export function saveVersion(
  diagramState: DiagramState,
  name?: string,
  description?: string
): VersionHistory {
  // Create a deep copy of the diagram state to ensure history is immutable
  const stateCopy = JSON.parse(JSON.stringify(diagramState)) as DiagramState;

  const version: VersionHistory = {
    id: `v-${Date.now()}`,
    version: name || generateVersionNumber(),
    date: new Date(),
    changes: description || "Version saved",
    state: stateCopy,
  };

  // Load existing versions
  const existingVersions = getVersionHistory();

  // Add new version
  const updatedVersions = [...existingVersions, version];

  // Save to local storage
  localStorage.setItem("erd-version-history", JSON.stringify(updatedVersions));

  return version;
}

export function getVersionHistory(): VersionHistory[] {
  try {
    const versionsJson = localStorage.getItem("erd-version-history");
    if (!versionsJson) return [];

    return JSON.parse(versionsJson) as VersionHistory[];
  } catch (error) {
    console.error("Error loading version history:", error);
    return [];
  }
}

export function loadVersion(versionId: string): DiagramState | null {
  const versions = getVersionHistory();
  const targetVersion = versions.find((v) => v.id === versionId);

  if (!targetVersion) return null;

  return targetVersion.state;
}

export function compareVersions(
  version1Id: string,
  version2Id: string
): {
  addedTables: string[];
  removedTables: string[];
  modifiedTables: string[];
  addedRelationships: string[];
  removedRelationships: string[];
} {
  const versions = getVersionHistory();
  const v1 = versions.find((v) => v.id === version1Id)?.state;
  const v2 = versions.find((v) => v.id === version2Id)?.state;

  if (!v1 || !v2) {
    throw new Error("One or both versions not found");
  }

  // Extract table names for easy comparison
  const v1TableNames = v1.nodes.map((n) => n.data.tableName);
  const v2TableNames = v2.nodes.map((n) => n.data.tableName);

  // Find added/removed tables
  const addedTables = v2TableNames.filter(
    (name) => !v1TableNames.includes(name)
  );
  const removedTables = v1TableNames.filter(
    (name) => !v2TableNames.includes(name)
  );

  // Find modified tables
  const modifiedTables: string[] = [];

  v1TableNames
    .filter((name) => v2TableNames.includes(name))
    .forEach((tableName) => {
      const v1Table = v1.nodes.find((n) => n.data.tableName === tableName)!;
      const v2Table = v2.nodes.find((n) => n.data.tableName === tableName)!;

      // Compare columns
      const v1Cols = v1Table.data.columns.map((c) => c.name);
      const v2Cols = v2Table.data.columns.map((c) => c.name);

      const hasNewCols = v2Cols.some((col) => !v1Cols.includes(col));
      const hasRemovedCols = v1Cols.some((col) => !v2Cols.includes(col));

      // Compare column properties for columns present in both
      const commonCols = v1Cols.filter((col) => v2Cols.includes(col));
      const hasModifiedCols = commonCols.some((colName) => {
        const v1Col = v1Table.data.columns.find((c) => c.name === colName)!;
        const v2Col = v2Table.data.columns.find((c) => c.name === colName)!;

        return (
          v1Col.type !== v2Col.type ||
          v1Col.isPrimaryKey !== v2Col.isPrimaryKey ||
          v1Col.isForeignKey !== v2Col.isForeignKey ||
          v1Col.isNullable !== v2Col.isNullable ||
          JSON.stringify(v1Col.constraints) !==
            JSON.stringify(v2Col.constraints)
        );
      });

      if (hasNewCols || hasRemovedCols || hasModifiedCols) {
        modifiedTables.push(tableName);
      }
    });

  // Compare relationships
  const v1EdgeIds = v1.edges.map((e) => `${e.source}-${e.target}`);
  const v2EdgeIds = v2.edges.map((e) => `${e.source}-${e.target}`);

  const addedRelationships = v2EdgeIds.filter((id) => !v1EdgeIds.includes(id));
  const removedRelationships = v1EdgeIds.filter(
    (id) => !v2EdgeIds.includes(id)
  );

  return {
    addedTables,
    removedTables,
    modifiedTables,
    addedRelationships,
    removedRelationships,
  };
}

function generateVersionNumber(): string {
  const versions = getVersionHistory();
  if (versions.length === 0) return "1.0.0";

  // Find the highest version number
  const versionNumbers = versions
    .map((v) => v.version)
    .filter((v) => /^\d+\.\d+\.\d+$/.test(v)) // Only include semantic versioning format
    .map((v) => {
      const parts = v.split(".");
      return {
        major: parseInt(parts[0]),
        minor: parseInt(parts[1]),
        patch: parseInt(parts[2]),
      };
    });

  if (versionNumbers.length === 0) return "1.0.0";

  // Sort to find highest
  versionNumbers.sort((a, b) => {
    if (a.major !== b.major) return b.major - a.major;
    if (a.minor !== b.minor) return b.minor - a.minor;
    return b.patch - a.patch;
  });

  const highest = versionNumbers[0];

  // Increment patch version
  return `${highest.major}.${highest.minor}.${highest.patch + 1}`;
}
