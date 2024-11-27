import React from 'react';
import { useParams } from 'react-router-dom';
import { getPublicNote } from '@/lib/supabase';
import { Note } from '@/types/Note';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

export function PublicNote() {
  const { publicId } = useParams();
  const [note, setNote] = React.useState<Note | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadNote() {
      if (!publicId) {
        setError('Invalid note ID');
        setIsLoading(false);
        return;
      }

      try {
        const note = await getPublicNote(publicId);
        if (!note) {
          setError('Note not found or is not public');
        } else {
          setNote(note);
        }
      } catch (err) {
        setError('Failed to load note');
      } finally {
        setIsLoading(false);
      }
    }

    loadNote();
  }, [publicId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen bg-background">
      <h1 className="text-3xl font-bold mb-8">{note.title}</h1>
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
              <ul className={cn("list-inside my-2", ordered ? "list-decimal" : "list-disc")} {...props} />
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
          }}
        >
          {note.content}
        </ReactMarkdown>
      </div>
      <div className="mt-8 text-sm text-muted-foreground">
        Last updated: {new Date(note.updatedAt).toLocaleDateString()}
      </div>
    </div>
  );
}