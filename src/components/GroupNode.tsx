
// src/components/GroupNode.tsx
import { memo, useState } from "react";
import { Handle, Position, NodeResizer } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Pencil, 
  Save, 
  Trash2, 
  Lock, 
  Unlock, 
  Move, 
  Maximize, 
  Minimize 
} from "lucide-react";
import { toast } from "sonner";
import { GroupNodeProps } from "./types";

export interface GroupNodeData {
  id: string;
  label: string;
  description?: string;
  color?: string;
  nodeIds: string[];
  locked?: boolean;
  collapsed?: boolean;
}

// Create proper NodeProps type for our GroupNode
const GroupNode = memo(({ id, data, selected }: GroupNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || "Group");
  const [description, setDescription] = useState(data.description || "");
  const [isLocked, setIsLocked] = useState(data.locked || false);
  const [isCollapsed, setIsCollapsed] = useState(data.collapsed || false);
  
  // Get default colors based on the provided color or use a default
  const backgroundColor = data.color || "#f3f4f6";
  const borderColor = data.color ? 
    (data.color.startsWith('#') ? 
      data.color.replace('#', '#66') : 
      'rgba(0, 0, 0, 0.1)') : 
    "#e5e7eb";
  
  // Determine styles based on state
  const groupStyle = {
    backgroundColor: isCollapsed ? "transparent" : backgroundColor,
    borderColor: selected ? "#fbbf24" : borderColor,
    borderWidth: selected ? "2px" : "1px",
    borderStyle: "solid",
    borderRadius: "8px",
    padding: "12px",
    transition: "all 0.2s ease",
    width: "100%",
    height: "100%",
    position: "relative" as const,
    minWidth: "200px",
    minHeight: "100px",
    boxShadow: selected ? "0 0 0 2px rgba(251, 191, 36, 0.4)" : "none",
    opacity: isCollapsed ? 0.7 : 1,
  };

  const contentStyle = {
    display: isCollapsed ? "none" : "block",
    padding: "8px 0",
  };
  
  const nodeCountBadge = {
    position: "absolute" as const,
    top: "8px",
    right: "8px",
    backgroundColor: "#cbd5e1",
    color: "#475569",
    borderRadius: "12px",
    padding: "2px 8px",
    fontSize: "10px",
    fontWeight: 500,
  };
  
  const handleSaveEdit = () => {
    // In a real implementation, you would emit an event to update the node data
    // For now, we just update local state
    setIsEditing(false);
    
    // Simulate updating the node data
    // Type casting needed since we're mutating a prop
    (data as any).label = label;
    (data as any).description = description;
    
    toast.success(`Group "${label}" updated`);
  };
  
  const handleToggleLock = () => {
    // Toggle lock state
    setIsLocked(!isLocked);
    (data as any).locked = !isLocked;
    
    toast.success(isLocked ? "Group unlocked" : "Group locked");
  };
  
  const handleToggleCollapse = () => {
    // Toggle collapsed state
    setIsCollapsed(!isCollapsed);
    (data as any).collapsed = !isCollapsed;
  };
  
  const handleDelete = () => {
    // In a real implementation, this would emit an event to delete the node
    toast.success(`Group "${data.label}" would be deleted`);
  };
  
  return (
    <>
      {/* Handles for connecting to the group */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id={`${id}-source`}
        style={{ 
          visibility: 'hidden', 
          background: '#333', 
          width: 8, 
          height: 8,
          right: -4
        }}
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        id={`${id}-target`}
        style={{ 
          visibility: 'hidden', 
          background: '#333', 
          width: 8, 
          height: 8,
          left: -4
        }}
      />
      
      {/* Node Resizer */}
      <NodeResizer 
        minWidth={200} 
        minHeight={100}
        isVisible={selected && !isLocked} 
        lineClassName="border-blue-500"
        handleClassName="h-3 w-3 bg-white border-2 border-blue-500 rounded"
      />
      
      <div style={groupStyle}>
        {/* Group header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
          {isEditing ? (
            <div className="space-y-2 w-full pr-6">
              <Input 
                value={label} 
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Group name"
                className="text-sm font-medium h-7"
              />
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="text-xs h-6"
              />
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  className="h-6 text-xs px-2"
                  onClick={handleSaveEdit}
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-6 text-xs px-2"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-medium flex items-center">
                {data.label || "Group"}
              </h3>
              {data.description && (
                <p className="text-xs text-gray-500 mt-1">{data.description}</p>
              )}
            </div>
          )}
          
          {!isEditing && (
            <div className="flex space-x-0.5">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0"
                onClick={handleToggleLock}
              >
                {isLocked ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  <Unlock className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0"
                onClick={handleToggleCollapse}
              >
                {isCollapsed ? (
                  <Maximize className="h-3.5 w-3.5" />
                ) : (
                  <Minimize className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Group content */}
        <div style={contentStyle}>
          <p className="text-xs text-gray-500">
            {data.nodeIds?.length ? `Contains ${data.nodeIds.length} tables` : "Empty group"}
          </p>
          
          {/* Placeholder for explaining group behavior */}
          {(!data.nodeIds || data.nodeIds.length === 0) && (
            <div className="mt-2 text-xs text-gray-500 border border-dashed border-gray-300 rounded-md p-2">
              Drag tables into this group to organize your schema
            </div>
          )}
        </div>
        
        {/* Node count badge */}
        {data.nodeIds && data.nodeIds.length > 0 && (
          <div style={nodeCountBadge}>
            {data.nodeIds.length} tables
          </div>
        )}
        
        {/* Drag handle shown only when selected */}
        {selected && !isLocked && (
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 rounded-full p-1 cursor-move opacity-70 hover:opacity-100 transition-opacity"
            style={{ display: isEditing ? 'none' : 'block' }}
          >
            <Move className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
    </>
  );
});

GroupNode.displayName = "GroupNode";

export default GroupNode;
