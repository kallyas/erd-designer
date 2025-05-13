
import { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
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
import { TableData, ColumnType, Column } from "@/types";

interface TableNodeProps {
  id: string;
  data: TableData;
  isConnectable: boolean;
}

const TableNode = ({ id, data, isConnectable }: TableNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tableName, setTableName] = useState(data.tableName);
  const [newColumnDialogOpen, setNewColumnDialogOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState<ColumnType>("VARCHAR");
  const [newColumnLength, setNewColumnLength] = useState<number>(255);
  const [isPrimaryKey, setIsPrimaryKey] = useState(false);
  const [isNullable, setIsNullable] = useState(true);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);

  const handleSaveTableName = () => {
    data.tableName = tableName;
    setIsEditing(false);
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;

    const newColumn: Column = {
      id: `${id}-col-${Date.now()}`,
      name: newColumnName,
      type: newColumnType,
      length: newColumnType === "VARCHAR" ? newColumnLength : undefined,
      isPrimaryKey,
      isForeignKey: false,
      isNullable,
    };

    if (editingColumnId) {
      // Edit existing column
      data.columns = data.columns.map(col => 
        col.id === editingColumnId ? newColumn : col
      );
    } else {
      // Add new column
      data.columns.push(newColumn);
    }

    // Reset form
    setNewColumnName("");
    setNewColumnType("VARCHAR");
    setNewColumnLength(255);
    setIsPrimaryKey(false);
    setIsNullable(true);
    setEditingColumnId(null);
    setNewColumnDialogOpen(false);
  };

  const handleEditColumn = (column: Column) => {
    setNewColumnName(column.name);
    setNewColumnType(column.type);
    setNewColumnLength(column.length || 255);
    setIsPrimaryKey(column.isPrimaryKey);
    setIsNullable(column.isNullable);
    setEditingColumnId(column.id);
    setNewColumnDialogOpen(true);
  };

  const handleDeleteColumn = (columnId: string) => {
    data.columns = data.columns.filter(col => col.id !== columnId);
  };

  return (
    <div className="table-node">
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-source`}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-erd-primary-dark"
      />
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-target`}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-erd-bright-blue"
      />
      
      <div className="table-node__header bg-erd-primary">
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <Input 
              value={tableName} 
              onChange={(e) => setTableName(e.target.value)}
              className="text-black h-6 py-1 px-2 text-sm"
            />
            <Button 
              onClick={handleSaveTableName} 
              size="sm" 
              variant="default"
              className="h-6 py-1 px-2 text-xs bg-white text-erd-primary hover:bg-gray-100"
            >
              Save
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span>{data.tableName}</span>
            <Button 
              onClick={() => setIsEditing(true)} 
              variant="ghost" 
              size="sm"
              className="h-5 w-5 p-0 text-white hover:bg-erd-primary-dark hover:text-white"
            >
              ✏️
            </Button>
          </div>
        )}
      </div>

      <div className="table-node__content">
        {data.columns.map(column => (
          <div key={column.id} className="table-node__row">
            {column.isPrimaryKey && <span className="table-node__row-pk">🔑</span>}
            {column.isForeignKey && <span className="table-node__row-fk">🔗</span>}
            <span className="table-node__row-name">{column.name}</span>
            <span className="table-node__row-type">
              {column.type}{column.length ? `(${column.length})` : ''}
              {!column.isNullable && ' !'}
            </span>
            <div className="flex space-x-1">
              <Button 
                onClick={() => handleEditColumn(column)} 
                variant="ghost" 
                size="sm"
                className="h-5 w-5 p-0 text-gray-500 hover:bg-gray-100"
              >
                ✏️
              </Button>
              <Button 
                onClick={() => handleDeleteColumn(column.id)} 
                variant="ghost" 
                size="sm"
                className="h-5 w-5 p-0 text-gray-500 hover:bg-gray-100"
              >
                🗑️
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        className="table-node__add-column" 
        onClick={() => {
          setEditingColumnId(null); 
          setNewColumnName("");
          setNewColumnType("VARCHAR");
          setNewColumnLength(255);
          setIsPrimaryKey(false);
          setIsNullable(true);
          setNewColumnDialogOpen(true);
        }}
      >
        + Add Column
      </button>

      <Dialog open={newColumnDialogOpen} onOpenChange={setNewColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingColumnId ? "Edit Column" : "Add New Column"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
                onValueChange={(value) => setNewColumnType(value as ColumnType)}
              >
                <SelectTrigger id="columnType">
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INT">INT</SelectItem>
                  <SelectItem value="VARCHAR">VARCHAR</SelectItem>
                  <SelectItem value="TEXT">TEXT</SelectItem>
                  <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                  <SelectItem value="DATE">DATE</SelectItem>
                  <SelectItem value="TIMESTAMP">TIMESTAMP</SelectItem>
                  <SelectItem value="FLOAT">FLOAT</SelectItem>
                  <SelectItem value="DOUBLE">DOUBLE</SelectItem>
                  <SelectItem value="DECIMAL">DECIMAL</SelectItem>
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
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isPrimaryKey" 
                checked={isPrimaryKey}
                onCheckedChange={(checked) => setIsPrimaryKey(checked as boolean)} 
              />
              <Label htmlFor="isPrimaryKey">Primary Key</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isNullable" 
                checked={isNullable}
                onCheckedChange={(checked) => setIsNullable(checked as boolean)} 
              />
              <Label htmlFor="isNullable">Nullable</Label>
            </div>
          </div>
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
