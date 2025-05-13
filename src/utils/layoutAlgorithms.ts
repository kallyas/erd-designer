// src/utils/layoutAlgorithms.ts
import { TableNode } from "@/types";

// Layout algorithm interface
export interface LayoutOptions {
  spacing?: number;
  direction?: "TB" | "LR" | "RL" | "BT";
  padding?: number;
  groupPadding?: number;
}

export function applyGridLayout(
  nodes: TableNode[],
  options: LayoutOptions = {}
): TableNode[] {
  const { spacing = 300, padding = 50 } = options;
  const cols = Math.ceil(Math.sqrt(nodes.length));

  return nodes.map((node, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);

    return {
      ...node,
      position: {
        x: padding + col * spacing,
        y: padding + row * spacing,
      },
    };
  });
}

export function applyCircularLayout(
  nodes: TableNode[],
  options: LayoutOptions = {}
): TableNode[] {
  const { padding = 50 } = options;
  const centerX = 500;
  const centerY = 400;
  const radius = Math.max(300, nodes.length * 50);

  return nodes.map((node, idx) => {
    const angle = (idx / nodes.length) * 2 * Math.PI;

    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      },
    };
  });
}

export function applyTreeLayout(
  nodes: TableNode[],
  edges: any[],
  options: LayoutOptions = {}
): TableNode[] {
  // This is a simplified tree layout that would be enhanced with a library like dagre
  // For complex hierarchical layouts, you would integrate dagre here
  const { direction = "TB", spacing = 200, padding = 100 } = options;

  // Build adjacency list
  const graph: Record<string, string[]> = {};
  edges.forEach((edge) => {
    if (!graph[edge.source]) graph[edge.source] = [];
    graph[edge.source].push(edge.target);
  });

  // Find root nodes (no incoming edges)
  const incomingEdges: Record<string, number> = {};
  edges.forEach((edge) => {
    if (!incomingEdges[edge.target]) incomingEdges[edge.target] = 0;
    incomingEdges[edge.target]++;
  });

  const roots = nodes
    .map((node) => node.id)
    .filter((id) => !incomingEdges[id] || incomingEdges[id] === 0);

  // If no roots found, use the first node
  if (roots.length === 0 && nodes.length > 0) {
    roots.push(nodes[0].id);
  }

  // Assign levels in a BFS manner
  const levels: Record<string, number> = {};
  const queue = roots.map((id) => ({ id, level: 0 }));

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (levels[id] !== undefined) continue;
    levels[id] = level;

    const children = graph[id] || [];
    children.forEach((childId) => {
      queue.push({ id: childId, level: level + 1 });
    });
  }

  // Arrange nodes by level
  const nodesByLevel: Record<number, string[]> = {};
  Object.entries(levels).forEach(([id, level]) => {
    if (!nodesByLevel[level]) nodesByLevel[level] = [];
    nodesByLevel[level].push(id);
  });

  // Position nodes
  const levelsCount = Object.keys(nodesByLevel).length;
  const result = [...nodes];

  const isHorizontal = direction === "LR" || direction === "RL";
  const reverseMain = direction === "BT" || direction === "RL";

  Object.entries(nodesByLevel).forEach(([level, nodeIds]) => {
    const numLevel = parseInt(level);
    const mainCoord = padding + numLevel * spacing;

    nodeIds.forEach((nodeId, idx) => {
      const nodeIndex = result.findIndex((n) => n.id === nodeId);
      if (nodeIndex === -1) return;

      const count = nodesByLevel[numLevel].length;
      const step = count > 1 ? spacing : 0;
      const crossCoord = padding + idx * step;

      result[nodeIndex] = {
        ...result[nodeIndex],
        position: isHorizontal
          ? {
              x: reverseMain ? (levelsCount - numLevel) * spacing : mainCoord,
              y: crossCoord,
            }
          : {
              x: crossCoord,
              y: reverseMain ? (levelsCount - numLevel) * spacing : mainCoord,
            },
      };
    });
  });

  return result;
}

export function applyForceDirectedLayout(
  nodes: TableNode[],
  edges: any[],
  options: LayoutOptions = {}
): TableNode[] {
  // Simplified force-directed layout
  // For production, you'd want to use a library like d3-force
  const iterations = 50;
  const nodePositions = nodes.map((node) => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    vx: 0,
    vy: 0,
  }));

  // Set up edge forces
  const edgeStrength = 0.7;
  const repulsionStrength = 1000;

  for (let i = 0; i < iterations; i++) {
    // Apply repulsion between all nodes
    for (let a = 0; a < nodePositions.length; a++) {
      for (let b = a + 1; b < nodePositions.length; b++) {
        const dx = nodePositions[b].x - nodePositions[a].x;
        const dy = nodePositions[b].y - nodePositions[a].y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsionStrength / (distance * distance);

        nodePositions[a].vx -= (dx / distance) * force;
        nodePositions[a].vy -= (dy / distance) * force;
        nodePositions[b].vx += (dx / distance) * force;
        nodePositions[b].vy += (dy / distance) * force;
      }
    }

    // Apply attraction along edges
    for (const edge of edges) {
      const source = nodePositions.find((n) => n.id === edge.source);
      const target = nodePositions.find((n) => n.id === edge.target);
      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      const force = (distance - 200) * edgeStrength;

      source.vx += (dx / distance) * force;
      source.vy += (dy / distance) * force;
      target.vx -= (dx / distance) * force;
      target.vy -= (dy / distance) * force;
    }

    // Update positions
    for (const node of nodePositions) {
      node.x += node.vx * 0.1;
      node.y += node.vy * 0.1;
      node.vx *= 0.9;
      node.vy *= 0.9;
    }
  }

  // Update node positions
  return nodes.map((node) => {
    const pos = nodePositions.find((n) => n.id === node.id);
    if (!pos) return node;

    return {
      ...node,
      position: { x: pos.x, y: pos.y },
    };
  });
}
