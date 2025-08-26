import React, { useState, useEffect } from 'react';
import { LectureNotes } from '@/components/lecture/LectureNotes';
import { LectureDiagrams } from '@/components/lecture/LectureDiagrams';
import { LectureFlashcards } from '@/components/lecture/LectureFlashcards';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ProcessedContent {
  notes: string;
  diagrams: Array<{
    type: 'mermaid' | 'image';
    content: string;
    title?: string;
  }>;
  flashcards: Array<{
    question: string;
    answer: string;
  }>;
}

interface LectureContentProps {
  file: File | null;
  onProcessingComplete?: (content: ProcessedContent) => void;
  className?: string;
}

export function LectureContent({ file, onProcessingComplete, className = '' }: LectureContentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedContent, setProcessedContent] = useState<ProcessedContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processFile = async () => {
      if (!file) return;

      setIsProcessing(true);
      setError(null);

      try {
        // Read file as base64
        const base64Content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });

        // Call the backend API
        const response = await fetch('/api/process-lecture', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file_content: base64Content,
            file_name: file.name,
            file_type: file.type || file.name.split('.').pop() || '',
            user_id: 'current-user-id', // Replace with actual user ID
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Failed to process lecture');
        }

        const data: ProcessedContent = await response.json();
        setProcessedContent(data);
        
        if (onProcessingComplete) {
          onProcessingComplete(data);
        }
      } catch (err) {
        console.error('Error processing lecture:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processFile();
  }, [file, onProcessingComplete]);

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Processing your lecture materials...</p>
        <div className="text-sm text-muted-foreground">
          <p>Generating notes, diagrams, and flashcards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!processedContent) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Upload a lecture file to get started
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <LectureNotes 
            content={processedContent.notes} 
            className="h-full"
          />
        </div>
        
        <div className="space-y-6">
          <LectureDiagrams 
            diagrams={processedContent.diagrams} 
            className="h-[400px]"
          />
          
          <LectureFlashcards 
            flashcards={processedContent.flashcards}
            className="h-[400px]"
          />
        </div>
      </div>
    </div>
  );
}
