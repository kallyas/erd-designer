// src/components/TableNode.tsx
import { useState, useEffect } from "react";
import { Handle, Position, useReactFlow, NodeProps } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TableData, ColumnType, Column, Constraint, CustomType } from "@/types";
import {
  Key,
  Database,
  Table as TableIcon,
  Check,
  Fingerprint,
  File,
  MessageSquare,
  Lock,
  Copy,
  MoreHorizontal,
  Settings,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { getCustomTypes } from "@/utils/customTypes";
import { getSupportedTypes } from "@/utils/dialectManager";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TableNodeProps extends NodeProps {
  data: TableData;
  isConnectable: boolean;
}

// src/components/TableNode.tsx (continued)
const TableNode = ({ id, data, isConnectable, selected }: TableNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tableName, setTableName] = useState(data.tableName);
  const [newColumnDialogOpen, setNewColumnDialogOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState<ColumnType>("VARCHAR");
  const [newColumnLength, setNewColumnLength] = useState<number>(255);
  const [isPrimaryKey, setIsPrimaryKey] = useState(false);
  const [isNullable, setIsNullable] = useState(true);
  const [isUnique, setIsUnique] = useState(false);
  const [hasDefaultValue, setHasDefaultValue] = useState(false);
  const [defaultValue, setDefaultValue] = useState("");
  const [hasCheckConstraint, setHasCheckConstraint] = useState(false);
  const [checkExpression, setCheckExpression] = useState("");
  const [comment, setComment] = useState("");
  const [enumValues, setEnumValues] = useState("");
  const [schema, setSchema] = useState(data.schema || "public");
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [customTypes, setCustomTypes] = useState<
    ReturnType<typeof getCustomTypes>
  >([]);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const [supportedTypes, setSupportedTypes] = useState<string[]>([]);
  const reactFlowInstance = useReactFlow();

  const tableStyle = data.style || "default";
  const colorScheme = data.colorScheme || "default";

  // Get supported types and custom types on mount
  useEffect(() => {
    setCustomTypes(getCustomTypes());
    setSupportedTypes(getSupportedTypes(data.dialect || "mysql"));
  }, [data.dialect]);

  // Update internal state when data changes
  useEffect(() => {
    setTableName(data.tableName);
    setSchema(data.schema || "public");
  }, [data.tableName, data.schema]);

  const handleSaveTableName = () => {
    data.tableName = tableName;
    data.schema = schema; // Save schema if changed
    data.comment = comment || undefined; // Save comment if provided
    setIsEditing(false);
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;

    const constraints: Constraint[] = [];

    if (hasDefaultValue && defaultValue) {
      constraints.push({
        type: "DEFAULT",
        defaultValue,
      });
    }

    if (hasCheckConstraint && checkExpression) {
      constraints.push({
        type: "CHECK",
        expression: checkExpression,
      });
    }

    const newColumn: Column = {
      id: editingColumnId || `${id}-col-${Date.now()}`,
      name: newColumnName,
      type: newColumnType,
      length: newColumnType === "VARCHAR" ? newColumnLength : undefined,
      isPrimaryKey,
      isForeignKey: false,
      isNullable,
      isUnique,
      constraints: constraints.length > 0 ? constraints : undefined,
      comment: comment || undefined,
      enumValues:
        newColumnType === "ENUM"
          ? enumValues.split(",").map((v) => v.trim())
          : undefined,
    };

    if (editingColumnId) {
      // Edit existing column
      data.columns = data.columns.map((col) =>
        col.id === editingColumnId ? newColumn : col
      );
    } else {
      // Add new column
      data.columns.push(newColumn);
    }

    // Reset form
    resetForm();
    setNewColumnDialogOpen(false);

    // Force a re-render of the node
    const node = reactFlowInstance.getNode(id);
    if (node) {
      reactFlowInstance.setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data } } : n))
      );
    }
  };

  const resetForm = () => {
    setNewColumnName("");
    setNewColumnType("VARCHAR");
    setNewColumnLength(255);
    setIsPrimaryKey(false);
    setIsNullable(true);
    setIsUnique(false);
    setHasDefaultValue(false);
    setDefaultValue("");
    setHasCheckConstraint(false);
    setCheckExpression("");
    setComment("");
    setEnumValues("");
    setEditingColumnId(null);
  };

  const handleEditColumn = (column: Column) => {
    setNewColumnName(column.name);
    setNewColumnType(column.type);
    setNewColumnLength(column.length || 255);
    setIsPrimaryKey(column.isPrimaryKey);
    setIsNullable(column.isNullable);
    setIsUnique(column.isUnique || false);
    setComment(column.comment || "");
    setEnumValues(column.enumValues?.join(", ") || "");

    const defaultConstraint = column.constraints?.find(
      (c) => c.type === "DEFAULT"
    );
    setHasDefaultValue(!!defaultConstraint);
    setDefaultValue(defaultConstraint?.defaultValue || "");

    const checkConstraint = column.constraints?.find((c) => c.type === "CHECK");
    setHasCheckConstraint(!!checkConstraint);
    setCheckExpression(checkConstraint?.expression || "");

    setEditingColumnId(column.id);
    setNewColumnDialogOpen(true);
  };

  const handleDeleteColumn = (columnId: string) => {
    data.columns = data.columns.filter((col) => col.id !== columnId);

    // Force a re-render of the node
    const node = reactFlowInstance.getNode(id);
    if (node) {
      reactFlowInstance.setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data } } : n))
      );
    }
  };

  const toggleColumnVisibility = (columnId: string) => {
    setHiddenColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const toggleLock = () => {
    setIsLocked(!isLocked);

    // In a real implementation, you would emit an event to the parent
    // to track locked nodes
    if (!isLocked) {
      toast.success(`Table "${data.tableName}" locked`);
    } else {
      toast.success(`Table "${data.tableName}" unlocked`);
    }
  };

  const duplicateTable = () => {
    // Clone the table data
    const newTable = JSON.parse(JSON.stringify(data));
    newTable.id = `table-${Date.now()}`;
    newTable.tableName = `${data.tableName}_copy`;

    // Generate new IDs for columns
    newTable.columns = newTable.columns.map((col: Column) => ({
      ...col,
      id: `${newTable.id}-col-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`,
    }));

    // Add the new node
    const position = reactFlowInstance.getNode(id)?.position;
    if (position) {
      reactFlowInstance.addNodes({
        id: newTable.id,
        type: "tableNode",
        position: { x: position.x + 50, y: position.y + 50 },
        data: newTable,
      });

      toast.success(`Duplicated table as "${newTable.tableName}"`);
    }
  };

  // Get the node class based on style and color scheme
  const getNodeClass = () => {
    let baseClass = "table-node";

    // Apply style
    if (tableStyle === "compact") {
      baseClass += " table-node-compact";
    } else if (tableStyle === "detailed") {
      baseClass += " table-node-detailed";
    } else if (tableStyle === "minimal") {
      baseClass += " table-node-minimal";
    }

    // Apply color scheme
    if (colorScheme === "monochrome") {
      baseClass += " table-node-monochrome";
    } else if (colorScheme === "colorful") {
      baseClass += " table-node-colorful";
    } else if (colorScheme === "pastel") {
      baseClass += " table-node-pastel";
    }

    // Apply selection and lock styles
    if (selected) {
      baseClass += " selected";
    }

    if (isLocked) {
      baseClass += " locked";
    }

    return baseClass;
  };

  // Get header style based on color scheme
  const getHeaderStyle = () => {
    if (colorScheme === "monochrome") {
      return { backgroundColor: "#333333" };
    } else if (colorScheme === "colorful") {
      return { backgroundColor: "#4F46E5" };
    } else if (colorScheme === "pastel") {
      return { backgroundColor: "#8B5CF6" };
    }

    return { backgroundColor: "#333333" };
  };

  return (
    <div className={getNodeClass()}>
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-source`}
        isConnectable={isConnectable && !isLocked}
        className="bg-mono-800 border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-target`}
        isConnectable={isConnectable && !isLocked}
        className="bg-mono-800 border-white"
      />

      <div className="table-node__header" style={getHeaderStyle()}>
        {isEditing ? (
          <div className="flex flex-col space-y-2 p-2">
            <div className="flex items-center space-x-2">
              <Input
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="text-mono-900 h-7 py-1 px-2 text-sm"
                placeholder="Table Name"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Input
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
                className="text-mono-900 h-7 py-1 px-2 text-sm"
                placeholder="Schema (e.g. public)"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Input
                value={comment || ""}
                onChange={(e) => setComment(e.target.value)}
                className="text-mono-900 h-7 py-1 px-2 text-sm"
                placeholder="Comment (optional)"
              />
            </div>

            <Button
              onClick={handleSaveTableName}
              size="sm"
              variant="default"
              className="h-7 py-1 px-3 text-xs bg-mono-100 text-mono-900 hover:bg-mono-200"
            >
              Save
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-mono-300" />
                <span>{data.tableName}</span>
                {isLocked && <Lock className="h-3 w-3 text-yellow-300" />}
              </div>
              {data.schema && data.schema !== "public" && (
                <span className="text-xs text-mono-400 ml-6">
                  {data.schema}
                </span>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-mono-100 hover:bg-mono-700 hover:text-mono-100 rounded-full"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Table Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Table
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleLock}>
                  {isLocked ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Unlock Table
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Lock Table
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={duplicateTable}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    if (isLocked) {
                      toast.error(
                        "Cannot delete locked table. Unlock it first."
                      );
                      return;
                    }
                    reactFlowInstance.deleteElements({ nodes: [{ id }] });
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Table
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div
        className={`table-node__content ${
          tableStyle === "compact" ? "max-h-200" : ""
        }`}
      >
        {data.columns
          .filter((column) => !hiddenColumns.includes(column.id))
          .map((column) => (
            <div
              key={column.id}
              className="table-node__row"
              onMouseEnter={() => setHoveredColumn(column.id)}
              onMouseLeave={() => setHoveredColumn(null)}
            >
              <div className="flex items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex space-x-1">
                        {column.isPrimaryKey && (
                          <span
                            className="table-node__row-pk"
                            title="Primary Key"
                          >
                            <Key className="h-3.5 w-3.5" />
                          </span>
                        )}
                        {column.isForeignKey && (
                          <span
                            className="table-node__row-fk"
                            title="Foreign Key"
                          >
                            <Fingerprint className="h-3.5 w-3.5" />
                          </span>
                        )}
                        {column.isUnique && (
                          <span
                            className="table-node__row-unique"
                            title="Unique Constraint"
                          >
                            <TableIcon className="h-3.5 w-3.5" />
                          </span>
                        )}
                        {column.constraints?.some(
                          (c) => c.type === "CHECK"
                        ) && (
                          <span
                            className="table-node__row-check"
                            title="Check Constraint"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                        {column.comment && (
                          <span
                            className="table-node__row-comment"
                            title={column.comment}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1 max-w-md">
                        {column.isPrimaryKey && (
                          <div className="text-xs">Primary Key</div>
                        )}
                        {column.isForeignKey && column.referencesTable && (
                          <div className="text-xs">
                            References {column.referencesTable}.
                            {column.referencesColumn}
                          </div>
                        )}
                        {column.isUnique && (
                          <div className="text-xs">Unique Constraint</div>
                        )}
                        {column.constraints?.map((constraint, index) => (
                          <div key={index} className="text-xs">
                            {constraint.type === "CHECK" &&
                              `Check: ${constraint.expression}`}
                            {constraint.type === "DEFAULT" &&
                              `Default: ${constraint.defaultValue}`}
                          </div>
                        ))}
                        {column.comment && (
                          <div className="text-xs">
                            Comment: {column.comment}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <span className="table-node__row-name">{column.name}</span>

              <span className="table-node__row-type">
                {column.type}
                {column.length ? `(${column.length})` : ""}
                {column.enumValues ? `(${column.enumValues.join(", ")})` : ""}
                {!column.isNullable && " !"}
              </span>

              <div
                className={`flex space-x-1 ${
                  hoveredColumn === column.id ? "opacity-100" : "opacity-0"
                } transition-opacity group-hover:opacity-100`}
              >
                <Button
                  onClick={() => handleEditColumn(column)}
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-mono-500 hover:bg-mono-200 hover:text-mono-700 rounded-full"
                  disabled={isLocked}
                >
                  <Settings className="h-3.5 w-3.5" />
                </Button>

                <Button
                  onClick={() => toggleColumnVisibility(column.id)}
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-mono-500 hover:bg-mono-200 hover:text-mono-700 rounded-full"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>

                <Button
                  onClick={() => handleDeleteColumn(column.id)}
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-mono-500 hover:bg-mono-200 hover:text-mono-700 rounded-full"
                  disabled={isLocked}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}

        {hiddenColumns.length > 0 && (
          <div className="table-node__row text-center text-xs text-muted-foreground">
            <Badge variant="outline" className="mx-auto">
              {hiddenColumns.length} hidden columns
            </Badge>
          </div>
        )}
      </div>

      <button
        className="table-node__add-column"
        onClick={() => {
          if (isLocked) {
            toast.error("Cannot modify locked table");
            return;
          }
          resetForm();
          setNewColumnDialogOpen(true);
        }}
        disabled={isLocked}
      >
        + Add Column
      </button>

      <Dialog open={newColumnDialogOpen} onOpenChange={setNewColumnDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingColumnId ? "Edit Column" : "Add New Column"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="columnName">Column Name</Label>
                <Input
                  id="columnName"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="e.g. id, name, email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="columnType">Data Type</Label>
                <Select
                  value={newColumnType}
                  onValueChange={(value) =>
                    setNewColumnType(value as ColumnType)
                  }
                >
                  <SelectTrigger id="columnType">
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOM">-- Built-in Types --</SelectItem>
                    {supportedTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}

                    {customTypes.length > 0 && (
                      <>
                        <SelectItem value="CUSTOM_SEPARATOR">
                          -- Custom Types --
                        </SelectItem>
                        {customTypes.map((type) => (
                          <SelectItem
                            key={type.name}
                            value={`CUSTOM:${type.name}`}
                          >
                            {type.name} ({type.baseType})
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {newColumnType === "VARCHAR" && (
                <div className="space-y-2">
                  <Label htmlFor="columnLength">Length</Label>
                  <Input
                    id="columnLength"
                    type="number"
                    value={newColumnLength}
                    onChange={(e) => setNewColumnLength(Number(e.target.value))}
                  />
                </div>
              )}

              {newColumnType === "ENUM" && (
                <div className="space-y-2">
                  <Label htmlFor="enumValues">
                    Enum Values (comma separated)
                  </Label>
                  <Input
                    id="enumValues"
                    value={enumValues}
                    onChange={(e) => setEnumValues(e.target.value)}
                    placeholder="e.g. SMALL, MEDIUM, LARGE"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPrimaryKey"
                    checked={isPrimaryKey}
                    onCheckedChange={(checked) => {
                      setIsPrimaryKey(checked as boolean);
                      if (checked) {
                        setIsNullable(false);
                        setIsUnique(true);
                      }
                    }}
                  />
                  <Label htmlFor="isPrimaryKey">Primary Key</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isNullable"
                    checked={isNullable}
                    disabled={isPrimaryKey}
                    onCheckedChange={(checked) =>
                      setIsNullable(checked as boolean)
                    }
                  />
                  <Label htmlFor="isNullable">Nullable</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isUnique"
                    checked={isUnique || isPrimaryKey}
                    disabled={isPrimaryKey}
                    onCheckedChange={(checked) =>
                      setIsUnique(checked as boolean)
                    }
                  />
                  <Label htmlFor="isUnique">Unique</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasDefault"
                    checked={hasDefaultValue}
                    onCheckedChange={(checked) =>
                      setHasDefaultValue(checked as boolean)
                    }
                  />
                  <Label htmlFor="hasDefault">Default Value</Label>
                </div>

                {hasDefaultValue && (
                  <Input
                    placeholder="Enter default value"
                    value={defaultValue}
                    onChange={(e) => setDefaultValue(e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasCheck"
                    checked={hasCheckConstraint}
                    onCheckedChange={(checked) =>
                      setHasCheckConstraint(checked as boolean)
                    }
                  />
                  <Label htmlFor="hasCheck">Check Constraint</Label>
                </div>

                {hasCheckConstraint && (
                  <Input
                    placeholder="e.g. price > 0"
                    value={checkExpression}
                    onChange={(e) => setCheckExpression(e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="columnComment">Column Comment</Label>
                <Input
                  id="columnComment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Documentation for this column"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddColumn}>
              {editingColumnId ? "Update Column" : "Add Column"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableNode;
