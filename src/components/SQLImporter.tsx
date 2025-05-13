// src/components/SQLImporter.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { parseSQL } from "@/utils/sqlGenerator";
import { DiagramState } from "@/types";
import { toast } from "sonner";
import {
  Upload,
  Link,
  AlertTriangle,
  Database,
  FileText,
  Server,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { SUPPORTED_DIALECTS } from "@/utils/dialectManager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SQLImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (diagram: DiagramState) => void;
}

const SQLImporter = ({ isOpen, onClose, onImport }: SQLImporterProps) => {
  const [sqlCode, setSqlCode] = useState<string>("");
  const [sqlUrl, setSqlUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<DiagramState | null>(null);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [sqlDialect, setSqlDialect] = useState<string>("mysql");
  const [dbConnection, setDbConnection] = useState<{
    host: string;
    port: string;
    username: string;
    password: string;
    database: string;
  }>({
    host: "localhost",
    port: "3306",
    username: "",
    password: "",
    database: "",
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError("");
    setImportProgress(10);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setSqlCode(content);
        setImportProgress(100);
        setIsLoading(false);

        // Generate preview
        generatePreview(content);
      } catch (err) {
        setError("Failed to read file");
        setIsLoading(false);
        setImportProgress(0);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file");
      setIsLoading(false);
      setImportProgress(0);
    };

    // Simulate progress
    let progress = 10;
    const interval = setInterval(() => {
      progress += 10;
      if (progress > 90) {
        clearInterval(interval);
      } else {
        setImportProgress(progress);
      }
    }, 100);

    reader.readAsText(file);
  };

  const handleUrlImport = async () => {
    if (!sqlUrl) {
      setError("Please enter a URL");
      return;
    }

    setIsLoading(true);
    setError("");
    setImportProgress(10);

    try {
      // Simulate progress
      let progress = 10;
      const interval = setInterval(() => {
        progress += 5;
        if (progress > 90) {
          clearInterval(interval);
        } else {
          setImportProgress(progress);
        }
      }, 100);

      const response = await fetch(sqlUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      const content = await response.text();
      setSqlCode(content);
      setImportProgress(100);
      setIsLoading(false);
      clearInterval(interval);

      // Generate preview
      generatePreview(content);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch SQL from URL"
      );
      setIsLoading(false);
      setImportProgress(0);
    }
  };

  const handleDBConnect = () => {
    // Simulate database connection
    setIsLoading(true);
    setError("");
    setImportProgress(10);

    // Simulate progress
    let progress = 10;
    const progressInterval = setInterval(() => {
      progress += 5;
      if (progress > 90) {
        clearInterval(progressInterval);
      } else {
        setImportProgress(progress);
      }
    }, 150);

    // Simulate DB connection and schema retrieval
    setTimeout(() => {
      clearInterval(progressInterval);

      // Check for required fields
      if (
        !dbConnection.host ||
        !dbConnection.username ||
        !dbConnection.database
      ) {
        setError("Host, username, and database are required");
        setIsLoading(false);
        setImportProgress(0);
        return;
      }

      // Generate mock SQL based on selected dialect
      let mockSQL = "";
      if (sqlDialect === "mysql") {
        mockSQL = `-- Mock MySQL schema
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);`;
      } else if (sqlDialect === "postgresql") {
        mockSQL = `-- Mock PostgreSQL schema
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);`;
      }

      setSqlCode(mockSQL);
      setImportProgress(100);
      setIsLoading(false);

      // Generate preview
      generatePreview(mockSQL);

      toast.success(`Connected to ${dbConnection.database} database`);
    }, 2000);
  };

  const generatePreview = (sql: string) => {
    try {
      const diagram = parseSQL(sql);
      setPreviewData(diagram);
      setPreviewMode(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse SQL");
      setPreviewMode(false);
      setPreviewData(null);
    }
  };

  const handleImport = () => {
    if (!sqlCode.trim()) {
      setError("Please enter or upload SQL code");
      return;
    }

    try {
      // If we already have a preview, use that
      if (previewData) {
        onImport(previewData);
        reset();
        return;
      }

      // Otherwise parse the SQL
      const diagram = parseSQL(sqlCode);
      if (diagram.nodes.length === 0) {
        setError("No tables found in SQL");
        return;
      }

      onImport(diagram);
      reset();
      toast.success(`Imported ${diagram.nodes.length} tables successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse SQL");
    }
  };

  const reset = () => {
    setSqlCode("");
    setSqlUrl("");
    setError("");
    setImportProgress(0);
    setIsLoading(false);
    setPreviewMode(false);
    setPreviewData(null);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) reset();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import SQL Schema</DialogTitle>
          <DialogDescription>
            Import your existing SQL schema to create an ERD diagram
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="paste">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="paste">Paste SQL</TabsTrigger>
            <TabsTrigger value="file">Upload File</TabsTrigger>
            <TabsTrigger value="url">From URL</TabsTrigger>
            <TabsTrigger value="db">Database</TabsTrigger>
          </TabsList>

          {!previewMode ? (
            <>
              <TabsContent value="paste" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">SQL Dialect</span>
                    <Select value={sqlDialect} onValueChange={setSqlDialect}>
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue placeholder="SQL dialect" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_DIALECTS.map((dialect) => (
                          <SelectItem key={dialect.key} value={dialect.key}>
                            {dialect.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    placeholder="Paste your SQL CREATE TABLE statements here..."
                    className="min-h-[200px] font-mono text-sm"
                    value={sqlCode}
                    onChange={(e) => setSqlCode(e.target.value)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="file" className="space-y-4">
                <div className="border border-dashed border-gray-300 rounded-md p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-2">
                    Click or drag and drop to upload a SQL file
                  </p>
                  <Input
                    type="file"
                    accept=".sql,.txt"
                    className="hidden"
                    id="sql-file-upload"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    disabled={isLoading}
                  >
                    <label htmlFor="sql-file-upload" className="cursor-pointer">
                      Select File
                    </label>
                  </Button>
                </div>

                {isLoading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Importing...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} />
                  </div>
                )}

                {sqlCode && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">SQL Preview:</p>
                    <div className="border rounded-md p-2 max-h-[150px] overflow-y-auto bg-gray-50 font-mono text-xs">
                      <pre>
                        {sqlCode.substring(0, 500)}
                        {sqlCode.length > 500 ? "..." : ""}
                      </pre>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="url" className="space-y-4">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter URL to SQL file"
                      value={sqlUrl}
                      onChange={(e) => setSqlUrl(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <Button onClick={handleUrlImport} disabled={isLoading}>
                    <Link className="mr-2 h-4 w-4" />
                    Fetch
                  </Button>
                </div>

                {isLoading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Fetching...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} />
                  </div>
                )}

                {sqlCode && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">SQL Preview:</p>
                    <div className="border rounded-md p-2 max-h-[150px] overflow-y-auto bg-gray-50 font-mono text-xs">
                      <pre>
                        {sqlCode.substring(0, 500)}
                        {sqlCode.length > 500 ? "..." : ""}
                      </pre>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="db" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Database Type</label>
                    <Select value={sqlDialect} onValueChange={setSqlDialect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select database type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="postgresql">PostgreSQL</SelectItem>
                        <SelectItem value="sqlserver">SQL Server</SelectItem>
                        <SelectItem value="oracle">Oracle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Host</label>
                    <Input
                      placeholder="localhost"
                      value={dbConnection.host}
                      onChange={(e) =>
                        setDbConnection({
                          ...dbConnection,
                          host: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Port</label>
                    <Input
                      placeholder="3306"
                      value={dbConnection.port}
                      onChange={(e) =>
                        setDbConnection({
                          ...dbConnection,
                          port: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Database</label>
                    <Input
                      placeholder="mydatabase"
                      value={dbConnection.database}
                      onChange={(e) =>
                        setDbConnection({
                          ...dbConnection,
                          database: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Username</label>
                    <Input
                      placeholder="root"
                      value={dbConnection.username}
                      onChange={(e) =>
                        setDbConnection({
                          ...dbConnection,
                          username: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={dbConnection.password}
                      onChange={(e) =>
                        setDbConnection({
                          ...dbConnection,
                          password: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleDBConnect}
                  disabled={isLoading}
                >
                  <Server className="mr-2 h-4 w-4" />
                  Connect to Database
                </Button>

                {isLoading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Connecting...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} />
                  </div>
                )}
              </TabsContent>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1.5 text-green-500" />
                  SQL Parse Successful
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewMode(false)}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Edit SQL
                </Button>
              </div>

              <div className="border rounded-md p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center">
                    <Database className="h-4 w-4 mr-1.5" />
                    Schema Preview
                  </h4>
                  <div className="flex items-center space-x-1">
                    <div className="text-xs font-medium">
                      {previewData?.nodes.length || 0} Tables
                    </div>
                    <span className="text-gray-300">•</span>
                    <div className="text-xs font-medium">
                      {previewData?.edges.length || 0} Relationships
                    </div>
                  </div>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {previewData?.nodes.map((node, index) => (
                    <div
                      key={index}
                      className="border rounded-md p-2 bg-white text-xs"
                    >
                      <div className="font-medium">{node.data.tableName}</div>
                      <div className="mt-1 pl-2 border-l-2 border-gray-200 space-y-0.5">
                        {node.data.columns.slice(0, 3).map((col, colIndex) => (
                          <div key={colIndex} className="flex items-center">
                            <span className="font-mono text-gray-600">
                              {col.name}
                            </span>
                            <span className="mx-1 text-gray-400">:</span>
                            <span className="text-gray-500">{col.type}</span>
                            {col.isPrimaryKey && (
                              <span className="ml-1 text-amber-600 text-[10px]">
                                PK
                              </span>
                            )}
                            {col.isForeignKey && (
                              <span className="ml-1 text-blue-600 text-[10px]">
                                FK
                              </span>
                            )}
                          </div>
                        ))}
                        {node.data.columns.length > 3 && (
                          <div className="text-gray-400 text-[10px]">
                            + {node.data.columns.length - 3} more columns
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Tabs>

        {error && (
          <Alert
            variant="destructive"
            className="bg-red-50 text-red-800 p-3 rounded-md text-sm mt-2"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isLoading}>
            Import Schema
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SQLImporter;
