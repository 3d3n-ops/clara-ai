import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, ArrowRight, RotateCcw, Copy, Check } from 'lucide-react';
import { toast } from './ui/use-toast';

interface Flashcard {
  question: string;
  answer: string;
}

interface LectureFlashcardsProps {
  flashcards: Flashcard[];
  className?: string;
}

export function LectureFlashcards({ flashcards, className = '' }: LectureFlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const currentCard = flashcards[currentIndex];
  const totalCards = flashcards.length;

  const handlePrevious = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? flashcards.length - 1 : prevIndex - 1
    );
  }, [flashcards.length]);

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prevIndex) => 
      prevIndex === flashcards.length - 1 ? 0 : prevIndex + 1
    );
  }, [flashcards.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === ' ' || e.key === 'Enter') {
      setIsFlipped(prev => !prev);
    }
  }, [handleNext, handlePrevious]);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      
      toast({
        title: 'Copied to clipboard',
        description: 'The flashcard content has been copied.',
      });
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast({
        title: 'Error',
        description: 'Failed to copy flashcard content.',
        variant: 'destructive',
      });
    }
  };

  if (flashcards.length === 0) {
    return null;
  }

  return (
    <Card className={className} onKeyDown={handleKeyDown} tabIndex={0}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">
          Flashcards ({currentIndex + 1}/{totalCards})
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => copyToClipboard(
              `Q: ${currentCard.question}\nA: ${currentCard.answer}`, 
              currentIndex
            )}
            title="Copy flashcard"
          >
            {copiedIndex === currentIndex ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="sr-only">Copy flashcard</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsFlipped(false)}
            disabled={!isFlipped}
            title="Reset card"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="sr-only">Reset card</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="aspect-[4/3] w-full">
          <div 
            className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
              isFlipped ? '[transform:rotateY(180deg)]' : ''
            }`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front of card */}
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg border bg-card p-6 text-card-foreground shadow-sm [backface-visibility:hidden]">
              <div className="text-sm font-medium text-muted-foreground mb-2">Question</div>
              <div className="text-xl font-semibold text-center flex-1 flex items-center justify-center">
                {currentCard.question}
              </div>
              <div className="text-sm text-muted-foreground mt-4">
                Click to reveal answer
              </div>
            </div>
            
            {/* Back of card */}
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg border bg-muted/50 p-6 [transform:rotateY(180deg)] [backface-visibility:hidden]">
              <div className="text-sm font-medium text-muted-foreground mb-2">Answer</div>
              <div className="text-lg text-center flex-1 flex items-center justify-center">
                {currentCard.answer}
              </div>
              <div className="text-sm text-muted-foreground mt-4">
                Click to see question
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePrevious}
            disabled={flashcards.length <= 1}
            aria-label="Previous card"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} of {totalCards}
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNext}
            disabled={flashcards.length <= 1}
            aria-label="Next card"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
