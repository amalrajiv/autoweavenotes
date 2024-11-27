import React, { useState, useRef, useEffect } from 'react';
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Send, Loader2, Bot, User } from 'lucide-react';
import { useSage } from './sage-provider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet";
import { useSettings } from '@/store/useSettingsStore';
import { chatWithSage } from '@/lib/ai';
import { useNoteStore } from '@/store/useNoteStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function SageChat() {
  const { isOpen, setIsOpen } = useSage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { apiKey } = useSettings();
  const { notes } = useNoteStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !apiKey) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare context about user's notes
      const notesContext = notes.map(note => 
        `Title: ${note.title}\nContent: ${note.content}`
      ).join('\n\n');
      
      const response = await chatWithSage([
        {
          role: 'system',
          content: `Here are the user's notes for context:\n${notesContext}`
        },
        ...messages,
        userMessage
      ], apiKey);

      if (response) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.content,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Failed to get response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const MessageBubble: React.FC<{ message: Message }> = ({ message }) => (
    <div
      className={cn(
        "flex gap-3 mb-4",
        message.role === 'user' ? "justify-end" : "justify-start"
      )}
    >
      {message.role === 'assistant' && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          message.role === 'user'
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
      {message.role === 'user' && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );

  if (!apiKey) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Talk to Sage</SheetTitle>
            <SheetDescription className="text-destructive">
              Please set your OpenAI API key in the settings to use this feature.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader className="space-y-4">
          <SheetTitle>Talk to Sage</SheetTitle>
          <SheetDescription>
            Ask me anything about your notes! I can help you find information, summarize content, 
            or make connections between different notes.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-12rem)]">
          <ScrollArea className="flex-1 pr-4 mt-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  <p className="mb-2">Here are some things you can ask me:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Summarize my recent notes about [topic]</li>
                    <li>What are the key points from my note about [title]?</li>
                    <li>Find connections between [topic A] and [topic B]</li>
                    <li>Help me organize my thoughts on [topic]</li>
                  </ul>
                </div>
              ) : (
                messages.map((message, index) => (
                  <MessageBubble key={index} message={message} />
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t mt-auto">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me about your notes..."
                className="flex-1 bg-muted p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}