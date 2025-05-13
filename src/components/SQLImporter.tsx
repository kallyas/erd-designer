
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { parseSQL } from "@/utils/sqlGenerator";
import { DiagramState } from "@/types";
import { toast } from "sonner";
import { Upload, Link } from "lucide-react";

interface SQLImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (diagram: DiagramState) => void;
}

const SQLImporter = ({ isOpen, onClose, onImport }: SQLImporterProps) => {
  const [sqlCode, setSqlCode] = useState<string>('');
  const [sqlUrl, setSqlUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setSqlCode(content);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to read file');
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleUrlImport = async () => {
    if (!sqlUrl) {
      setError('Please enter a URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(sqlUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      const content = await response.text();
      setSqlCode(content);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch SQL from URL');
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    if (!sqlCode.trim()) {
      setError('Please enter or upload SQL code');
      return;
    }

    try {
      const diagram = parseSQL(sqlCode);
      if (diagram.nodes.length === 0) {
        setError('No tables found in SQL');
        return;
      }
      
      onImport(diagram);
      onClose();
      toast.success(`Imported ${diagram.nodes.length} tables successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse SQL');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import SQL</DialogTitle>
          <DialogDescription>
            Import your existing SQL schema to create an ERD diagram
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="paste">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="paste">Paste SQL</TabsTrigger>
            <TabsTrigger value="file">Upload File</TabsTrigger>
            <TabsTrigger value="url">Import from URL</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-4">
            <Textarea
              placeholder="Paste your SQL CREATE TABLE statements here..."
              className="min-h-[200px]"
              value={sqlCode}
              onChange={(e) => setSqlCode(e.target.value)}
            />
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
              />
              <Button asChild variant="secondary" size="sm">
                <label htmlFor="sql-file-upload" className="cursor-pointer">
                  Select File
                </label>
              </Button>
            </div>
            
            {sqlCode && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">SQL Preview:</p>
                <div className="border rounded-md p-2 max-h-[150px] overflow-y-auto">
                  <pre className="text-xs">{sqlCode.substring(0, 500)}{sqlCode.length > 500 ? '...' : ''}</pre>
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
                />
              </div>
              <Button onClick={handleUrlImport} disabled={isLoading}>
                <Link className="mr-2 h-4 w-4" />
                Fetch
              </Button>
            </div>
            
            {sqlCode && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">SQL Preview:</p>
                <div className="border rounded-md p-2 max-h-[150px] overflow-y-auto">
                  <pre className="text-xs">{sqlCode.substring(0, 500)}{sqlCode.length > 500 ? '...' : ''}</pre>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm mt-2">
            {error}
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={isLoading}>
            Import Schema
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SQLImporter;
