// src/components/AdvancedFeaturesPanel.tsx
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DiagramState, ValidationRule } from "@/types";
import {
  LayoutDashboard,
  Database,
  GitBranch,
  ShieldCheck,
  GitCompare,
  FileType,
  FileText,
  Share2 as FileExport,
  Users,
  Zap,
  AlertTriangle,
  BrainCircuit,
  BarChart,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { SUPPORTED_DIALECTS } from "@/utils/dialectManager";
import { getAllTemplates } from "@/utils/templateManager";
import {
  validateDiagram,
  COMMON_VALIDATION_RULES,
  createValidationRule,
} from "@/utils/validationRules";
import { getCustomTypes } from "@/utils/customTypes";
import {
  getVersionHistory,
  saveVersion,
  compareVersions,
} from "@/utils/versionManager";

interface AdvancedFeaturesPanelProps {
  diagramState: DiagramState;
  onLayoutChange: (layout: string) => void;
  onDialectChange: (dialect: string) => void;
  onTableStyleChange?: (style: string) => void;
  onRelationshipStyleChange?: (style: string) => void;
  onColorSchemeChange?: (scheme: string) => void;
}

const AdvancedFeaturesPanel = ({
  diagramState,
  onLayoutChange,
  onDialectChange,
  onTableStyleChange,
  onRelationshipStyleChange,
  onColorSchemeChange,
}: AdvancedFeaturesPanelProps) => {
  const [currentVersion, setCurrentVersion] = useState("1.0.0");
  const [versions, setVersions] = useState<
    ReturnType<typeof getVersionHistory>
  >([]);
  const [selectedDialect, setSelectedDialect] = useState(
    diagramState.dialect || "mysql"
  );
  const [selectedLayout, setSelectedLayout] = useState("default");
  const [validationRule, setValidationRule] = useState("");
  const [enableAI, setEnableAI] = useState(true);
  const [customTypes, setCustomTypes] = useState<
    ReturnType<typeof getCustomTypes>
  >([]);
  const [templates, setTemplates] = useState(getAllTemplates());
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([
    ...COMMON_VALIDATION_RULES,
  ]);
  const [validationResults, setValidationResults] = useState<ReturnType<
    typeof validateDiagram
  > | null>(null);
  const [tableStyle, setTableStyle] = useState("default");
  const [relationshipStyle, setRelationshipStyle] = useState("arrows");
  const [colorScheme, setColorScheme] = useState("default");
  const [newCustomTypeName, setNewCustomTypeName] = useState("");
  const [newCustomTypeBase, setNewCustomTypeBase] = useState("VARCHAR");
  const [activeTab, setActiveTab] = useState("visualization");

  // Load initial data
  useEffect(() => {
    setVersions(getVersionHistory());
    setCustomTypes(getCustomTypes());

    // Validate the diagram
    if (diagramState.nodes.length > 0) {
      const results = validateDiagram(
        diagramState.nodes.map((n) => n.data),
        validationRules
      );
      setValidationResults(results);
    }
  }, [diagramState, validationRules]);

  const handleSaveVersion = () => {
    const newVersion = saveVersion(diagramState);

    setVersions(getVersionHistory());
    setCurrentVersion(newVersion.version);
    toast.success(`Version ${newVersion.version} saved`);
  };

  const handleDialectChange = (dialect: string) => {
    setSelectedDialect(dialect);
    onDialectChange(dialect);
    toast.success(`SQL dialect changed to ${dialect}`);
  };

  const handleLayoutChange = (layout: string) => {
    setSelectedLayout(layout);
    onLayoutChange(layout);
    toast.success(`Layout changed to ${layout}`);
  };

  const handleTableStyleChange = (style: string) => {
    setTableStyle(style);
    if (onTableStyleChange) {
      onTableStyleChange(style);
    }
    toast.success(`Table style changed to ${style}`);
  };

  const handleRelationshipStyleChange = (style: string) => {
    setRelationshipStyle(style);
    if (onRelationshipStyleChange) {
      onRelationshipStyleChange(style);
    }
    toast.success(`Relationship style changed to ${style}`);
  };

  const handleColorSchemeChange = (scheme: string) => {
    setColorScheme(scheme);
    if (onColorSchemeChange) {
      onColorSchemeChange(scheme);
    }
    toast.success(`Color scheme changed to ${scheme}`);
  };

  const handleAddValidationRule = () => {
    if (!validationRule.trim()) {
      toast.error("Please enter a validation rule");
      return;
    }

    const newRule = createValidationRule(
      `Custom Rule ${validationRules.length + 1}`,
      validationRule
    );

    setValidationRules([...validationRules, newRule]);
    toast.success("Validation rule added");
    setValidationRule("");
  };

  const handleAddCustomType = () => {
    if (!newCustomTypeName.trim()) {
      toast.error("Please enter a custom type name");
      return;
    }

    const newType = {
      name: newCustomTypeName,
      baseType: newCustomTypeBase,
      description: `Custom type based on ${newCustomTypeBase}`,
    };

    // In a real implementation, you would save this to storage
    // and update the list of custom types
    setCustomTypes([...customTypes, newType]);
    toast.success(`Custom type "${newCustomTypeName}" added`);
    setNewCustomTypeName("");
    setNewCustomTypeBase("VARCHAR");
  };

  const handleExport = (format: string) => {
    toast.success(`Exporting as ${format}...`);
    // Export functionality would be implemented here
  };

  return (
    <div className="p-4 border-t">
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="visualization">
        <TabsList className="grid grid-cols-6 mb-4">
          <TabsTrigger value="visualization">
            <LayoutDashboard className="h-4 w-4 mr-1" />
            Visualization
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-1" />
            Database
          </TabsTrigger>
          <TabsTrigger value="validation">
            <ShieldCheck className="h-4 w-4 mr-1" />
            Validation
          </TabsTrigger>
          <TabsTrigger value="versioning">
            <GitBranch className="h-4 w-4 mr-1" />
            Versions
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-1" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="export">
            <FileExport className="h-4 w-4 mr-1" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visualization" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Layout Algorithm</Label>
              <Select value={selectedLayout} onValueChange={handleLayoutChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="circular">Circular</SelectItem>
                  <SelectItem value="hierarchical">Hierarchical</SelectItem>
                  <SelectItem value="force">Force-Directed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Table Style</Label>
              <Select value={tableStyle} onValueChange={handleTableStyleChange}>
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
              <Label>Relationship Style</Label>
              <Select
                value={relationshipStyle}
                onValueChange={handleRelationshipStyleChange}
              >
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
              <Label>Color Scheme</Label>
              <Select
                value={colorScheme}
                onValueChange={handleColorSchemeChange}
              >
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

          <div className="flex items-center space-x-2">
            <Switch
              id="ai-suggestions"
              checked={enableAI}
              onCheckedChange={setEnableAI}
            />
            <Label htmlFor="ai-suggestions" className="flex items-center">
              <Zap className="h-4 w-4 mr-1" />
              AI-powered suggestions
            </Label>
          </div>

          <div className="bg-muted/20 p-4 rounded-md">
            <div className="font-medium mb-2 flex items-center">
              <BarChart className="h-4 w-4 mr-1" />
              Schema Statistics
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Tables</div>
                <div className="font-medium">{diagramState.nodes.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Relationships</div>
                <div className="font-medium">{diagramState.edges.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Columns</div>
                <div className="font-medium">
                  {diagramState.nodes.reduce(
                    (sum, node) => sum + node.data.columns.length,
                    0
                  )}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Foreign Keys</div>
                <div className="font-medium">
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
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="space-y-2">
            <Label>SQL Dialect</Label>
            <Select value={selectedDialect} onValueChange={handleDialectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select SQL dialect" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_DIALECTS.map((dialect) => (
                  <SelectItem key={dialect.key} value={dialect.key}>
                    {dialect.name} {dialect.version && `(${dialect.version})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center">
              <FileType className="h-4 w-4 mr-1" />
              Custom Types
            </Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {customTypes.map((type) => (
                <Badge key={type.name} variant="outline">
                  {type.name}: {type.baseType}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Type name"
                  value={newCustomTypeName}
                  onChange={(e) => setNewCustomTypeName(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Select
                  value={newCustomTypeBase}
                  onValueChange={setNewCustomTypeBase}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Base type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VARCHAR">VARCHAR</SelectItem>
                    <SelectItem value="INT">INT</SelectItem>
                    <SelectItem value="DECIMAL">DECIMAL</SelectItem>
                    <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                    <SelectItem value="DATE">DATE</SelectItem>
                    <SelectItem value="TIMESTAMP">TIMESTAMP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={handleAddCustomType}>
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center">
              <ShieldCheck className="h-4 w-4 mr-1" />
              Indexing Strategy
            </Label>
            <Select defaultValue="auto">
              <SelectTrigger>
                <SelectValue placeholder="Select indexing strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  Auto (index all foreign keys)
                </SelectItem>
                <SelectItem value="minimal">
                  Minimal (primary keys only)
                </SelectItem>
                <SelectItem value="comprehensive">
                  Comprehensive (all keys and constraints)
                </SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center">
              <ShieldCheck className="h-4 w-4 mr-1" />
              Data Validation Rules
            </Label>
            <div className="flex space-x-2">
              <Input
                placeholder="e.g., price >= 0 AND price <= 1000"
                value={validationRule}
                onChange={(e) => setValidationRule(e.target.value)}
              />
              <Button variant="outline" onClick={handleAddValidationRule}>
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Active Validation Rules</Label>
            <div className="border rounded-md divide-y">
              {validationRules.map((rule, index) => (
                <div
                  key={index}
                  className="p-2 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-sm">{rule.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {rule.rule}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setValidationRules((rules) =>
                        rules.filter((_, i) => i !== index)
                      );
                      toast.success("Rule removed");
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {validationResults && !validationResults.isValid && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Validation Issues</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4 mt-2 space-y-1 text-sm">
                  {validationResults.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {validationResults && validationResults.isValid && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Schema Valid</AlertTitle>
              <AlertDescription>
                Your database schema passes all validation rules.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="versioning" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Current Version</div>
              <div className="text-xl font-bold">{currentVersion}</div>
            </div>
            <Button onClick={handleSaveVersion}>
              <GitBranch className="h-4 w-4 mr-1" />
              Save Version
            </Button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            <div className="font-medium">Version History</div>
            {versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between text-sm border-b py-2"
              >
                <div>
                  <div className="font-medium">{v.version}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(v.date).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Implement restore version functionality
                      toast.success(`Restored to version ${v.version}`);
                    }}
                  >
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Show diff dialog
                      const diff = compareVersions(versions[0].id, v.id);
                      console.log("Version diff:", diff);
                      toast.success("Comparing versions...");
                    }}
                  >
                    Compare
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center">
              <GitCompare className="h-4 w-4 mr-1" />
              Compare Schemas
            </Label>
            <Button
              variant="outline"
              onClick={() => toast.success("Schema comparison would open")}
            >
              Compare with Version
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {templates.slice(0, 4).map((template, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() =>
                  toast.success(`${template.name} template would be applied`)
                }
                className="justify-start h-auto py-2"
              >
                <div className="flex flex-col items-start">
                  <span>{template.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {template.tables.length} tables
                  </span>
                </div>
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Create Template from Current Diagram</Label>
            <div className="space-y-2">
              <Input placeholder="Template name" />
              <Textarea placeholder="Description" rows={3} />
            </div>
            <Button variant="outline">Save as Template</Button>
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => handleExport("sql")}>
              SQL Script
            </Button>
            <Button variant="outline" onClick={() => handleExport("png")}>
              PNG Image
            </Button>
            <Button variant="outline" onClick={() => handleExport("pdf")}>
              PDF Document
            </Button>
            <Button variant="outline" onClick={() => handleExport("orm")}>
              ORM Code
            </Button>
          </div>

          <div className="mt-4">
            <Label className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Collaboration
            </Label>
            <Button
              className="w-full mt-2"
              variant="outline"
              onClick={() => toast.success("Sharing options would appear")}
            >
              Share Diagram
            </Button>
          </div>

          <div className="mt-4">
            <Label className="flex items-center">
              <BrainCircuit className="h-4 w-4 mr-1" />
              AI Schema Generation
            </Label>
            <Textarea
              placeholder="Describe your database needs in plain language, and AI will suggest a schema..."
              rows={4}
              className="mt-2"
            />
            <Button
              className="w-full mt-2"
              variant="outline"
              onClick={() =>
                toast.success("AI would generate schema suggestions")
              }
            >
              Generate Schema Suggestions
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedFeaturesPanel;