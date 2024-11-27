import React, { useState, useEffect } from 'react';
import { useNoteStore } from '@/store/useNoteStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Eye, Edit3, Wand2, FileText, Share2, Copy, Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownSyntax } from '@/markdownSyntax';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useSettings } from '@/store/useSettingsStore';
import { cleanupNote } from '@/lib/ai';
import { generateShareLink } from '@/lib/supabase';

export function Editor() {
  const { activeNote, updateNote, notes, setActiveNote } = useNoteStore();
  const [content, setContent] = useState(activeNote?.content || '');
  const [title, setTitle] = useState(activeNote?.title || '');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [showRawContent, setShowRawContent] = useState(false);
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const { apiKey } = useSettings();

  useEffect(() => {
    if (activeNote) {
      setContent(showRawContent ? activeNote.rawContent || '' : activeNote.content);
      setTitle(activeNote.title);
      setViewMode(activeNote.content === '' && activeNote.title === 'Untitled Note' ? 'edit' : 'preview');
    }
  }, [activeNote?.id, showRawContent]);

  if (!activeNote) return null;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (!showRawContent) {
      updateNote({
        ...activeNote,
        content: newContent,
        updatedAt: new Date(),
      });
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    updateNote({
      ...activeNote,
      title: newTitle,
      updatedAt: new Date(),
    });
  };

  const handleLinkClick = (noteId: string) => {
    const linkedNote = notes.find(n => n.id === noteId);
    if (linkedNote) {
      setActiveNote(linkedNote);
    }
  };

  const handleExternalLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const handleAICleanup = async () => {
    if (!apiKey || isProcessing || !activeNote.content.trim()) return;
    
    setIsProcessing(true);
    try {
      const improvedNote = await cleanupNote(activeNote, apiKey);
      if (improvedNote) {
        await updateNote(improvedNote);
        setContent(improvedNote.content);
      }
    } catch (error) {
      console.error('Error during AI cleanup:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    setIsGeneratingLink(true);
    try {
      const publicId = await generateShareLink(activeNote.id);
      if (publicId) {
        const shareUrl = `${window.location.origin}/notes/${publicId}`;
        await navigator.clipboard.writeText(shareUrl);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
        
        // Update local note state
        updateNote({
          ...activeNote,
          isPublic: true,
          publicId,
        });
      }
    } catch (error) {
      console.error('Error sharing note:', error);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const toggleRawContent = () => {
    setShowRawContent(!showRawContent);
    setContent(showRawContent ? activeNote.content : (activeNote.rawContent || ''));
  };

  const processedContent = content.replace(/\[\[(.*?)\]\]/g, (match, title) => {
    const linkedNote = notes.find(n => n.title === title);
    return linkedNote ? `[${title}](note://${linkedNote.id})` : match;
  });

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;
  const backlinkCount = activeNote.backlinks.length;

  return (
    <div className="flex flex-col h-full relative">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
              >
                {viewMode === 'edit' ? <Eye className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {viewMode === 'edit' ? 'Preview Mode' : 'Edit Mode'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMarkdownHelp(true)}
              >
                <span className="font-mono text-sm">MD</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Markdown Help</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {activeNote.rawContent && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleRawContent}
                >
                  <FileText className={cn("h-4 w-4", showRawContent && "text-primary")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showRawContent ? 'Show Current Content' : 'Show Raw Content'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAICleanup}
                disabled={!apiKey || isProcessing || !activeNote.content.trim() || showRawContent}
              >
                <Wand2 className={cn("h-4 w-4", isProcessing && "animate-spin")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!apiKey ? 'Set OpenAI API key in settings' : 
               !activeNote.content.trim() ? 'Add content to use AI cleanup' :
               isProcessing ? 'Processing...' : 'AI Cleanup'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                disabled={isGeneratingLink}
              >
                {showCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : isGeneratingLink ? (
                  <Share2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showCopied ? 'Link copied!' : 'Share note'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <textarea
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Note"
            className="w-full bg-transparent border-none outline-none text-2xl font-bold mb-4 resize-none"
            rows={1}
            style={{ height: 'auto' }}
            readOnly={viewMode === 'preview'}
          />
          
          {viewMode === 'edit' ? (
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Start writing..."
              className="w-full min-h-[calc(100vh-16rem)] bg-transparent border-none outline-none resize-none font-mono"
              readOnly={showRawContent}
            />
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-4xl font-bold mt-6 mb-4" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-3xl font-bold mt-5 mb-3" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-2xl font-bold mt-4 mb-2" {...props} />,
                  h4: ({node, ...props}) => <h4 className="text-xl font-bold mt-3 mb-2" {...props} />,
                  h5: ({node, ...props}) => <h5 className="text-lg font-bold mt-2 mb-1" {...props} />,
                  h6: ({node, ...props}) => <h6 className="text-base font-bold mt-2 mb-1" {...props} />,
                  p: ({node, ...props}) => <p className="my-2" {...props} />,
                  ul: ({node, ordered, ...props}) => (
                    <ul 
                      className={cn(
                        "list-inside my-2",
                        ordered ? "list-decimal" : "list-disc"
                      )} 
                      {...props} 
                    />
                  ),
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside my-2" {...props} />,
                  blockquote: ({node, ...props}) => (
                    <blockquote className="border-l-4 border-primary pl-4 my-2 italic" {...props} />
                  ),
                  code: ({node, inline, ...props}) => 
                    inline ? (
                      <code className="bg-muted px-1 py-0.5 rounded" {...props} />
                    ) : (
                      <code className="block bg-muted p-2 rounded my-2 overflow-x-auto" {...props} />
                    ),
                  a: ({node, href, children, ...props}) => {
                    if (href?.startsWith('note://')) {
                      return (
                        <button
                          onClick={() => handleLinkClick(href.slice(7))}
                          className="text-primary hover:underline cursor-pointer"
                          type="button"
                        >
                          {children}
                        </button>
                      );
                    }
                    return (
                      <button
                        onClick={(e) => handleExternalLinkClick(e as any, href || '#')}
                        className="text-primary hover:underline cursor-pointer"
                        type="button"
                      >
                        {children}
                      </button>
                    );
                  }
                }}
              >
                {processedContent}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {activeNote.isPublic && (
            <span className="flex items-center gap-1">
              <Share2 className="h-3 w-3" />
              Shared
            </span>
          )}
        </div>
        <div className="flex gap-4">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          <span>{backlinkCount} backlinks</span>
        </div>
      </div>

      <Sheet open={showMarkdownHelp} onOpenChange={setShowMarkdownHelp}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Markdown Syntax Guide</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
            <div className="prose prose-sm dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdownSyntax}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}