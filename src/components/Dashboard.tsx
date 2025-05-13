// src/components/Dashboard.tsx
import React, { useState, useEffect, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DiagramState, TableTemplate } from "@/types";
import { SUPPORTED_DIALECTS } from "@/utils/dialectManager";
import {
  getAllTemplates,
  applyTemplate,
  createTemplateFromDiagram,
} from "@/utils/templateManager";
import {
  analyzeSchema,
  suggestAdvancedRelationships,
} from "@/utils/aiSuggestions";
import {
  applyGridLayout,
  applyCircularLayout,
  applyTreeLayout,
  applyForceDirectedLayout,
} from "@/utils/layoutAlgorithms";
import {
  getVersionHistory,
  saveVersion,
  loadVersion,
  compareVersions,
} from "@/utils/versionManager";
import { getCustomTypes } from "@/utils/customTypes";
import { exportDiagram } from "@/utils/exportManager";
import {
  Database,
  FileJson,
  FileCode,
  FileText,
  FilePlus,
  Grid,
  Circle,
  GitBranch,
  GitFork,
  Zap,
  Download,
  Upload,
  LayoutGrid,
  BrainCircuit,
  AlertTriangle,
  Settings,
  Workflow,
  Bot as Robot,
  Save,
  History,
} from "lucide-react";

