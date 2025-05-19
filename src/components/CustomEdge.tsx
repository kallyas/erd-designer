
// src/components/CustomEdge.tsx
import { useMemo, FC } from "react";
import {
  EdgeProps,
  EdgeLabelRenderer,
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
} from "@xyflow/react";
import { RelationshipEdge, RelationshipType } from "@/types";

// Define proper edge data type to match our RelationshipEdge
interface CustomEdgeData {
  relationshipType?: RelationshipType;
  sourceColumn?: string;
  targetColumn?: string;
  onDelete?: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'SET DEFAULT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'SET DEFAULT' | 'NO ACTION';
}

const CustomEdge: FC<EdgeProps<CustomEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  style = {},
  data,
  markerEnd,
}) => {
  // Determine relationship style based on data
  const relationshipType = data?.relationshipType || "one-to-many";
  const sourceColumn = data?.sourceColumn || "";
  const targetColumn = data?.targetColumn || "";
  
  // Calculate path based on edge type
  const [edgePath, labelX, labelY] = useMemo(() => {
    // For smoother paths, especially with many connections
    const smoothPath = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 10,
    });
    
    // Calculate center position for label
    const centerX = (sourceX + targetX) / 2;
    const centerY = (sourceY + targetY) / 2;
    
    return [smoothPath, centerX, centerY];
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);
  
  // Determine edge and label styles based on relationship type
  const getRelationshipStyle = () => {
    switch (relationshipType) {
      case "one-to-one":
        return {
          stroke: "#3498db",
          strokeWidth: 2,
          strokeDasharray: undefined,
        };
      case "one-to-many":
        return {
          stroke: "#2ecc71",
          strokeWidth: 2,
          strokeDasharray: undefined,
        };
      case "many-to-many":
        return {
          stroke: "#e74c3c",
          strokeWidth: 2,
          strokeDasharray: undefined,
        };
      case "inheritance":
        return {
          stroke: "#9b59b6",
          strokeWidth: 2,
          strokeDasharray: "5,5",
        };
      default:
        return {
          stroke: "#95a5a6",
          strokeWidth: 2,
          strokeDasharray: undefined,
        };
    }
  };
  
  const edgeStyle = getRelationshipStyle();
  const mergedStyle = {
    ...style,
    ...edgeStyle,
  };
  
  // If selected, enhance the style
  if (selected) {
    mergedStyle.strokeWidth = 3;
    mergedStyle.stroke = '#fbbf24'; // Amber color for selected edges
  }
  
  return (
    <>
      <path
        id={id}
        style={mergedStyle}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      {/* Render the label only if columns are specified */}
      {(sourceColumn || targetColumn) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 500,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              userSelect: 'none',
              // Hide by default, show on hover/selection
              opacity: selected ? 1 : 0,
              transition: 'opacity 0.2s',
            }}
            className="edge-label nodrag nopan hover:opacity-100"
          >
            <div className="flex flex-col">
              {sourceColumn && (
                <div className="text-blue-600">{sourceColumn}</div>
              )}
              {sourceColumn && targetColumn && (
                <div className="text-gray-400 text-xs">↓</div>
              )}
              {targetColumn && (
                <div className="text-green-600">{targetColumn}</div>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CustomEdge;
