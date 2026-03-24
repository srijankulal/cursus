'use client';

import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface UploadManagerProps {
  staffMode?: boolean;
}

export function UploadManager({ staffMode = false }: UploadManagerProps) {
  const [documentType, setDocumentType] = useState(staffMode ? 'notes' : '');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  // Add a status message state to replace window alerts
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setStatusMessage({ text: '', type: '' }); // Clear message when new file is selected
    }
  };

  const handleClear = () => {
    setDocumentType(staffMode ? 'notes' : '');
    setSubject('');
    setSemester('');
    setDepartment('');
    setSelectedFile(null);
    setStatusMessage({ text: '', type: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    setStatusMessage({ text: '', type: '' }); // Reset message

    if (!documentType || !selectedFile || !subject || !semester || !department) {
      setStatusMessage({ text: "Please fill in all fields and select a file.", type: 'error' });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', documentType);
      formData.append('subject', subject);
      formData.append('semester', semester);
      formData.append('department', department);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setStatusMessage({ text: "Successfully uploaded and saved to system!", type: 'success' });
        
        // Clear form fields but keep the success message
        setDocumentType(staffMode ? 'notes' : '');
        setSubject('');
        setSemester('');
        setDepartment('');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Auto-hide success message after 3 seconds
        setTimeout(() => setStatusMessage({ text: '', type: '' }), 3000);
      } else {
        setStatusMessage({ text: `Upload failed: ${data.error || 'Unknown error'}`, type: 'error' });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setStatusMessage({ text: "An error occurred during upload. Please try again.", type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full flex justify-center py-6">
      <Card className="w-full max-w-xl shadow-premium border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl">Upload Document</CardTitle>
          <CardDescription>Upload notes or question papers for the syllabus.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Status Message Banner */}
          {statusMessage.text && (
            <div className={`p-3 rounded-lg text-sm font-medium ${statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {statusMessage.text}
            </div>
          )}

          {!staffMode && (
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">Document Type</label>
              <Select value={documentType} onValueChange={setDocumentType} disabled={isUploading}>
                <SelectTrigger className="w-full h-11 bg-slate-50">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notes">Notes</SelectItem>
                  <SelectItem value="question_papers">Question Papers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">Subject</label>
              <Input placeholder="e.g. Mathematics" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={isUploading} className="h-11 bg-slate-50" />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">Semester</label>
              <Input type="number" min="1" max="6" placeholder="e.g. 1" value={semester} onChange={(e) => setSemester(e.target.value)} disabled={isUploading} className="h-11 bg-slate-50" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">Department</label>
            <Input placeholder="e.g. Computer Science" value={department} onChange={(e) => setDepartment(e.target.value)} disabled={isUploading} className="h-11 bg-slate-50" />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">Select File</label>
            <Input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" disabled={isUploading} className="h-11 bg-slate-50 pt-2.5" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 rounded-b-xl border-t border-slate-100 bg-slate-50/50 p-6">
          <Button variant="outline" onClick={handleClear} disabled={isUploading} className="rounded-xl">
            Clear
          </Button>
          <Button onClick={handleUpload} disabled={!documentType || !selectedFile || !subject || !semester || !department || isUploading} className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">
            {isUploading ? "Uploading..." : "Upload File"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}