interface DashboardProps {
  diagramState: DiagramState;
  onDiagramUpdate: (diagram: DiagramState) => void;
  onLayoutChange: (layout: string) => void;
  onDialectChange: (dialect: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  diagramState,
  onDiagramUpdate,
  onLayoutChange,
  onDialectChange,
}) => {
  const reactFlowInstance = useReactFlow();
  const [activeTab, setActiveTab] = useState("schema");
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [versionName, setVersionName] = useState("");
  const [versionDescription, setVersionDescription] = useState("");
  const [selectedDialect, setSelectedDialect] = useState<string>(
    diagramState.dialect || "mysql"
  );
  const [templates, setTemplates] = useState<TableTemplate[]>([]);
  const [versions, setVersions] = useState<
    ReturnType<typeof getVersionHistory>
  >([]);
  const [customTypes, setCustomTypes] = useState<
    ReturnType<typeof getCustomTypes>
  >([]);
  const [exportFormat, setExportFormat] = useState<
    "sql" | "png" | "pdf" | "json" | "orm"
  >("sql");
  const [ormType, setOrmType] = useState<
    "sequelize" | "typeorm" | "mongoose" | "prisma" | "sqlalchemy"
  >("sequelize");
  const [schemaSuggestions, setSchemaSuggestions] = useState<
    ReturnType<typeof analyzeSchema>
  >([]);
  const [relationshipSuggestions, setRelationshipSuggestions] = useState<
    ReturnType<typeof suggestAdvancedRelationships>
  >([]);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data
  useEffect(() => {
    setTemplates(getAllTemplates());
    setVersions(getVersionHistory());
    setCustomTypes(getCustomTypes());
  }, []);

  // Update dialect when changed
  useEffect(() => {
    if (selectedDialect !== diagramState.dialect) {
      onDialectChange(selectedDialect);
    }
  }, [selectedDialect, diagramState.dialect, onDialectChange]);

  // Generate suggestions when diagram changes
  useEffect(() => {
    if (diagramState.nodes.length > 0) {
      const suggestions = analyzeSchema(diagramState);
      const relationshipSuggestions =
        suggestAdvancedRelationships(diagramState);

      setSchemaSuggestions(suggestions);
      setRelationshipSuggestions(relationshipSuggestions);
    } else {
      setSchemaSuggestions([]);
      setRelationshipSuggestions([]);
    }
  }, [diagramState]);

  // Save version handler
  const handleSaveVersion = () => {
    if (!versionName) return;

    saveVersion(diagramState, versionName, versionDescription);
    setVersions(getVersionHistory());
    setShowVersionDialog(false);
    setVersionName("");
    setVersionDescription("");
  };

  // Load version handler
  const handleLoadVersion = (versionId: string) => {
    const loadedDiagram = loadVersion(versionId);
    if (loadedDiagram) {
      onDiagramUpdate(loadedDiagram);
    }
  };

  // Apply template handler
  const handleApplyTemplate = (template: TableTemplate) => {
    const newDiagram = applyTemplate(template);
    onDiagramUpdate(newDiagram);
    setShowTemplateDialog(false);
  };

  // Create new template from current diagram
  const handleCreateTemplate = () => {
    if (!newTemplateName) return;

    const template = createTemplateFromDiagram(
      diagramState,
      newTemplateName,
      newTemplateDescription
    );

    // Save template (would be implemented in templateManager.ts)
    // Then refresh templates list
    setTemplates(getAllTemplates());
    setNewTemplateName("");
    setNewTemplateDescription("");
  };

  // Apply layout handlers
  const handleApplyLayout = (layoutType: string) => {
    let updatedNodes;

    switch (layoutType) {
      case "grid":
        updatedNodes = applyGridLayout(diagramState.nodes);
        break;
      case "circular":
        updatedNodes = applyCircularLayout(diagramState.nodes);
        break;
      case "hierarchical":
        updatedNodes = applyTreeLayout(diagramState.nodes, diagramState.edges);
        break;
      case "force":
        updatedNodes = applyForceDirectedLayout(
          diagramState.nodes,
          diagramState.edges
        );
        break;
      default:
        return;
    }

    onDiagramUpdate({
      ...diagramState,
      nodes: updatedNodes,
    });

    onLayoutChange(layoutType);
  };

  // Export diagram handler
  const handleExportDiagram = async () => {
    try {
      const exportOptions = {
        reactFlowInstance: reactFlowInstance,
        dialect: selectedDialect,
        orm: ormType,
      };

      const exported = await exportDiagram(
        diagramState,
        exportFormat,
        exportOptions
      );

      // Handle different export types
      if (exported instanceof Blob) {
        // For binary formats (PNG, PDF)
        const url = URL.createObjectURL(exported);
        const a = document.createElement("a");
        a.href = url;
        a.download = `erd-diagram.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // For text formats (SQL, JSON, ORM code)
        const blob = new Blob([exported], {
          type: exportFormat === "json" ? "application/json" : "text/plain",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `erd-diagram.${
          exportFormat === "orm" ? "js" : exportFormat
        }`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setShowExportDialog(false);
    } catch (error) {
      console.error("Export failed:", error);
      // Show error toast or notification
    }
  };

  // Import diagram from file
  const handleImportFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onDiagramUpdate(json);
        setShowImportDialog(false);
      } catch (error) {
        console.error("Failed to parse imported file:", error);
        // Show error notification
      }
    };
    reader.readAsText(file);
  };

  // Apply a suggested relationship
  const handleApplySuggestion = (suggestion: any) => {
    // This would need to be implemented based on your diagram's structure
    // It would create a new relationship edge between the source and target tables
    console.log("Applying suggestion:", suggestion);

    // Find the nodes for the source and target tables
    const sourceNode = diagramState.nodes.find(
      (n) => n.data.tableName === suggestion.sourceTable
    );

    const targetNode = diagramState.nodes.find(
      (n) => n.data.tableName === suggestion.targetTable
    );

    if (!sourceNode || !targetNode) return;

    // Create a new edge
    const newEdge = {
      id: `edge-${Date.now()}`,
      source: sourceNode.id,
      target: targetNode.id,
      animated: true,
      data: {
        relationshipType: suggestion.relationshipType,
        sourceColumn: suggestion.sourceColumn || "id",
        targetColumn:
          suggestion.targetColumn ||
          `${suggestion.sourceTable.toLowerCase()}_id`,
      },
    };

    // Update diagram with new edge
    onDiagramUpdate({
      ...diagramState,
      edges: [...diagramState.edges, newEdge],
    });
  };

  return (
    <div className="p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="schema">
            <Database className="mr-2 h-4 w-4" />
            Schema
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FilePlus className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="versions">
            <GitBranch className="mr-2 h-4 w-4" />
            Versions
          </TabsTrigger>
          <TabsTrigger value="visualization">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Visualization
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            <BrainCircuit className="mr-2 h-4 w-4" />
            AI Suggestions
          </TabsTrigger>
          <TabsTrigger value="export">
            <FileText className="mr-2 h-4 w-4" />
            Export/Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Settings</CardTitle>
              <CardDescription>
                Configure database-specific options for your schema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SQL Dialect</label>
                  <Select
                    value={selectedDialect}
                    onValueChange={setSelectedDialect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select SQL dialect" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_DIALECTS.map((dialect) => (
                        <SelectItem key={dialect.key} value={dialect.key}>
                          {dialect.name}{" "}
                          {dialect.version && `(${dialect.version})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Types</label>
                  <div className="flex flex-wrap gap-2">
                    {customTypes.map((type) => (
                      <Badge key={type.name} variant="outline">
                        {type.name}: {type.baseType}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Custom Types
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schema Statistics</CardTitle>
              <CardDescription>
                Overview of your current database schema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Tables</div>
                  <div className="text-2xl font-bold">
                    {diagramState.nodes.length}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Relationships
                  </div>
                  <div className="text-2xl font-bold">
                    {diagramState.edges.length}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Total Columns
                  </div>
                  <div className="text-2xl font-bold">
                    {diagramState.nodes.reduce(
                      (sum, node) => sum + node.data.columns.length,
                      0
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Foreign Keys
                  </div>
                  <div className="text-2xl font-bold">
                    {diagramState.nodes.reduce(
                      (sum, node) =>
                        sum +
                        node.data.columns.filter((col) => col.isForeignKey)
                          .length,
                      0
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Available Templates</h3>
            <Button onClick={() => setShowTemplateDialog(true)}>
              Apply Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.name} className="overflow-hidden">
                <CardHeader className="p-4">
                  <CardTitle className="text-md">{template.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-xs">
                    <div className="font-medium mb-1">Includes:</div>
                    <ul className="list-disc pl-4 space-y-1">
                      {template.tables.map((table) => (
                        <li key={table.tableName}>{table.tableName}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="p-4 border-t flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => handleApplyTemplate(template)}
                  >
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Create New Template</CardTitle>
              <CardDescription>
                Save your current diagram as a reusable template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Template Name</label>
                  <Input
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g., User Authentication System"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newTemplateDescription}
                    onChange={(e) => setNewTemplateDescription(e.target.value)}
                    placeholder="Describe what this template includes..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleCreateTemplate}
                disabled={!newTemplateName}
              >
                Save as Template
              </Button>
            </CardFooter>
          </Card>

          <Dialog
            open={showTemplateDialog}
            onOpenChange={setShowTemplateDialog}
          >
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Apply Template</DialogTitle>
                <DialogDescription>
                  Select a template to apply to your diagram. This will add new
                  tables and relationships.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                {templates.map((template) => (
                  <Card
                    key={template.name}
                    className={`cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors`}
                    onClick={() => handleApplyTemplate(template)}
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="text-md">{template.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-xs">
                        <div className="font-medium mb-1">
                          Includes {template.tables.length} tables:
                        </div>
                        <ul className="list-disc pl-4 space-y-1">
                          {template.tables.slice(0, 5).map((table) => (
                            <li key={table.tableName}>{table.tableName}</li>
                          ))}
                          {template.tables.length > 5 && (
                            <li>...and {template.tables.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowTemplateDialog(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Version History</h3>
            <Button onClick={() => setShowVersionDialog(true)}>
              <Save className="mr-2 h-4 w-4" />
              Save Version
            </Button>
          </div>

          <div className="space-y-2">
            {versions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    No saved versions yet. Save a version to track changes over
                    time.
                  </p>
                </CardContent>
              </Card>
            ) : (
              versions.map((version, index) => (
                <Card key={version.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-md">
                          {version.version}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {new Date(version.date).toLocaleString()}
                        </CardDescription>
                      </div>
                      <Badge variant={index === 0 ? "default" : "outline"}>
                        {index === 0 ? "Latest" : `v${versions.length - index}`}
                      </Badge>
                    </div>
                  </CardHeader>
                  {version.changes && (
                    <CardContent className="p-4 pt-2 pb-0">
                      <p className="text-sm text-muted-foreground">
                        {version.changes}
                      </p>
                    </CardContent>
                  )}
                  <CardFooter className="p-4 flex justify-end gap-2">
                    {index !== 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Implement version diff visualization
                          const diff = compareVersions(
                            versions[0].id,
                            version.id
                          );
                          console.log("Version diff:", diff);
                          // Show diff in a modal
                        }}
                      >
                        Compare to Latest
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleLoadVersion(version.id)}
                    >
                      Restore
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>

          <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Version</DialogTitle>
                <DialogDescription>
                  Save the current state of your diagram as a version for future
                  reference.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Version Name</label>
                  <Input
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    placeholder="e.g., Initial Schema, v1.0.0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Description (optional)
                  </label>
                  <Textarea
                    value={versionDescription}
                    onChange={(e) => setVersionDescription(e.target.value)}
                    placeholder="Describe the changes in this version..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowVersionDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveVersion} disabled={!versionName}>
                  Save Version
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="visualization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Layout Options</CardTitle>
              <CardDescription>
                Change how your diagram is visually organized
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card
                  className="cursor-pointer hover:bg-accent transition-colors p-4 text-center"
                  onClick={() => handleApplyLayout("grid")}
                >
                  <Grid className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-medium">Grid Layout</div>
                </Card>

                <Card
                  className="cursor-pointer hover:bg-accent transition-colors p-4 text-center"
                  onClick={() => handleApplyLayout("circular")}
                >
                  <Circle className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-medium">Circular Layout</div>
                </Card>

                <Card
                  className="cursor-pointer hover:bg-accent transition-colors p-4 text-center"
                  onClick={() => handleApplyLayout("hierarchical")}
                >
                  <GitFork className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-medium">Hierarchical Layout</div>
                </Card>

                <Card
                  className="cursor-pointer hover:bg-accent transition-colors p-4 text-center"
                  onClick={() => handleApplyLayout("force")}
                >
                  <Workflow className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-medium">Force-Directed Layout</div>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize how tables and relationships are displayed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Table Style</label>
                  <Select defaultValue="default">
                    <SelectTrigger>
                      <SelectValue placeholder="Select table style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Relationship Style
                  </label>
                  <Select defaultValue="arrows">
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arrows">Arrows</SelectItem>
                      <SelectItem value="crow">Crow's Foot</SelectItem>
                      <SelectItem value="uml">UML Notation</SelectItem>
                      <SelectItem value="lines">Simple Lines</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Color Scheme</label>
                  <Select defaultValue="default">
                    <SelectTrigger>
                      <SelectValue placeholder="Select color scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="monochrome">Monochrome</SelectItem>
                      <SelectItem value="colorful">Colorful</SelectItem>
                      <SelectItem value="pastel">Pastel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BrainCircuit className="mr-2 h-5 w-5" />
                AI-Powered Schema Suggestions
              </CardTitle>
              <CardDescription>
                Intelligent recommendations to improve your database schema
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {schemaSuggestions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Robot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    No schema suggestions available. Add more tables and
                    relationships to get recommendations.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {schemaSuggestions.slice(0, 10).map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="border-b last:border-0 px-6 py-3 hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {suggestion.priority === "high" ? (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          ) : suggestion.priority === "medium" ? (
                            <AlertTriangle className="h-4 w-4 text-blue-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="font-medium">
                            {suggestion.description}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {suggestion.reason}
                          </div>
                          {suggestion.columnName && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">
                                Column:{" "}
                              </span>
                              <Badge variant="outline">
                                {suggestion.columnName}
                              </Badge>
                            </div>
                          )}
                          {suggestion.action && (
                            <div className="mt-2">
                              <code className="text-xs bg-muted p-1 rounded">
                                {suggestion.action}
                              </code>
                            </div>
                          )}
                        </div>
                        {suggestion.action && (
                          <Button size="sm" variant="outline">
                            Apply
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2 h-5 w-5" />
                Suggested Relationships
              </CardTitle>
              <CardDescription>
                AI-detected potential relationships between tables
              </CardDescription>
            </CardHeader>
            <CardContent>
              {relationshipSuggestions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <div className="flex justify-center mb-4">
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                      <div className="h-2 w-2 bg-gray-400 rounded-full" />
                    </div>
                    <div className="mx-2 h-px w-12 bg-gray-200 self-center" />
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                      <div className="h-2 w-2 bg-gray-400 rounded-full" />
                    </div>
                  </div>
                  <p>
                    No relationship suggestions available. Add more tables to
                    get recommendations.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {relationshipSuggestions.map((suggestion, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="p-4 flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {suggestion.sourceTable} → {suggestion.targetTable}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Suggested {suggestion.relationshipType} relationship
                          </div>
                          <div className="mt-1 text-xs">
                            {suggestion.reason}
                          </div>
                          <div className="mt-2">
                            <Badge variant="outline">
                              Confidence:{" "}
                              {Math.round(suggestion.confidence * 100)}%
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleApplySuggestion(suggestion)}
                        >
                          Apply
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Export your diagram in various formats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card
                  className="cursor-pointer hover:bg-accent transition-colors p-4 text-center"
                  onClick={() => {
                    setExportFormat("sql");
                    setShowExportDialog(true);
                  }}
                >
                  <Database className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-medium">SQL Script</div>
                </Card>

                <Card
                  className="cursor-pointer hover:bg-accent transition-colors p-4 text-center"
                  onClick={() => {
                    setExportFormat("json");
                    setShowExportDialog(true);
                  }}
                >
                  <FileJson className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-medium">JSON</div>
                </Card>

                <Card
                  className="cursor-pointer hover:bg-accent transition-colors p-4 text-center"
                  onClick={() => {
                    setExportFormat("png");
                    setShowExportDialog(true);
                  }}
                >
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-medium">PNG Image</div>
                </Card>

                <Card
                  className="cursor-pointer hover:bg-accent transition-colors p-4 text-center"
                  onClick={() => {
                    setExportFormat("pdf");
                    setShowExportDialog(true);
                  }}
                >
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-medium">PDF Document</div>
                </Card>

                <Card
                  className="cursor-pointer hover:bg-accent transition-colors p-4 text-center"
                  onClick={() => {
                    setExportFormat("orm");
                    setShowExportDialog(true);
                  }}
                >
                  <FileCode className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-medium">ORM Code</div>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import Diagram</CardTitle>
              <CardDescription>
                Import a diagram from a file or URL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-lg">
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center mb-4">
                  Drag and drop a file here, or click to browse
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".json"
                  onChange={handleFileChange}
                />
                <Button onClick={handleImportFile}>
                  <Upload className="mr-2 h-4 w-4" />
                  Browse Files
                </Button>
              </div>
            </CardContent>
          </Card>

          <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Diagram</DialogTitle>
                <DialogDescription>
                  Configure export options for your diagram
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Export Format</label>
                  <Select
                    value={exportFormat}
                    onValueChange={(value: any) => setExportFormat(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select export format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sql">SQL Script</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="png">PNG Image</SelectItem>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="orm">ORM Code</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {exportFormat === "sql" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">SQL Dialect</label>
                    <Select
                      value={selectedDialect}
                      onValueChange={setSelectedDialect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select SQL dialect" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_DIALECTS.map((dialect) => (
                          <SelectItem key={dialect.key} value={dialect.key}>
                            {dialect.name}{" "}
                            {dialect.version && `(${dialect.version})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {exportFormat === "orm" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ORM Type</label>
                    <Select
                      value={ormType}
                      onValueChange={(value: any) => setOrmType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ORM type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sequelize">
                          Sequelize (Node.js)
                        </SelectItem>
                        <SelectItem value="typeorm">
                          TypeORM (TypeScript)
                        </SelectItem>
                        <SelectItem value="mongoose">
                          Mongoose (MongoDB)
                        </SelectItem>
                        <SelectItem value="prisma">Prisma (Node.js)</SelectItem>
                        <SelectItem value="sqlalchemy">
                          SQLAlchemy (Python)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowExportDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleExportDiagram}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
