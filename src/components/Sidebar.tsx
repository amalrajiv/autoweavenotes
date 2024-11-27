import React, { useState, useEffect } from 'react';
import { Search, Plus, Network, Settings as SettingsIcon, Sparkles, ChevronRight, ChevronDown, FolderIcon, Trash2, LogOut, SearchIcon } from 'lucide-react';
import { useNoteStore } from '../store/useNoteStore';
import { useFolderStore } from '../store/useFolderStore';
import { SearchDialog } from './SearchDialog';
import { format } from 'date-fns';
import { createNewNote } from '../utils/noteUtils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { Settings } from './Settings';
import { GraphView } from './GraphView';
import { useSage } from './chat/sage-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useDialog } from './ui/dialog-provider';
import { useAuth } from './auth/auth-provider';

interface NoteItemProps {
  note: Note;
  onSelect: () => void;
  onDelete: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

const NoteItem: React.FC<NoteItemProps> = ({
  note,
  onSelect,
  onDelete,
  draggable,
  onDragStart,
}) => {
  const truncatedTitle = note.title.length > 25 
    ? `${note.title.slice(0, 25)}...` 
    : note.title || "Untitled Note";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "group flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer relative text-sm",
              draggable && "cursor-grab active:cursor-grabbing"
            )}
            onClick={onSelect}
            draggable={draggable}
            onDragStart={onDragStart}
          >
            <div className="flex-1 flex items-center justify-between min-w-0">
              <span className="truncate">{truncatedTitle}</span>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-muted-foreground shrink-0">
                  {format(new Date(note.updatedAt), 'MMM d')}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          {note.title || "Untitled Note"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export function Sidebar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { setIsOpen: setSageOpen } = useSage();
  const { showDialog } = useDialog();
  const { signOut } = useAuth();
  
  const { notes, addNote, deleteNote, setActiveNote } = useNoteStore();
  const { folders, loadFolders, addFolder, deleteFolder, toggleFolder, moveNote } = useFolderStore();

  useEffect(() => {
    loadFolders().catch(console.error);
  }, [loadFolders]);

  const handleCreateNote = () => {
    const newNote = createNewNote();
    addNote(newNote);
    setActiveNote(newNote);
  };

  const handleDeleteNote = async (noteId: string) => {
    const confirmed = await showDialog({
      title: 'Delete Note',
      description: 'Are you sure you want to delete this note? This action cannot be undone.',
      confirmLabel: 'Delete',
    });

    if (confirmed) {
      deleteNote(noteId);
    }
  };

  const handleCreateFolder = async () => {
    let folderName = '';
    const result = await showDialog({
      title: 'Create New Folder',
      description: 'Enter a name for your new folder.',
      confirmLabel: 'Create',
      input: {
        value: folderName,
        onChange: (value) => {
          folderName = value;
        },
        placeholder: 'Folder name'
      }
    });

    if (result && folderName.trim()) {
      addFolder(folderName.trim());
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    const confirmed = await showDialog({
      title: 'Delete Folder',
      description: 'Are you sure you want to delete this folder? The notes inside will not be deleted.',
      confirmLabel: 'Delete',
    });

    if (confirmed) {
      deleteFolder(folderId);
    }
  };

  const handleDragStart = (e: React.DragEvent, noteId: string, folderId: string | null = null) => {
    e.dataTransfer.setData('noteId', noteId);
    e.dataTransfer.setData('sourceFolderId', folderId || '');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null = null) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData('noteId');
    const sourceFolderId = e.dataTransfer.getData('sourceFolderId') || null;
    
    if (noteId && sourceFolderId !== targetFolderId) {
      moveNote(noteId, sourceFolderId, targetFolderId);
    }
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unorganizedNotes = filteredNotes.filter(note => !note.folderId);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <div className="w-64 border-r bg-background flex flex-col">
      <div className="p-2 border-b">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setShowSearch(true)}
          >
            <SearchIcon className="mr-2 h-4 w-4" />
            <span>Search notes...</span>
            <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleCreateNote}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.values(folders).map((folder) => (
            <div
              key={folder.id}
              className="mb-2"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, folder.id)}
            >
              <div className="flex items-center gap-1 group">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => toggleFolder(folder.id)}
                >
                  {folder.expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                <div className="flex-1 flex items-center">
                  <FolderIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm">{folder.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => handleDeleteFolder(folder.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
              {folder.expanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {filteredNotes
                    .filter(note => note.folderId === folder.id)
                    .map(note => (
                      <NoteItem
                        key={note.id}
                        note={note}
                        onSelect={() => setActiveNote(note)}
                        onDelete={() => handleDeleteNote(note.id)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, note.id, folder.id)}
                      />
                    ))}
                </div>
              )}
            </div>
          ))}

          {unorganizedNotes.length > 0 && (
            <div 
              className="space-y-1"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, null)}
            >
              {unorganizedNotes.map(note => (
                <NoteItem
                  key={note.id}
                  note={note}
                  onSelect={() => setActiveNote(note)}
                  onDelete={() => handleDeleteNote(note.id)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, note.id)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCreateFolder}
          >
            <FolderIcon className="h-4 w-4" />
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowGraph(true)}
                >
                  <Network className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Knowledge Graph</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSageOpen(true)}
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Talk to Sage</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(true)}
                >
                  <SettingsIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sign Out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <Settings isOpen={showSettings} onOpenChange={setShowSettings} />
      <GraphView isOpen={showGraph} onClose={() => setShowGraph(false)} />
      <SearchDialog open={showSearch} onOpenChange={setShowSearch} />
    </div>
  );
}