
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Database, Table } from "lucide-react";
import { toast } from "sonner";
import { DiagramState } from "@/types";

interface SidebarProps {
  addNewTable: () => void;
  onSaveDiagram: (name: string, description: string) => void;
  onLoadDiagram: (diagramState: DiagramState) => void;
  onNewDiagram: () => void;
  currentDiagram: DiagramState;
}

const Sidebar = ({ 
  addNewTable, 
  onSaveDiagram,
  onLoadDiagram,
  onNewDiagram,
  currentDiagram 
}: SidebarProps) => {
  const [diagramName, setDiagramName] = useState("My ERD");
  const [diagramDescription, setDiagramDescription] = useState("");
  const [savedDiagrams, setSavedDiagrams] = useState<{id: string, name: string, date: string, data: DiagramState}[]>([]);

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
      data: currentDiagram
    };

    // Save to local storage
    try {
      const existingDiagrams = JSON.parse(localStorage.getItem('erd-diagrams') || '[]');
      const updatedDiagrams = [...existingDiagrams, diagramToSave];
      localStorage.setItem('erd-diagrams', JSON.stringify(updatedDiagrams));
      
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
      const diagrams = JSON.parse(localStorage.getItem('erd-diagrams') || '[]');
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
      const existingDiagrams = JSON.parse(localStorage.getItem('erd-diagrams') || '[]');
      const updatedDiagrams = existingDiagrams.filter((d: any) => d.id !== id);
      localStorage.setItem('erd-diagrams', JSON.stringify(updatedDiagrams));
      
      setSavedDiagrams(updatedDiagrams);
      toast.success("Diagram deleted successfully");
    } catch (error) {
      console.error("Error deleting diagram:", error);
      toast.error("Failed to delete diagram");
    }
  };

  return (
    <div className="w-64 border-r bg-white flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-erd-dark flex items-center">
          <Database className="mr-2 h-5 w-5 text-erd-primary" />
          ERD Designer
        </h2>
      </div>

      <Tabs defaultValue="tools" className="flex-1">
        <TabsList className="w-full grid grid-cols-2 m-0 rounded-none border-b">
          <TabsTrigger value="tools" className="rounded-none data-[state=active]:bg-white">
            Tools
          </TabsTrigger>
          <TabsTrigger value="save" className="rounded-none data-[state=active]:bg-white">
            Save/Load
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="p-4 m-0">
          <div className="space-y-4">
            <Button 
              onClick={addNewTable}
              className="w-full flex items-center justify-center bg-erd-primary hover:bg-erd-primary-dark"
            >
              <Table className="mr-2 h-4 w-4" />
              Add New Table
            </Button>
            
            <Button 
              onClick={onNewDiagram}
              variant="outline"
              className="w-full flex items-center justify-center"
            >
              Clear Diagram
            </Button>
          </div>
          
          <div className="mt-8">
            <h3 className="font-medium mb-2">Instructions:</h3>
            <ul className="text-sm space-y-2">
              <li>• Add tables using the button above</li>
              <li>• Click on table headers to rename them</li>
              <li>• Add columns and set their properties</li>
              <li>• Drag connections between tables to create relationships</li>
              <li>• View the generated SQL code in the panel below</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="save" className="m-0 flex flex-col h-full overflow-hidden">
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
              Save Diagram
            </Button>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Saved Diagrams</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={loadSavedDiagrams}
                className="h-7 text-xs"
              >
                Refresh
              </Button>
            </div>
            
            {savedDiagrams.length > 0 ? (
              <div className="space-y-3">
                {savedDiagrams.map((diagram) => (
                  <div 
                    key={diagram.id}
                    className="border rounded-md p-3 bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{diagram.name}</h4>
                        <p className="text-xs text-gray-500">{diagram.date}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteDiagram(diagram.id)}
                        className="h-7 text-xs text-red-500 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadDiagram(diagram.data)}
                      className="mt-2 w-full text-xs h-7"
                    >
                      Load
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No saved diagrams found
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Sidebar;
