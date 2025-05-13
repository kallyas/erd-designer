
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
import { TableData, ColumnType, Column, Constraint } from "@/types";
import { Key, Database, Table, Check, Fingerprint } from "lucide-react";

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
  const [isUnique, setIsUnique] = useState(false);
  const [hasDefaultValue, setHasDefaultValue] = useState(false);
  const [defaultValue, setDefaultValue] = useState("");
  const [hasCheckConstraint, setHasCheckConstraint] = useState(false);
  const [checkExpression, setCheckExpression] = useState("");
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);

  const handleSaveTableName = () => {
    data.tableName = tableName;
    setIsEditing(false);
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;

    const constraints: Constraint[] = [];
    
    if (hasDefaultValue && defaultValue) {
      constraints.push({
        type: 'DEFAULT',
        defaultValue
      });
    }
    
    if (hasCheckConstraint && checkExpression) {
      constraints.push({
        type: 'CHECK',
        expression: checkExpression
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
      constraints: constraints.length > 0 ? constraints : undefined
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
    resetForm();
    setNewColumnDialogOpen(false);
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
    setEditingColumnId(null);
  };

  const handleEditColumn = (column: Column) => {
    setNewColumnName(column.name);
    setNewColumnType(column.type);
    setNewColumnLength(column.length || 255);
    setIsPrimaryKey(column.isPrimaryKey);
    setIsNullable(column.isNullable);
    setIsUnique(column.isUnique || false);
    
    const defaultConstraint = column.constraints?.find(c => c.type === 'DEFAULT');
    setHasDefaultValue(!!defaultConstraint);
    setDefaultValue(defaultConstraint?.defaultValue || "");
    
    const checkConstraint = column.constraints?.find(c => c.type === 'CHECK');
    setHasCheckConstraint(!!checkConstraint);
    setCheckExpression(checkConstraint?.expression || "");
    
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
        className="bg-mono-800 border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-target`}
        isConnectable={isConnectable}
        className="bg-mono-800 border-white"
      />
      
      <div className="table-node__header">
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <Input 
              value={tableName} 
              onChange={(e) => setTableName(e.target.value)}
              className="text-mono-900 h-7 py-1 px-2 text-sm"
            />
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
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-mono-300" />
              <span>{data.tableName}</span>
            </div>
            <Button 
              onClick={() => setIsEditing(true)} 
              variant="ghost" 
              size="sm"
              className="h-6 w-6 p-0 text-mono-100 hover:bg-mono-700 hover:text-mono-100 rounded-full"
            >
              ✏️
            </Button>
          </div>
        )}
      </div>

      <div className="table-node__content">
        {data.columns.map(column => (
          <div key={column.id} className="table-node__row">
            <div className="flex items-center">
              {column.isPrimaryKey && <span className="table-node__row-pk" title="Primary Key"><Key className="h-3.5 w-3.5" /></span>}
              {column.isForeignKey && <span className="table-node__row-fk" title="Foreign Key"><Fingerprint className="h-3.5 w-3.5" /></span>}
              {column.isUnique && <span className="table-node__row-unique" title="Unique Constraint"><Table className="h-3.5 w-3.5" /></span>}
              {column.constraints?.some(c => c.type === 'CHECK') && <span className="table-node__row-check" title="Check Constraint"><Check className="h-3.5 w-3.5" /></span>}
            </div>
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
                className="h-5 w-5 p-0 text-mono-500 hover:bg-mono-200 hover:text-mono-700 rounded-full"
              >
                ✏️
              </Button>
              <Button 
                onClick={() => handleDeleteColumn(column.id)} 
                variant="ghost" 
                size="sm"
                className="h-5 w-5 p-0 text-mono-500 hover:bg-mono-200 hover:text-mono-700 rounded-full"
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
          resetForm();
          setNewColumnDialogOpen(true);
        }}
      >
        + Add Column
      </button>

      <Dialog open={newColumnDialogOpen} onOpenChange={setNewColumnDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
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
                  onCheckedChange={(checked) => setIsNullable(checked as boolean)} 
                />
                <Label htmlFor="isNullable">Nullable</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isUnique" 
                  checked={isUnique || isPrimaryKey}
                  disabled={isPrimaryKey}
                  onCheckedChange={(checked) => setIsUnique(checked as boolean)} 
                />
                <Label htmlFor="isUnique">Unique</Label>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hasDefault" 
                  checked={hasDefaultValue}
                  onCheckedChange={(checked) => setHasDefaultValue(checked as boolean)}
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
                  onCheckedChange={(checked) => setHasCheckConstraint(checked as boolean)}
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
