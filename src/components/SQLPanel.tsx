// src/components/SQLPanel.tsx - Updated with improved theming
import { useMemo, useState, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DiagramState } from "@/types";
import {
  generateSQL,
  formatSQLForDisplay,
  parseSQL,
} from "@/utils/sqlGenerator";
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
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

    const regex = new RegExp(searchTerm, "gi");
    return formattedSql.replace(
      regex,
      (match) => `<span class="bg-yellow-200 dark:bg-yellow-900 text-black dark:text-white">${match}</span>`
    );
  }, [formattedSql, searchTerm]);

  // Generate ORM code (simplified for example)
  const ormCode = useMemo(() => {
    return `// Example Sequelize ORM code
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  ${diagramState.nodes
    .map(
      (node) => `
  const ${node.data.tableName} = sequelize.define('${node.data.tableName}', {
    ${node.data.columns
      .map(
        (col) => `
    ${col.name}: {
      type: DataTypes.${
        col.type === "INT"
          ? "INTEGER"
          : col.type === "VARCHAR"
          ? `STRING(${col.length || 255})`
          : col.type
      },
      ${col.isPrimaryKey ? "primaryKey: true," : ""}
      ${!col.isNullable ? "allowNull: false," : ""}
      ${col.isUnique ? "unique: true," : ""}
    }`
      )
      .join(",")}
  });
  `
    )
    .join("\n")}
  
  // Define associations
  ${diagramState.edges
    .map((edge) => {
      const sourceNode = diagramState.nodes.find((n) => n.id === edge.source);
      const targetNode = diagramState.nodes.find((n) => n.id === edge.target);
      if (!sourceNode || !targetNode) return "";

      return `
  ${sourceNode.data.tableName}.hasMany(${targetNode.data.tableName});
  ${targetNode.data.tableName}.belongsTo(${sourceNode.data.tableName});`;
    })
    .join("\n")}
  
  return sequelize.models;
};`;
  }, [diagramState]);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      activeTab === "sql"
        ? sql
        : activeTab === "json"
        ? JSON.stringify(diagramState, null, 2)
        : ormCode
    );
    setCopied(true);
    toast.success(`${activeTab.toUpperCase()} code copied to clipboard`);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleDownload = () => {
    const content =
      activeTab === "sql"
        ? sql
        : activeTab === "json"
        ? JSON.stringify(diagramState, null, 2)
        : ormCode;
    const fileType =
      activeTab === "sql" ? "sql" : activeTab === "json" ? "json" : "js";
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
        dialect: selectedDialect,
      });

      if (typeof exported === "string") {
        const blob = new Blob([exported], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `erd_diagram.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Exported as ${format.toUpperCase()}`);
      } else if (exported instanceof Blob) {
        const url = URL.createObjectURL(exported);
        const a = document.createElement("a");
        a.href = url;
        a.download = `erd_diagram.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error(`Error exporting as ${format}:`, error);
      toast.error(`Failed to export as ${format}`);
    }
  };

  const handleDialectChange = (newDialect: string) => {
    setSelectedDialect(newDialect);
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-md shadow-md overflow-hidden animate-fade-in">
      <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between">
        <div className="flex items-center">
          <Database className="h-5 w-5 mr-2" />
          <span className="font-semibold">SQL Output</span>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={selectedDialect} onValueChange={handleDialectChange}>
            <SelectTrigger className="h-8 w-36 bg-primary-foreground/20 border-primary-foreground/20">
              <SelectValue placeholder="Select dialect" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_DIALECTS.map((dialect) => (
                <SelectItem key={dialect.key} value={dialect.key}>
                  {dialect.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="bg-primary-foreground/20 rounded-md flex items-center">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="h-8 bg-transparent border-0 w-40 text-primary-foreground placeholder:text-primary-foreground/70"
            />
            <Search className="h-4 w-4 mr-2 text-primary-foreground/70" />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex border-b border-border bg-card">
          <div className="flex-grow">
            <TabsList className="bg-muted h-10">
              <TabsTrigger
                value="sql"
                className="px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-primary rounded-t-md data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                SQL
              </TabsTrigger>
              <TabsTrigger
                value="json"
                className="px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-primary rounded-t-md data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                JSON
              </TabsTrigger>
              <TabsTrigger
                value="orm"
                className="px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-primary rounded-t-md data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                ORM
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex items-center px-2 space-x-1">
            <Toggle
              pressed={wordWrap}
              onPressedChange={setWordWrap}
              size="sm"
              variant="outline"
              aria-label="Toggle word wrap"
              className="h-8 w-8 p-0 bg-muted data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
            >
              <PanelLeft className="h-4 w-4" />
            </Toggle>

            <Toggle
              pressed={darkMode}
              onPressedChange={setDarkMode}
              size="sm"
              variant="outline"
              aria-label="Toggle dark mode"
              className="h-8 w-8 p-0 bg-muted data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
            >
              {darkMode ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Toggle>

            <Toggle
              pressed={lineNumbers}
              onPressedChange={setLineNumbers}
              size="sm"
              variant="outline"
              aria-label="Toggle line numbers"
              className="h-8 w-8 p-0 bg-muted data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
            >
              <Code className="h-4 w-4" />
            </Toggle>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="sql" className="m-0 h-full">
            <div
              className={`sql-panel h-full ${
                darkMode ? "dark" : ""
              }`}
            >
              <pre
                className={`sql-panel__content ${
                  wordWrap ? "whitespace-pre-wrap" : "whitespace-pre"
                } ${lineNumbers ? "pl-10 relative" : "p-4"}`}
                dangerouslySetInnerHTML={{ __html: filteredSql }}
              />
            </div>
          </TabsContent>

          <TabsContent value="json" className="m-0 h-full">
            <div
              className={`sql-panel h-full ${
                darkMode ? "dark" : ""
              }`}
            >
              <pre
                className={`sql-panel__content ${
                  wordWrap ? "whitespace-pre-wrap" : "whitespace-pre"
                } ${lineNumbers ? "pl-10 relative" : "p-4"}`}
              >
                {JSON.stringify(diagramState, null, 2)}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="orm" className="m-0 h-full">
            <div
              className={`sql-panel h-full ${
                darkMode ? "dark" : ""
              }`}
            >
              <pre
                className={`sql-panel__content ${
                  wordWrap ? "whitespace-pre-wrap" : "whitespace-pre"
                } ${lineNumbers ? "pl-10 relative" : "p-4"}`}
              >
                {ormCode}
              </pre>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <div className="bg-muted text-muted-foreground text-xs p-2 flex justify-between items-center border-t border-border">
        <div>
          {diagramState.nodes.length} tables, {diagramState.edges.length}{" "}
          relationships
        </div>
        <div className="flex gap-2">
          {activeTab === "sql" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs px-2 bg-muted-foreground/10 hover:bg-muted-foreground/20 border-0"
                onClick={() => handleExport("pdf")}
              >
                Export as PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs px-2 bg-muted-foreground/10 hover:bg-muted-foreground/20 border-0"
                onClick={() => handleExport("png")}
              >
                Export as PNG
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SQLPanel;