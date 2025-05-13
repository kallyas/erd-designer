
import { useState, useRef, useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import ERDCanvas from "@/components/ERDCanvas";
import Sidebar from "@/components/Sidebar";
import SQLPanel from "@/components/SQLPanel";
import AdvancedFeaturesPanel from "@/components/AdvancedFeaturesPanel";
import { DiagramState, TableNode, RelationshipEdge } from "@/types";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

const Index = () => {
  const [diagramState, setDiagramState] = useState<DiagramState>({
    nodes: [],
    edges: []
  });
  const [sqlDialect, setSqlDialect] = useState("mysql");
  const [activeLayout, setActiveLayout] = useState("default");
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  
  const erdCanvasRef = useRef<{ addNewTable: (position?: { x: number, y: number }) => void }>(null);

  // Handle nodes change
  const handleNodesChange = useCallback((nodes: TableNode[]) => {
    setDiagramState(prev => ({
      ...prev,
      nodes,
      lastModified: new Date()
    }));
  }, []);

  // Handle edges change
  const handleEdgesChange = useCallback((edges: RelationshipEdge[]) => {
    setDiagramState(prev => ({
      ...prev,
      edges,
      lastModified: new Date()
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
    setDiagramState(loadedDiagramState);
  }, []);

  // Clear diagram
  const handleNewDiagram = useCallback(() => {
    setDiagramState({
      nodes: [],
      edges: []
    });
  }, []);
  
  // Handle SQL dialect change
  const handleDialectChange = useCallback((dialect: string) => {
    setSqlDialect(dialect);
    setDiagramState(prev => ({
      ...prev,
      dialect
    }));
  }, []);
  
  // Handle layout change
  const handleLayoutChange = useCallback((layout: string) => {
    setActiveLayout(layout);
  }, []);

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
              
              <div className="flex-1 h-full">
                <ERDCanvas
                  ref={erdCanvasRef}
                  onNodesChange={handleNodesChange}
                  onEdgesChange={handleEdgesChange}
                />
              </div>
            </ReactFlowProvider>
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={30} minSize={15}>
          <SQLPanel diagramState={diagramState} dialect={sqlDialect} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
