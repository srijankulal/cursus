'use client';

import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function UploadPage() {
  const [documentType, setDocumentType] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [semester, setSemester] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setDocumentType('');
    setSubject('');
    setSemester('');
    setDepartment('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    // Basic validation
    if (!documentType || !selectedFile || !subject || !semester || !department) {
      alert("Please fill in all fields and select a file.");
      return;
    }
    
    setIsUploading(true);
    
    try {
      console.log("Starting upload to API...");
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', documentType);
      formData.append('subject', subject);
      formData.append('semester', semester);
      formData.append('department', department);

      // Call our updated single API route
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData, // the browser will set the correct Content-Type for multipart/form-data
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log("Upload successful! Details:", data);
        alert(`Successfully uploaded and saved to DB!\nURL: ${data.url}`);
      } else {
        alert(`Upload failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during upload.");
    } finally {
      setIsUploading(false);
      handleClear(); // Optional: clears the form after a successful upload
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <Card className="w-full max-w-md shadow-lg overflow-y-auto max-h-[90vh]">
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>Upload notes or question papers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Document Type</label>
            <Select value={documentType} onValueChange={setDocumentType} disabled={isUploading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="notes">Notes</SelectItem>
                <SelectItem value="question_papers">Question Papers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Subject</label>
            <Input 
              placeholder="e.g. Mathematics, Operating Systems" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Semester (1-6)</label>
            <Input 
              type="number" 
              min="1" 
              max="6" 
              placeholder="e.g. 1" 
              value={semester} 
              onChange={(e) => setSemester(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Department</label>
            <Input 
              placeholder="e.g. Computer Science, Mechanical" 
              value={department} 
              onChange={(e) => setDepartment(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Select File</label>
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              disabled={isUploading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClear} disabled={isUploading}>
            Clear
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!documentType || !selectedFile || !subject || !semester || !department || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}