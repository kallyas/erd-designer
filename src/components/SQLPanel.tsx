
import { useEffect, useState } from "react";
import { DiagramState } from "@/types";
import { generateSQL, formatSQLForDisplay } from "@/utils/sqlGenerator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

interface SQLPanelProps {
  diagramState: DiagramState;
}

const SQLPanel = ({ diagramState }: SQLPanelProps) => {
  const [sql, setSql] = useState("");
  const [formattedSql, setFormattedSql] = useState("");
  
  useEffect(() => {
    const generatedSQL = generateSQL(diagramState);
    setSql(generatedSQL);
    setFormattedSql(formatSQLForDisplay(generatedSQL));
  }, [diagramState]);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sql);
    toast.success("SQL copied to clipboard");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-lg font-semibold text-erd-dark">SQL Code</h2>
        <Button onClick={handleCopySQL} className="bg-erd-primary">
          Copy SQL
        </Button>
      </div>

      <Tabs defaultValue="formatted" className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="formatted" className="flex-1">Formatted</TabsTrigger>
            <TabsTrigger value="raw" className="flex-1">Raw</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="formatted" className="flex-1 overflow-auto p-0 m-0">
          <div className="sql-panel bg-erd-dark p-4">
            <div 
              className="sql-panel__content"
              dangerouslySetInnerHTML={{ __html: formattedSql }}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="raw" className="flex-1 overflow-auto p-0 m-0">
          <pre className="sql-panel bg-erd-dark p-4">
            <code className="sql-panel__content">{sql}</code>
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SQLPanel;
