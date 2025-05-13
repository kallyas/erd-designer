// src/components/Sidebar.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Table,
  Upload,
  Download,
  Search,
  History,
  Settings,
  Save,
  FileText,
  Trash2,
  Wand2,
  BrainCircuit,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { DiagramState } from "@/types";
import SQLImporter from "./SQLImporter";
import { Analytics } from "@/components/Analytics";

interface SidebarProps {
  addNewTable: () => void;
  onSaveDiagram: (name: string, description: string) => void;
  onLoadDiagram: (diagramState: DiagramState) => void;
  onNewDiagram: () => void;
  currentDiagram: DiagramState;
  showAdvancedPanel?: () => void;
}

const Sidebar = ({
  addNewTable,
  onSaveDiagram,
  onLoadDiagram,
  onNewDiagram,
  currentDiagram,
  showAdvancedPanel,
}: SidebarProps) => {
  const [diagramName, setDiagramName] = useState("My ERD");
  const [diagramDescription, setDiagramDescription] = useState("");
  const [savedDiagrams, setSavedDiagrams] = useState<
    { id: string; name: string; date: string; description: string; data: DiagramState }[]
  >([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("tools");

  // Load saved diagrams when component mounts
  useEffect(() => {
    loadSavedDiagrams();
  }, []);

  // Save current diagram
  const handleSave = () => {
    if (!diagramName.trim()) {
      toast.error("Please enter a name for your diagram");
      return;
    }

    const id = `diagram-${Date.now()}`;
    const diagramToSave = {
      id,
      name: diagramName,
      description: diagramDescription,
      date: new Date().toLocaleString(),
      data: currentDiagram,
    };

    // Save to local storage
    try {
      const existingDiagrams = JSON.parse(
        localStorage.getItem("erd-diagrams") || "[]"
      );
      const updatedDiagrams = [...existingDiagrams, diagramToSave];
      localStorage.setItem("erd-diagrams", JSON.stringify(updatedDiagrams));

      setSavedDiagrams(updatedDiagrams);
      onSaveDiagram(diagramName, diagramDescription);
      toast.success("Diagram saved successfully");
    } catch (error) {
      console.error("Error saving diagram:", error);
      toast.error("Failed to save diagram");
    }
  };

  // Load saved diagrams from local storage
  const loadSavedDiagrams = () => {
    try {
      const diagrams = JSON.parse(localStorage.getItem("erd-diagrams") || "[]");
      setSavedDiagrams(diagrams);
    } catch (error) {
      console.error("Error loading diagrams:", error);
      toast.error("Failed to load saved diagrams");
    }
  };

  // Load a specific diagram
  const loadDiagram = (diagramData: DiagramState) => {
    onLoadDiagram(diagramData);
    toast.success("Diagram loaded successfully");
  };

  // Delete a saved diagram
  const deleteDiagram = (id: string) => {
    try {
      const existingDiagrams = JSON.parse(
        localStorage.getItem("erd-diagrams") || "[]"
      );
      const updatedDiagrams = existingDiagrams.filter((d: any) => d.id !== id);
      localStorage.setItem("erd-diagrams", JSON.stringify(updatedDiagrams));

      setSavedDiagrams(updatedDiagrams);
      toast.success("Diagram deleted successfully");
    } catch (error) {
      console.error("Error deleting diagram:", error);
      toast.error("Failed to delete diagram");
    }
  };

  // Filter saved diagrams based on search term
  const filteredDiagrams = savedDiagrams.filter((diagram) => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();
    return (
      diagram.name.toLowerCase().includes(term) ||
      (diagram?.description && diagram.description.toLowerCase().includes(term))
    );
  });

  // Handle SQL import
  const handleSQLImport = (importedDiagram: DiagramState) => {
    onLoadDiagram(importedDiagram);
    setShowImportDialog(false);
  };

  return (
    <div className="w-72 border-r bg-white flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-erd-dark flex items-center">
          <Database className="mr-2 h-5 w-5 text-erd-primary" />
          ERD Designer Pro
        </h2>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="w-full grid grid-cols-3 m-0 rounded-none border-b">
          <TabsTrigger
            value="tools"
            className="rounded-none data-[state=active]:bg-white"
          >
            Tools
          </TabsTrigger>
          <TabsTrigger
            value="save"
            className="rounded-none data-[state=active]:bg-white"
          >
            Save/Load
          </TabsTrigger>
          <TabsTrigger
            value="ai"
            className="rounded-none data-[state=active]:bg-white"
          >
            AI
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="tools"
          className="p-4 m-0 flex-1 overflow-auto flex flex-col"
        >
          <div className="space-y-4 flex-grow">
            <Button
              onClick={addNewTable}
              className="w-full flex items-center justify-center bg-erd-primary hover:bg-erd-primary-dark"
            >
              <Table className="mr-2 h-4 w-4" />
              Add New Table
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setShowImportDialog(true)}
                variant="outline"
                className="flex items-center justify-center"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import SQL
              </Button>

              <Button
                onClick={() => toast.success("SQL exported successfully")}
                variant="outline"
                className="flex items-center justify-center"
              >
                <Download className="mr-2 h-4 w-4" />
                Export SQL
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={onNewDiagram}
                variant="outline"
                className="flex items-center justify-center"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Diagram
              </Button>

              {showAdvancedPanel && (
                <Button
                  onClick={showAdvancedPanel}
                  variant="outline"
                  className="flex items-center justify-center"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Advanced
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4">
            <Analytics diagramState={currentDiagram} />
          </div>

          <div className="mt-4">
            <h3 className="font-medium mb-2">Instructions:</h3>
            <ul className="text-sm space-y-2">
              <li>• Add tables using the button above</li>
              <li>• Click on table headers to rename them</li>
              <li>• Add columns and set their properties</li>
              <li>• Drag connections between tables to create relationships</li>
              <li>• View the generated SQL code in the panel below</li>
              <li>• Import existing SQL schema or export your design</li>
              <li>• Use advanced features for layouts and versioning</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent
          value="save"
          className="m-0 flex-1 flex flex-col h-full overflow-hidden"
        >
          <div className="p-4 space-y-4 border-b flex-shrink-0">
            <div className="space-y-2">
              <Label htmlFor="diagramName">Diagram Name</Label>
              <Input
                id="diagramName"
                value={diagramName}
                onChange={(e) => setDiagramName(e.target.value)}
                placeholder="My ERD Diagram"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagramDescription">Description (Optional)</Label>
              <Textarea
                id="diagramDescription"
                value={diagramDescription}
                onChange={(e) => setDiagramDescription(e.target.value)}
                placeholder="Describe your diagram..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleSave}
              className="w-full bg-erd-primary hover:bg-erd-primary-dark"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Diagram
            </Button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto flex flex-col">
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Saved Diagrams</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadSavedDiagrams}
                  className="h-7 text-xs"
                >
                  <History className="h-3.5 w-3.5 mr-1" />
                  Refresh
                </Button>
              </div>

              <div className="relative">
                <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search diagrams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {filteredDiagrams.length > 0 ? (
              <div className="space-y-3 flex-1">
                {filteredDiagrams.map((diagram) => (
                  <div
                    key={diagram.id}
                    className="border rounded-md p-3 bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{diagram.name}</h4>
                        <p className="text-xs text-gray-500">{diagram.date}</p>
                        {diagram.description && (
                          <p className="text-xs mt-1 text-gray-700">
                            {diagram.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDiagram(diagram.id)}
                        className="h-7 text-xs text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadDiagram(diagram.data)}
                        className="flex-1 text-xs h-7"
                      >
                        Load
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Clone the diagram
                          const newDiagram = JSON.parse(
                            JSON.stringify(diagram.data)
                          );
                          setDiagramName(`${diagram.name} (Copy)`);
                          onLoadDiagram(newDiagram);
                          toast.success(`Cloned "${diagram.name}"`);
                        }}
                        className="text-xs h-7"
                      >
                        Clone
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {diagram.data.nodes.length} tables
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {diagram.data.edges.length} relationships
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm flex-1 flex flex-col items-center justify-center">
                <FileText className="h-10 w-10 mb-2 text-gray-300" />
                {searchTerm
                  ? "No matching diagrams found"
                  : "No saved diagrams found"}
                <p className="mt-2 text-xs text-gray-400">
                  {searchTerm
                    ? "Try a different search term"
                    : "Save a diagram to see it here"}
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ai" className="m-0 p-4 flex-1 overflow-auto">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2 flex items-center">
                <BrainCircuit className="h-4 w-4 mr-1 text-purple-500" />
                AI Schema Generator
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                Describe your database needs in plain language, and AI will
                suggest a schema
              </p>
              <Textarea
                placeholder="E.g., I need a database for a blog with users, posts, comments, and categories..."
                rows={4}
                className="mb-2"
              />
              <Button
                className="w-full"
                variant="default"
                onClick={() => toast.success("AI would generate schema...")}
              >
                <Wand2 className="h-4 w-4 mr-1" />
                Generate Schema
              </Button>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2 flex items-center">
                <BrainCircuit className="h-4 w-4 mr-1 text-purple-500" />
                Schema Improvements
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                Get AI suggestions to improve your current database schema
              </p>
              <div className="space-y-2">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => toast.success("AI analyzing schema...")}
                >
                  Optimize Indexes
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => toast.success("AI analyzing schema...")}
                >
                  Normalize Tables
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => toast.success("AI analyzing schema...")}
                >
                  Recommend Constraints
                </Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2 flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Collaboration
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                Share your diagram with others and collaborate in real-time
              </p>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => toast.success("Share link copied to clipboard")}
              >
                Share Diagram
              </Button>
              <div className="mt-2 text-xs text-center text-gray-500">
                <p>Active users: 1</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* SQL Import Dialog */}
      <SQLImporter
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleSQLImport}
      />
    </div>
  );
};

export default Sidebar;
