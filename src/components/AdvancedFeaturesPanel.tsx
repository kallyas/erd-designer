
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DiagramState, TableData } from "@/types";
import { 
  LayoutDashboard, 
  Database, 
  GitBranch, 
  ShieldCheck, 
  GitCompare, 
  FileType, 
  FileText as FileExport, 
  Users, 
  Zap 
} from "lucide-react";
import { toast } from "sonner";

interface AdvancedFeaturesPanelProps {
  diagramState: DiagramState;
  onLayoutChange: (layout: string) => void;
  onDialectChange: (dialect: string) => void;
}

const AdvancedFeaturesPanel = ({ 
  diagramState, 
  onLayoutChange, 
  onDialectChange 
}: AdvancedFeaturesPanelProps) => {
  const [currentVersion, setCurrentVersion] = useState("1.0.0");
  const [versions, setVersions] = useState<{id: string, version: string, date: string}[]>([
    { id: "v1", version: "1.0.0", date: new Date().toLocaleString() }
  ]);
  const [selectedDialect, setSelectedDialect] = useState("mysql");
  const [selectedLayout, setSelectedLayout] = useState("dagre");
  const [validationRule, setValidationRule] = useState("");
  const [enableAI, setEnableAI] = useState(true);

  const handleSaveVersion = () => {
    const newVersion = {
      id: `v${versions.length + 1}`,
      version: `1.0.${versions.length}`,
      date: new Date().toLocaleString()
    };
    
    setVersions([...versions, newVersion]);
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

  const handleAddValidationRule = () => {
    if (!validationRule.trim()) {
      toast.error("Please enter a validation rule");
      return;
    }
    toast.success("Validation rule added");
    setValidationRule("");
  };

  const handleExport = (format: string) => {
    toast.success(`Exporting as ${format}...`);
    // Export functionality would be implemented here
  };

  return (
    <div className="p-4 border-t">
      <Tabs defaultValue="visualization">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="visualization">
            <LayoutDashboard className="h-4 w-4 mr-1" />
            Visualization
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-1" />
            Database
          </TabsTrigger>
          <TabsTrigger value="versioning">
            <GitBranch className="h-4 w-4 mr-1" />
            Versions
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileExport className="h-4 w-4 mr-1" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="export">
            <FileExport className="h-4 w-4 mr-1" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visualization" className="space-y-4">
          <div className="space-y-2">
            <Label>Layout Algorithm</Label>
            <Select value={selectedLayout} onValueChange={handleLayoutChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dagre">Hierarchical</SelectItem>
                <SelectItem value="force">Force-Directed</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="circular">Circular</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="ai-suggestions" checked={enableAI} onCheckedChange={setEnableAI} />
            <Label htmlFor="ai-suggestions" className="flex items-center">
              <Zap className="h-4 w-4 mr-1" />
              AI-powered suggestions
            </Label>
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
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                <SelectItem value="sqlserver">SQL Server</SelectItem>
                <SelectItem value="sqlite">SQLite</SelectItem>
                <SelectItem value="oracle">Oracle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center">
              <ShieldCheck className="h-4 w-4 mr-1" />
              Data Validation Rule
            </Label>
            <div className="flex space-x-2">
              <Input 
                placeholder="e.g., price >= 0 AND price <= 1000" 
                value={validationRule}
                onChange={(e) => setValidationRule(e.target.value)}
              />
              <Button variant="outline" onClick={handleAddValidationRule}>Add</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center">
              <FileType className="h-4 w-4 mr-1" />
              Custom Types
            </Label>
            <Button variant="outline" onClick={() => toast.success("Custom type dialog would open")}>
              Manage Custom Types
            </Button>
          </div>
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
              <div key={v.id} className="flex items-center justify-between text-sm border-b py-2">
                <div>
                  <div className="font-medium">{v.version}</div>
                  <div className="text-xs text-gray-500">{v.date}</div>
                </div>
                <Button variant="ghost" size="sm">Restore</Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center">
              <GitCompare className="h-4 w-4 mr-1" />
              Compare Schemas
            </Label>
            <Button variant="outline" onClick={() => toast.success("Schema comparison would open")}>
              Compare with Version
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => toast.success("User authentication tables added")}>
              User Authentication
            </Button>
            <Button variant="outline" onClick={() => toast.success("Product catalog tables added")}>
              Product Catalog
            </Button>
            <Button variant="outline" onClick={() => toast.success("Blog schema tables added")}>
              Blog Schema
            </Button>
            <Button variant="outline" onClick={() => toast.success("E-commerce tables added")}>
              E-commerce
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => handleExport("sql")}>SQL Script</Button>
            <Button variant="outline" onClick={() => handleExport("png")}>PNG Image</Button>
            <Button variant="outline" onClick={() => handleExport("pdf")}>PDF Document</Button>
            <Button variant="outline" onClick={() => handleExport("orm")}>ORM Code</Button>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedFeaturesPanel;
