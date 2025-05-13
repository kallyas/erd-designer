import { useState, useRef, useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import ERDCanvas from "@/components/ERDCanvas";
import { Sidebar } from "@/components/Sidebar";
import SQLPanel from "@/components/SQLPanel";
import Dashboard from "@/components/Dashboard"; // Import our new Dashboard component
import { DiagramState, TableNode, RelationshipEdge } from "@/types";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [diagramState, setDiagramState] = useState<DiagramState>({
    nodes: [],
    edges: [],
  });
  const [sqlDialect, setSqlDialect] = useState("mysql");
  const [activeLayout, setActiveLayout] = useState("default");
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  const [isSqlPanelVisible, setIsSqlPanelVisible] = useState(true); // Or false by default
  const [isSqlPanelPinned, setIsSqlPanelPinned] = useState(false); // Panel is not pinned

  const erdCanvasRef = useRef<{
    addNewTable: (position?: { x: number; y: number }) => void;
  }>(null);

  // Handle nodes change
  const handleNodesChange = useCallback((nodes: TableNode[]) => {
    setDiagramState((prev) => ({
      ...prev,
      nodes,
      lastModified: new Date(),
    }));
  }, []);

  // Handle edges change
  const handleEdgesChange = useCallback((edges: RelationshipEdge[]) => {
    setDiagramState((prev) => ({
      ...prev,
      edges,
      lastModified: new Date(),
    }));
  }, []);

  // Add a new table to the canvas
  const addNewTable = useCallback(() => {
    if (erdCanvasRef.current) {
      erdCanvasRef.current.addNewTable();
    }
  }, []);

  // Save diagram
  const handleSaveDiagram = useCallback((name: string, description: string) => {
    // This function is handled in the Sidebar component
    console.log("Diagram saved:", name, description);
  }, []);

  // Load diagram
  const handleLoadDiagram = useCallback((loadedDiagramState: DiagramState) => {
    console.log("Diagram loaded:", loadedDiagramState);
    setDiagramState(loadedDiagramState);
  }, []);

  // Clear diagram
  const handleNewDiagram = useCallback(() => {
    setDiagramState({
      nodes: [],
      edges: [],
    });
  }, []);

  // Handle SQL dialect change
  const handleDialectChange = useCallback((dialect: string) => {
    setSqlDialect(dialect);
    setDiagramState((prev) => ({
      ...prev,
      dialect,
    }));
  }, []);

  // Handle layout change
  const handleLayoutChange = useCallback((layout: string) => {
    setActiveLayout(layout);
  }, []);

  // Handle diagram update from dashboard
  const handleDiagramUpdate = useCallback((updatedDiagram: DiagramState) => {
    setDiagramState(updatedDiagram);
  }, []);

  const handleToggleSqlPanel = () => {
    setIsSqlPanelVisible((prev) => !prev);
  };

  const handleToggleSqlPin = () => {
    setIsSqlPanelPinned((prev) => {
      // If unpinning, also hide the panel unless it was explicitly made visible
      if (prev) setIsSqlPanelVisible(false);
      // If pinning, make sure it's visible
      else setIsSqlPanelVisible(true);
      return !prev;
    });
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={70} minSize={30} className="h-screen">
          <div className="flex h-full">
            <ReactFlowProvider>
              <Sidebar
                addNewTable={addNewTable}
                onSaveDiagram={handleSaveDiagram}
                onLoadDiagram={handleLoadDiagram}
                onNewDiagram={handleNewDiagram}
                currentDiagram={diagramState}
              />

              <div className="flex-1 h-full flex flex-col">
                {/* Advanced Dashboard Panel */}
                {showAdvancedPanel && (
                  <Dashboard
                    diagramState={diagramState}
                    onDiagramUpdate={handleDiagramUpdate}
                    onLayoutChange={handleLayoutChange}
                    onDialectChange={handleDialectChange}
                  />
                )}

                {/* Toggle button for Dashboard */}
                <div className="bg-gray-100 p-2 flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedPanel(!showAdvancedPanel)}
                  >
                    {showAdvancedPanel
                      ? "Hide Advanced Panel"
                      : "Show Advanced Panel"}
                  </Button>

                  <div className="text-sm text-muted-foreground">
                    {diagramState.nodes.length} tables,{" "}
                    {diagramState.edges.length} relationships
                  </div>
                </div>

                {/* ERD Canvas */}
                <div className="flex-1">
                  <ERDCanvas
                    ref={erdCanvasRef}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={handleEdgesChange}
                  />
                </div>
              </div>
            </ReactFlowProvider>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={0} minSize={0}>
          <SQLPanel
            isPinned={isSqlPanelPinned}
            isVisible={isSqlPanelVisible}
            onToggleVisibility={handleToggleSqlPin}
            diagramState={diagramState}
            initialDialect={sqlDialect}
            onTogglePin={handleToggleSqlPin}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
