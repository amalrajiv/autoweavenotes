import React, { useState } from 'react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { useNoteStore } from '@/store/useNoteStore';
import { useSettings } from '@/store/useSettingsStore';
import { semanticSearch } from '@/lib/search';
import { Note } from '@/types/Note';
import { FileText, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from './ui/button';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Note[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { notes, setActiveNote } = useNoteStore();
  const { apiKey } = useSettings();

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await semanticSearch(searchQuery, notes, apiKey);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (note: Note) => {
    setActiveNote(note);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command>
        <CommandInput 
          placeholder="Search notes..." 
          value={query}
          onValueChange={handleSearch}
        />
        <CommandList>
          <CommandEmpty>
            {isSearching ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  {apiKey ? 'No results found.' : 'Add OpenAI API key in settings for semantic search.'}
                </p>
              </div>
            )}
          </CommandEmpty>
          {results.length > 0 && (
            <CommandGroup heading="Notes">
              {results.map((note) => (
                <CommandItem
                  key={note.id}
                  value={note.title}
                  onSelect={() => handleSelect(note)}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {note.title || 'Untitled Note'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {format(new Date(note.updatedAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}