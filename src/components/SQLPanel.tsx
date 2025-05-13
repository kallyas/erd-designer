// src/components/SQLPanel.tsx
import { useMemo, useState, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DiagramState } from "@/types";
import { generateSQL, formatSQLForDisplay, parseSQL } from "@/utils/sqlGenerator";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Copy, 
  FileType, 
  Database, 
  Check,
  Clipboard,
  Eye,
  EyeOff, 
  RefreshCw,
  PanelLeft,
  Code,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_DIALECTS } from "@/utils/dialectManager";
import { exportDiagram } from "@/utils/exportManager";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";

interface SQLPanelProps {
  diagramState: DiagramState;
  dialect?: string;
}

const SQLPanel = ({ diagramState, dialect = "mysql" }: SQLPanelProps) => {
  const [activeTab, setActiveTab] = useState("sql");
  const [jsonVisible, setJsonVisible] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDialect, setSelectedDialect] = useState(dialect);
  const [copied, setCopied] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  const sql = useMemo(() => {
    return generateSQL(diagramState, selectedDialect);
  }, [diagramState, selectedDialect]);
  
  const formattedSql = useMemo(() => {
    return formatSQLForDisplay(sql);
  }, [sql]);
  
  // Filter SQL based on search term
  const filteredSql = useMemo(() => {
    if (!searchTerm) return formattedSql;
    
    const regex = new RegExp(searchTerm, 'gi');
    return formattedSql.replace(
      regex, 
      (match) => `<span class="bg-yellow-200 text-black">${match}</span>`
    );
  }, [formattedSql, searchTerm]);
  
  // Generate ORM code (simplified for example)
  const ormCode = useMemo(() => {
    return `// Example Sequelize ORM code
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  ${diagramState.nodes.map(node => `
  const ${node.data.tableName} = sequelize.define('${node.data.tableName}', {
    ${node.data.columns.map(col => `
    ${col.name}: {
      type: DataTypes.${col.type === 'INT' ? 'INTEGER' : col.type === 'VARCHAR' ? `STRING(${col.length || 255})` : col.type},
      ${col.isPrimaryKey ? 'primaryKey: true,' : ''}
      ${!col.isNullable ? 'allowNull: false,' : ''}
      ${col.isUnique ? 'unique: true,' : ''}
    }`).join(',')}
  });
  `).join('\n')}
  
  // Define associations
  ${diagramState.edges.map(edge => {
    const sourceNode = diagramState.nodes.find(n => n.id === edge.source);
    const targetNode = diagramState.nodes.find(n => n.id === edge.target);
    if (!sourceNode || !targetNode) return '';
    
    return `
  ${sourceNode.data.tableName}.hasMany(${targetNode.data.tableName});
  ${targetNode.data.tableName}.belongsTo(${sourceNode.data.tableName});`;
  }).join('\n')}
  
  return sequelize.models;
};`;
  }, [diagramState]);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeTab === 'sql' ? sql : activeTab === 'json' ? JSON.stringify(diagramState, null, 2) : ormCode);
    setCopied(true);
    toast.success(`${activeTab.toUpperCase()} code copied to clipboard`);
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleDownload = () => {
    const content = activeTab === 'sql' ? sql : activeTab === 'json' ? JSON.stringify(diagramState, null, 2) : ormCode;
    const fileType = activeTab === 'sql' ? 'sql' : activeTab === 'json' ? 'json' : 'js';
    const fileName = `erd_schema.${fileType}`;
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${activeTab.toUpperCase()} file downloaded`);
  };
  
  const handleExport = async (format: string) => {
    try {
      const exported = await exportDiagram(diagramState, format as any, {
        dialect: selectedDialect
      });
      
      if (typeof exported === 'string') {
        const