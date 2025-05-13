import React, { useMemo } from "react";
import { DiagramState } from "@/types";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, ArrowUpRight, BarChart2 } from "lucide-react";

interface AnalyticsProps {
  diagramState: DiagramState;
}

export const Analytics: React.FC<AnalyticsProps> = ({ diagramState }) => {
  // Calculate statistics
  const stats = useMemo(() => {
    const tables = diagramState.nodes.length;
    const relationships = diagramState.edges.length;
    const columns = diagramState.nodes.reduce((sum, node) => sum + node.data.columns.length, 0);
    const foreignKeys = diagramState.nodes.reduce(
      (sum, node) => sum + node.data.columns.filter(col => col.isForeignKey).length, 
      0
    );
    const primaryKeys = diagramState.nodes.reduce(
      (sum, node) => sum + node.data.columns.filter(col => col.isPrimaryKey).length, 
      0
    );
    
    // Find biggest tables (most columns)
    const tableSizes = diagramState.nodes.map(node => ({
      name: node.data.tableName,
      columns: node.data.columns.length,
    })).sort((a, b) => b.columns - a.columns);
    
    // Check for tables without primary keys (schema issues)
    const tablesWithoutPK = diagramState.nodes.filter(
      node => !node.data.columns.some(col => col.isPrimaryKey)
    ).map(node => node.data.tableName);
    
    // Count column types
    const columnTypes: Record<string, number> = {};
    diagramState.nodes.forEach(node => {
      node.data.columns.forEach(col => {
        if (!columnTypes[col.type]) {
          columnTypes[col.type] = 0;
        }
        columnTypes[col.type]++;
      });
    });
    
    // Prepare data for charts
    const typeData = Object.entries(columnTypes).map(([type, count]) => ({
      name: type,
      value: count
    })).sort((a, b) => b.value - a.value);
    
    return {
      tables,
      relationships,
      columns,
      foreignKeys,
      primaryKeys,
      columnTypes,
      tableSizes,
      tablesWithoutPK,
      typeData,
      relationshipRatio: tables > 0 ? (relationships / tables).toFixed(2) : "0",
      avgColumnsPerTable: tables > 0 ? (columns / tables).toFixed(1) : "0"
    };
  }, [diagramState]);
  
  // Check if there's enough data to show analytics
  const hasData = diagramState.nodes.length > 0;
  
  const chartColors = [
    "#4f46e5", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", 
    "#f59e0b", "#eab308", "#84cc16", "#10b981", "#06b6d4"
  ];
  
  return (
    <Card className="border-none shadow-none">
      <CardContent className="p-0">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center">
            <BarChart2 className="h-4 w-4 mr-1.5 text-muted-foreground" />
            Schema Statistics
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground/70" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Analytics of your database schema</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </h3>
        </div>
        
        {!hasData ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Add tables to see statistics
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="text-center p-2 bg-muted/30 rounded-md">
                <div className="text-xl font-semibold">{stats.tables}</div>
                <div className="text-xs text-muted-foreground">Tables</div>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded-md">
                <div className="text-xl font-semibold">{stats.relationships}</div>
                <div className="text-xs text-muted-foreground">Relationships</div>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded-md">
                <div className="text-xl font-semibold">{stats.columns}</div>
                <div className="text-xs text-muted-foreground">Columns</div>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded-md">
                <div className="text-xl font-semibold">{stats.foreignKeys}</div>
                <div className="text-xs text-muted-foreground">Foreign Keys</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div className="flex flex-col gap-1">
                <div className="text-muted-foreground">Column Types</div>
                {stats.typeData.slice(0, 4).map((type, index) => (
                  <div key={type.name} className="flex justify-between">
                    <span>{type.name}</span>
                    <span className="font-medium">{type.value}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="text-muted-foreground">Largest Tables</div>
                {stats.tableSizes.slice(0, 4).map(table => (
                  <div key={table.name} className="flex justify-between">
                    <span className="truncate">{table.name}</span>
                    <span className="font-medium">{table.columns} cols</span>
                  </div>
                ))}
              </div>
            </div>
            
            {stats.typeData.length > 1 && (
              <div className="mt-3 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.typeData.slice(0, 5)}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis hide />
                    <Tooltip 
                      formatter={(value) => [`${value} columns`, 'Count']}
                      labelFormatter={(label) => `Type: ${label}`}
                      cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                      {stats.typeData.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {stats.tablesWithoutPK.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-muted-foreground mb-1 flex items-center">
                  <ArrowUpRight className="h-3.5 w-3.5 mr-1 text-amber-500" />
                  Tables missing primary keys:
                </div>
                <div className="flex flex-wrap gap-1">
                  {stats.tablesWithoutPK.map(table => (
                    <Badge key={table} variant="outline" className="text-xs bg-amber-500/10 border-amber-500/20">
                      {table}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};