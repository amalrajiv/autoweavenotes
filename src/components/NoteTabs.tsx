import React from 'react';
import { Editor } from './Editor';
import { useNoteStore } from '@/store/useNoteStore';
import { X, FileText, FolderOpen, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { createNewNote } from '@/utils/noteUtils';

export const NoteTabs: React.FC = () => {
  const { notes, activeNote, openNotes, setActiveNote, closeNote, addNote } = useNoteStore();

  const handleCreateNote = () => {
    const newNote = createNewNote();
    addNote(newNote);
    setActiveNote(newNote);
  };

  // Filter out duplicate note IDs and ensure notes exist
  const uniqueOpenNotes = [...new Set(openNotes)]
    .map(noteId => notes.find(n => n.id === noteId))
    .filter((note): note is NonNullable<typeof note> => note !== undefined);

  if (!openNotes.length) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="max-w-md text-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Welcome to your notes</h2>
            <p className="text-muted-foreground">
              Create a new note or open an existing one to get started
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Button
              variant="outline"
              size="lg"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={handleCreateNote}
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Create new note</h3>
                <p className="text-sm text-muted-foreground">
                  Start with a blank canvas
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => {
                const firstNote = notes[0];
                if (firstNote) {
                  setActiveNote(firstNote);
                }
              }}
              disabled={notes.length === 0}
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Open note</h3>
                <p className="text-sm text-muted-foreground">
                  Browse your existing notes
                </p>
              </div>
            </Button>
          </div>

          {notes.length > 0 && (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Recent notes
                  </span>
                </div>
              </div>
              <div className="grid gap-2">
                {notes.slice(0, 3).map((note) => (
                  <Button
                    key={note.id}
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={() => setActiveNote(note)}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="truncate">{note.title || "Untitled Note"}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="border-b">
        <ScrollArea orientation="horizontal">
          <div className="flex p-1 gap-1">
            {uniqueOpenNotes.map((note) => (
              <button
                key={`tab-${note.id}`}
                onClick={() => setActiveNote(note)}
                className={cn(
                  "group flex items-center gap-2 px-4 py-2 min-w-[150px] max-w-[200px]",
                  "rounded-md transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  activeNote?.id === note.id ? "bg-muted text-foreground" : "text-muted-foreground"
                )}
              >
                <span className="truncate flex-1 text-sm text-left">
                  {note.title || "Untitled Note"}
                </span>
                <X
                  className="h-4 w-4 opacity-0 group-hover:opacity-100 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeNote(note.id);
                  }}
                />
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
      
      {activeNote && <Editor />}
    </div>
  );
};