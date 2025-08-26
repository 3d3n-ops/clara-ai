import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { renderMermaidDiagrams } from '@/lib/mermaid-utils';

interface Diagram {
  type: 'mermaid' | 'image';
  content: string;
  title?: string;
}

interface LectureDiagramsProps {
  diagrams: Diagram[];
  className?: string;
}

export function LectureDiagrams({ diagrams, className = '' }: LectureDiagramsProps) {
  const [activeTab, setActiveTab] = useState('0');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle Mermaid diagram rendering
  useEffect(() => {
    if (diagrams.length > 0 && contentRef.current) {
      // Small delay to ensure the DOM is ready
      const timer = setTimeout(() => {
        renderMermaidDiagrams(contentRef.current!);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [diagrams, activeTab, isFullscreen]);

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: 'Copied to clipboard',
        description: 'The diagram code has been copied to your clipboard.',
      });
    } catch (err) {
      console.error('Failed to copy diagram: ', err);
      toast({
        title: 'Error',
        description: 'Failed to copy diagram to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const refreshDiagram = () => {
    if (contentRef.current) {
      // Find the active diagram and reset its processed state
      const activeDiagram = contentRef.current.querySelector(`[data-tab="${activeTab}"] .mermaid`);
      if (activeDiagram) {
        activeDiagram.removeAttribute('data-processed');
        activeDiagram.innerHTML = diagrams[parseInt(activeTab)].content;
        renderMermaidDiagrams(contentRef.current);
      }
    }
  };

  if (diagrams.length === 0) {
    return null;
  }

  return (
    <Card 
      ref={containerRef}
      className={`${className} ${isFullscreen ? 'fixed inset-0 z-50 m-0 h-screen w-screen max-h-screen' : 'relative'}`}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Diagrams</CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => diagrams[parseInt(activeTab)]?.type === 'mermaid' && copyToClipboard(diagrams[parseInt(activeTab)].content)}
            disabled={diagrams[parseInt(activeTab)]?.type !== 'mermaid'}
            title="Copy diagram code"
          >
            <Copy className="h-4 w-4" />
            <span className="sr-only">Copy diagram</span>
          </Button>
          
          {diagrams[parseInt(activeTab)]?.type === 'mermaid' && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={refreshDiagram}
              title="Refresh diagram"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="sr-only">Refresh diagram</span>
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
            <span className="sr-only">{isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="h-[calc(100%-60px)]" ref={contentRef}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="mb-4">
            {diagrams.map((_, index) => (
              <TabsTrigger key={index} value={index.toString()}>
                {diagrams[index].title || `Diagram ${index + 1}`}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {diagrams.map((diagram, index) => (
            <TabsContent 
              key={index} 
              value={index.toString()}
              className={`h-[calc(100%-48px)] ${isFullscreen ? 'p-8' : ''}`}
              data-tab={index}
            >
              <div className="h-full w-full flex items-center justify-center bg-muted/50 rounded-lg p-4 overflow-auto">
                {diagram.type === 'mermaid' ? (
                  <div 
                    className="mermaid w-full h-full flex items-center justify-center"
                    data-diagram-index={index}
                  >
                    {diagram.content}
                  </div>
                ) : (
                  <img 
                    src={diagram.content} 
                    alt={diagram.title || `Diagram ${index + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
