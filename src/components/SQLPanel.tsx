
import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DiagramState } from "@/types";
import { generateSQL, formatSQLForDisplay } from "@/utils/sqlGenerator";
import { Button } from "@/components/ui/button";
import { Download, Copy, FileType, Database } from "lucide-react";
import { toast } from "sonner";

interface SQLPanelProps {
  diagramState: DiagramState;
  dialect?: string;
}

const SQLPanel = ({ diagramState, dialect = "mysql" }: SQLPanelProps) => {
  const [activeTab, setActiveTab] = useState("sql");
  const [jsonVisible, setJsonVisible] = useState(false);
  
  const sql = useMemo(() => {
    return generateSQL(diagramState, dialect);
  }, [diagramState, dialect]);
  
  const formattedSql = useMemo(() => {
    return formatSQLForDisplay(sql);
  }, [sql]);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    toast.success("SQL code copied to clipboard");
  };

  const handleDownload = () => {
    const blob = new Blob([sql], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "erd_schema.sql";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("SQL file downloaded");
  };
  
  const handleJsonDownload = () => {
    const jsonData = JSON.stringify(diagramState, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "erd_diagram.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Diagram JSON downloaded");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b p-2 bg-background">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="sql" className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              SQL Output
            </TabsTrigger>
            <TabsTrigger 
              value="json" 
              className="flex items-center gap-1"
              onClick={() => setJsonVisible(true)}
            >
              <FileType className="h-4 w-4" />
              JSON
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-2">
          {activeTab === "sql" && (
            <>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 px-2" 
                onClick={handleCopy}
                title="Copy SQL"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 px-2" 
                onClick={handleDownload}
                title="Download SQL"
              >
                <Download className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {activeTab === "json" && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 px-2" 
              onClick={handleJsonDownload}
              title="Download JSON"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <TabsContent value="sql" className="m-0 h-full">
          <div className="sql-panel">
            <div className="sql-panel__content sql-code">
              <div dangerouslySetInnerHTML={{ __html: formattedSql }} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="json" className="m-0 h-full">
          {jsonVisible && (
            <div className="sql-panel">
              <div className="sql-panel__content">
                <pre>{JSON.stringify(diagramState, null, 2)}</pre>
              </div>
            </div>
          )}
        </TabsContent>
      </div>
    </div>
  );
};

export default SQLPanel;
