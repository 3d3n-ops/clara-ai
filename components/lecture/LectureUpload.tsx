import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { FileText, Upload, X, Loader2 } from 'lucide-react';
import { toast } from './ui/use-toast';
import { LectureContent } from './LectureContent';

interface LectureUploadProps {
  onProcessingComplete?: (content: any) => void;
  className?: string;
}

export function LectureUpload({ onProcessingComplete, className = '' }: LectureUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleFile = (selectedFile: File) => {
    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(pdf|docx?|txt)$/i)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF, DOC, DOCX, or TXT file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProcessingComplete = (content: any) => {
    if (onProcessingComplete) {
      onProcessingComplete(content);
    }
  };

  if (file) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-sm truncate max-w-xs">
              {file.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={removeFile}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove file</span>
          </Button>
        </div>

        <LectureContent 
          file={file} 
          onProcessingComplete={handleProcessingComplete}
        />
      </div>
    );
  }

  return (
    <div 
      {...getRootProps()} 
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer 
        transition-colors hover:border-primary/50 ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
        ${className}
      `}
    >
      <input 
        {...getInputProps()} 
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleFileInputChange}
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-3 rounded-full bg-primary/10">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        
        <div className="space-y-1">
          <h3 className="text-lg font-medium">
            {isDragActive ? 'Drop the file here' : 'Upload lecture materials'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop a PDF, DOC, DOCX, or TXT file here, or click to select
          </p>
        </div>
        
        <Button 
          type="button" 
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          Select File
        </Button>
        
        <p className="text-xs text-muted-foreground mt-2">
          Maximum file size: 10MB
        </p>
      </div>
    </div>
  );
}
