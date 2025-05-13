
import { useState, useRef, useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import ERDCanvas from "@/components/ERDCanvas";
import Sidebar from "@/components/Sidebar";
import SQLPanel from "@/components/SQLPanel";
import { DiagramState, TableNode, RelationshipEdge } from "@/types";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

const Index = () => {
  const [diagramState, setDiagramState] = useState<DiagramState>({
    nodes: [],
    edges: []
  });
  const erdCanvasRef = useRef<{ addNewTable: (position?: { x: number, y: number }) => void }>(null);

  // Handle nodes change
  const handleNodesChange = useCallback((nodes: TableNode[]) => {
    setDiagramState(prev => ({
      ...prev,
      nodes
    }));
  }, []);

  // Handle edges change
  const handleEdgesChange = useCallback((edges: RelationshipEdge[]) => {
    setDiagramState(prev => ({
      ...prev,
      edges
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
          <SQLPanel diagramState={diagramState} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
