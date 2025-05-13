// src/components/SQLPanel.tsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DiagramState } from "@/types";
import { generateSQL, formatSQLForDisplay } from "@/utils/sqlGenerator";
import { Button } from "@/components/ui/button";
import {
  Download,
  Copy,
  Database,
  Check,
  Eye,
  EyeOff,
  PanelLeftClose,
  PanelRightClose,
  Code,
  Search,
  WrapText,
  Pin,
  PinOff,
  // FileJson, // Not used
  // FileCode, // Not used
  // FileTextIcon, // Not used
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
import { exportDiagram, ExportFormat } from "@/utils/exportManager";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SQLPanelProps {
  diagramState: DiagramState;
  initialDialect?: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
}

const SQLPanel = ({
  diagramState,
  initialDialect = "mysql",
  isVisible,
  onToggleVisibility,
  isPinned,
  onTogglePin,
}: SQLPanelProps) => {
  const [activeTab, setActiveTab] = useState("sql");
  const [wordWrap, setWordWrap] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDialect, setSelectedDialect] = useState(initialDialect);
  const [copied, setCopied] = useState(false);

  const sql = useMemo(() => {
    return generateSQL(diagramState, selectedDialect);
  }, [diagramState, selectedDialect]);

  const jsonContent = useMemo(() => {
    return JSON.stringify(diagramState, null, 2);
  }, [diagramState]);

  const ormCode = useMemo(() => {
    let orm = `// Example Sequelize ORM code for ${selectedDialect}\n`;
    orm += `const { DataTypes } = require('sequelize');\n\n`;
    orm += `module.exports = (sequelize) => {\n`;

    diagramState.nodes.forEach((node) => {
      orm += `  const ${node.data.tableName} = sequelize.define('${node.data.tableName}', {\n`;
      node.data.columns.forEach((col, index, arr) => {
        let type = `DataTypes.${
          col.type === "INT"
            ? "INTEGER"
            : col.type === "VARCHAR"
            ? `STRING(${col.length || 255})`
            : col.type.toUpperCase()
        }`;
        if (col.type === "BOOLEAN") type = "DataTypes.BOOLEAN";
        if (col.type === "DATE") type = "DataTypes.DATE";
        if (col.type === "TIMESTAMP") type = "DataTypes.DATE";
        if (col.type === "TEXT") type = "DataTypes.TEXT";
        if (col.type === "FLOAT" || col.type === "DOUBLE")
          type = "DataTypes.FLOAT";
        if (col.type === "DECIMAL")
          type = `DataTypes.DECIMAL(${col.precision || 10}, ${col.scale || 2})`;
        if (col.type === "JSON") type = "DataTypes.JSON";
        if (col.type === "UUID") type = "DataTypes.UUID";

        orm += `    ${col.name}: {\n`;
        orm += `      type: ${type},\n`;
        if (col.isPrimaryKey) orm += `      primaryKey: true,\n`;
        if (col.isAutoIncrement) orm += `      autoIncrement: true,\n`;
        if (!col.isNullable) orm += `      allowNull: false,\n`;
        if (col.isUnique) orm += `      unique: true,\n`;
        const defaultConstraint = col.constraints?.find(
          (c) => c.type === "DEFAULT"
        );
        if (defaultConstraint?.defaultValue !== undefined) {
          let defVal = defaultConstraint.defaultValue;
          if (
            typeof defVal === "string" &&
            col.type !== "VARCHAR" &&
            col.type !== "TEXT" &&
            col.type !== "CHAR"
          ) {
            if (!isNaN(Number(defVal))) defVal = Number(defVal);
            else if (defVal.toLowerCase() === "true") defVal = true;
            else if (defVal.toLowerCase() === "false") defVal = false;
            else defVal = `'${String(defVal).replace(/'/g, "''")}'`;
          } else if (typeof defVal === "string") {
            defVal = `'${defVal.replace(/'/g, "''")}'`;
          }
          orm += `      defaultValue: ${defVal},\n`;
        }
        orm += `    }${index === arr.length - 1 ? "" : ","}\n`;
      });
      orm += `  });\n\n`;
    });

    diagramState.edges.forEach((edge) => {
      const sourceNode = diagramState.nodes.find((n) => n.id === edge.source);
      const targetNode = diagramState.nodes.find((n) => n.id === edge.target);
      if (!sourceNode || !targetNode || !edge.data) return;
      const fkColumn = targetNode.data.columns.find(
        (c) => c.name === edge.data?.targetColumn
      );

      if (fkColumn) {
        orm += `  ${sourceNode.data.tableName}.hasMany(${targetNode.data.tableName}, { foreignKey: '${fkColumn.name}' });\n`;
        orm += `  ${targetNode.data.tableName}.belongsTo(${sourceNode.data.tableName}, { foreignKey: '${fkColumn.name}' });\n\n`;
      }
    });

    orm += `  return {\n    ${diagramState.nodes
      .map((n) => n.data.tableName)
      .join(",\n    ")}\n  };\n`;
    orm += `};`;
    return orm;
  }, [diagramState, selectedDialect]);

  const getContentForTab = (tab: string) => {
    switch (tab) {
      case "sql":
        return sql;
      case "json":
        return jsonContent;
      case "orm":
        return ormCode;
      default:
        return "";
    }
  };

  const getFormattedContentForTab = (tab: string) => {
    switch (tab) {
      case "sql":
        const baseFormatted = formatSQLForDisplay(sql);
        if (!searchTerm) return baseFormatted;
        const regex = new RegExp(
          searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "gi"
        );
        return baseFormatted.replace(
          regex,
          (match) =>
            `<span class="bg-yellow-300 dark:bg-yellow-700 text-black dark:text-white rounded px-0.5">${match}</span>`
        );
      case "json":
        return jsonContent;
      case "orm":
        return ormCode;
      default:
        return "";
    }
  };

  const handleCopy = () => {
    const contentToCopy = getContentForTab(activeTab);
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    toast.success(`${activeTab.toUpperCase()} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = getContentForTab(activeTab);
    const fileType =
      activeTab === "sql" ? "sql" : activeTab === "json" ? "json" : "js";
    const fileName = `erd_schema.${fileType}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${fileName} downloaded`);
  };

  const handleExportDiagramImage = async (format: ExportFormat) => {
    try {
      const exported = await exportDiagram(diagramState, format, {
        dialect: selectedDialect,
      });
      if (exported instanceof Blob) {
        // Or check for string if exportDiagram can return URL
        const url = URL.createObjectURL(exported);
        const a = document.createElement("a");
        a.href = url;
        a.download = `erd_diagram.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Diagram exported as ${format.toUpperCase()}`);
      } else {
        toast.error(`Export failed: Unexpected format received.`);
      }
    } catch (error) {
      console.error(`Error exporting as ${format}:`, error);
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  const renderLineNumbers = (content: string) => {
    if (!lineNumbers) return null;
    const lines = content.split("\n").length;
    return (
      <div className="absolute left-0 top-0 bottom-0 w-8 pt-3 pr-2 text-right select-none text-muted-foreground/50 dark:text-muted-foreground/30 text-xs">
        {Array.from({ length: lines }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
    );
  };

  if (!isVisible && !isPinned) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleVisibility}
              className="fixed bottom-4 right-4 z-50 shadow-lg bg-background hover:bg-muted"
              aria-label="Show SQL Panel"
            >
              <PanelRightClose className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Show Code Panel</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={`fixed bottom-0 right-0 z-40 h-[40%] w-full md:w-[35%] max-h-[600px] min-h-[250px] flex flex-col bg-card border-t md:border-t-0 md:border-l border-border shadow-xl transition-transform duration-300 ease-in-out ${
        isVisible || isPinned ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <TooltipProvider delayDuration={100}>
        <div className="bg-muted/50 p-2 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Code Output</span>
          </div>
          <div className="flex items-center space-x-1">
            <Select value={selectedDialect} onValueChange={setSelectedDialect}>
              <SelectTrigger className="h-7 w-auto text-xs px-2 border-border bg-background">
                <SelectValue placeholder="Dialect" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_DIALECTS.map((d) => (
                  <SelectItem key={d.key} value={d.key} className="text-xs">
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onTogglePin}
                  className="h-7 w-7"
                >
                  {isPinned ? (
                    <PinOff className="h-4 w-4" />
                  ) : (
                    <Pin className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isPinned ? "Unpin Panel" : "Pin Panel"}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleVisibility}
                  className="h-7 w-7"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Hide Panel</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* MODIFICATION START: Wrap TabsList and TabsContent within a single Tabs component */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-grow overflow-hidden"
        >
          <div className="flex items-center justify-between px-2 py-1 border-b border-border">
            <TabsList className="bg-transparent p-0 h-auto">
              <TabsTrigger
                value="sql"
                className="text-xs px-3 py-1.5 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-muted rounded-none"
              >
                SQL
              </TabsTrigger>
              <TabsTrigger
                value="json"
                className="text-xs px-3 py-1.5 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-muted rounded-none"
              >
                JSON
              </TabsTrigger>
              <TabsTrigger
                value="orm"
                className="text-xs px-3 py-1.5 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-muted rounded-none"
              >
                ORM
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center space-x-1">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search code..."
                className="h-7 text-xs w-32 bg-background border-border focus-visible:ring-primary"
                type="search"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={wordWrap}
                    onPressedChange={setWordWrap}
                    size="sm"
                    aria-label="Toggle word wrap"
                    className="h-7 w-7 data-[state=on]:bg-primary/20"
                  >
                    <WrapText className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Word Wrap</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={lineNumbers}
                    onPressedChange={setLineNumbers}
                    size="sm"
                    aria-label="Toggle line numbers"
                    className="h-7 w-7 data-[state=on]:bg-primary/20"
                  >
                    <Code className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Line Numbers</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={darkMode}
                    onPressedChange={setDarkMode}
                    size="sm"
                    aria-label="Toggle theme"
                    className="h-7 w-7 data-[state=on]:bg-primary/20"
                  >
                    {darkMode ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{darkMode ? "Light Mode" : "Dark Mode"}</p>
                </TooltipContent>
              </Tooltip>
              <Separator orientation="vertical" className="h-5 mx-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="h-7 w-7"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDownload}
                    className="h-7 w-7"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <ScrollArea className="flex-1 bg-background dark:bg-zinc-900">
            <TabsContent
              value="sql"
              className="m-0 h-full text-sm outline-none focus-visible:ring-0"
            >
              <div
                className={`relative font-mono ${
                  darkMode ? "dark editor-dark" : "editor-light"
                }`}
              >
                {renderLineNumbers(sql)}
                <pre
                  className={`p-3 outline-none ${
                    wordWrap
                      ? "whitespace-pre-wrap break-all"
                      : "whitespace-pre"
                  } ${lineNumbers ? "pl-10" : ""}`}
                  dangerouslySetInnerHTML={{
                    __html: getFormattedContentForTab("sql"),
                  }}
                />
              </div>
            </TabsContent>
            <TabsContent
              value="json"
              className="m-0 h-full text-sm outline-none focus-visible:ring-0"
            >
              <div
                className={`relative font-mono ${
                  darkMode ? "dark editor-dark" : "editor-light"
                }`}
              >
                {renderLineNumbers(jsonContent)}
                <pre
                  className={`p-3 outline-none ${
                    wordWrap
                      ? "whitespace-pre-wrap break-all"
                      : "whitespace-pre"
                  } ${lineNumbers ? "pl-10" : ""}`}
                >
                  {jsonContent}
                </pre>
              </div>
            </TabsContent>
            <TabsContent
              value="orm"
              className="m-0 h-full text-sm outline-none focus-visible:ring-0"
            >
              <div
                className={`relative font-mono ${
                  darkMode ? "dark editor-dark" : "editor-light"
                }`}
              >
                {renderLineNumbers(ormCode)}
                <pre
                  className={`p-3 outline-none ${
                    wordWrap
                      ? "whitespace-pre-wrap break-all"
                      : "whitespace-pre"
                  } ${lineNumbers ? "pl-10" : ""}`}
                >
                  {ormCode}
                </pre>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
        {/* MODIFICATION END */}

        <div className="bg-muted/50 text-xs p-1.5 flex justify-between items-center border-t border-border">
          <div className="text-muted-foreground">
            {diagramState.nodes.length} tables, {diagramState.edges.length}{" "}
            relationships
          </div>
          <div className="flex gap-2">
            <Button
              variant="link"
              size="sm"
              className="h-6 text-xs px-2 text-muted-foreground hover:text-primary"
              onClick={() => handleExportDiagramImage("png")}
            >
              Export PNG
            </Button>
            <Button
              variant="link"
              size="sm"
              className="h-6 text-xs px-2 text-muted-foreground hover:text-primary"
              onClick={() => handleExportDiagramImage("svg")}
            >
              Export SVG
            </Button>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default SQLPanel;
