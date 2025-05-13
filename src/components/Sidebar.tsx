import { useState, useEffect } from "react";
import {
  Save,
  Upload,
  Download,
  Trash2,
  Wand2,
  Search,
  History,
  Settings,
  Table,
  Users,
  BrainCircuit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { DiagramState } from "@/types";
import SQLImporter from "./SQLImporter";
import { Analytics } from "@/components/Analytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

interface SidebarProps {
  addNewTable: () => void;
  onSaveDiagram: (name: string, description: string) => void;
  onLoadDiagram: (diagramState: DiagramState) => void;
  onNewDiagram: () => void;
  currentDiagram: DiagramState;
  showAdvancedPanel?: () => void;
}

export const Sidebar = ({
  addNewTable,
  onSaveDiagram,
  onLoadDiagram,
  onNewDiagram,
  currentDiagram,
  showAdvancedPanel,
}: SidebarProps) => {
  const [diagramName, setDiagramName] = useState("My ERD");
  const [diagramDescription, setDiagramDescription] = useState("");
  const [savedDiagrams, setSavedDiagrams] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("tools");
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    loadSavedDiagrams();
  }, []);

  const handleSave = () => {
    if (!diagramName.trim()) {
      toast.error("Please enter a name for your diagram");
      return;
    }
    const id = `diagram-${Date.now()}`;
    const newDiagram = {
      id,
      name: diagramName,
      date: new Date().toISOString(),
      description: diagramDescription,
      data: currentDiagram,
    };
    const updated = [...savedDiagrams, newDiagram];
    setSavedDiagrams(updated);
    localStorage.setItem("diagrams", JSON.stringify(updated));
    toast.success("Diagram saved!");
  };

  const loadSavedDiagrams = () => {
    const data = localStorage.getItem("diagrams");
    if (data) {
      setSavedDiagrams(JSON.parse(data));
    }
  };

  const handleSQLImport = (importedDiagram: DiagramState) => {
    onLoadDiagram(importedDiagram);
    setShowImportDialog(false);
  };

  return (
    <aside className="w-80 p-4 border-r h-full overflow-y-auto bg-muted/40">
      <Tabs defaultValue="tools" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 gap-2 mb-4">
          <TabsTrigger value="tools">
            <Table className="mr-1 h-4 w-4" /> Tools
          </TabsTrigger>
          <TabsTrigger value="manage">
            <Save className="mr-1 h-4 w-4" /> Save
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-1 h-4 w-4" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ERD Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="default"
                onClick={addNewTable}
                className="w-full"
              >
                <Table className="mr-2 h-4 w-4" /> Add Table
              </Button>
              <Button
                variant="secondary"
                onClick={onNewDiagram}
                className="w-full"
              >
                <Wand2 className="mr-2 h-4 w-4" /> New Diagram
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowImportDialog(true)}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" /> Import SQL
              </Button>
              <SQLImporter
                isOpen={showImportDialog}
                onClose={() => setShowImportDialog(false)}
                onImport={handleSQLImport}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Manage Diagrams</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={diagramName}
                onChange={(e) => setDiagramName(e.target.value)}
              />
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                rows={3}
                value={diagramDescription}
                onChange={(e) => setDiagramDescription(e.target.value)}
              />
              <Button onClick={handleSave} className="w-full mt-2">
                <Save className="mr-2 h-4 w-4" /> Save Diagram
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Advanced Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                onClick={showAdvancedPanel}
                className="w-full"
              >
                <BrainCircuit className="mr-2 h-4 w-4" /> Advanced Panel
              </Button>
              <Analytics diagramState={currentDiagram} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </aside>
  );
};
