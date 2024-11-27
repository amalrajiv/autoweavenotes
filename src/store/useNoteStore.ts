import { create } from 'zustand';
import { Note } from '@/types/Note';
import { createNewNote } from '@/utils/noteUtils';
import { extractBacklinks } from '@/utils/backlinks';
import { processNote } from '@/lib/ai';
import { useSettings } from './useSettingsStore';
import { saveNote, deleteNote, getNotes } from '@/lib/supabase';

interface NoteStore {
  notes: Note[];
  activeNote: Note | null;
  openNotes: string[];
  isLoading: boolean;
  error: string | null;
  loadNotes: () => Promise<void>;
  addNote: (note: Note) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setActiveNote: (note: Note) => void;
  closeNote: (id: string) => void;
  clearNotes: () => void;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  activeNote: null,
  openNotes: [],
  isLoading: false,
  error: null,

  loadNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const notes = await getNotes();
      set({ notes, isLoading: false });
    } catch (error: any) {
      console.error('Error loading notes:', error);
      set({ error: error.message, isLoading: false, notes: [] });
    }
  },

  addNote: async (note) => {
    set({ error: null });
    try {
      const backlinks = extractBacklinks(note.content, get().notes, note.id);
      const noteWithBacklinks = { ...note, backlinks };
      
      const settings = useSettings.getState();
      if (settings.apiKey) {
        await processNote(noteWithBacklinks, settings.apiKey);
      }

      await saveNote(noteWithBacklinks);
      
      set((state) => ({
        notes: [...state.notes, noteWithBacklinks],
        activeNote: noteWithBacklinks,
        openNotes: [...new Set([...state.openNotes, noteWithBacklinks.id])]
      }));
    } catch (error: any) {
      console.error('Error adding note:', error);
      set({ error: error.message });
      throw error;
    }
  },

  updateNote: async (note) => {
    set({ error: null });
    try {
      const settings = useSettings.getState();
      if (settings.apiKey) {
        await processNote(note, settings.apiKey);
      }

      await saveNote(note);

      set((state) => {
        const updatedNotes = state.notes.map((n) => {
          if (n.id === note.id) return note;
          
          const shouldHaveBacklink = extractBacklinks(n.content, [note], n.id).includes(note.id);
          
          if (shouldHaveBacklink && !n.backlinks.includes(note.id)) {
            return { ...n, backlinks: [...n.backlinks, note.id] };
          } else if (!shouldHaveBacklink && n.backlinks.includes(note.id)) {
            return { ...n, backlinks: n.backlinks.filter(id => id !== note.id) };
          }
          
          return n;
        });

        return {
          notes: updatedNotes,
          activeNote: note.id === state.activeNote?.id ? note : state.activeNote
        };
      });
    } catch (error: any) {
      console.error('Error updating note:', error);
      set({ error: error.message });
      throw error;
    }
  },

  deleteNote: async (id) => {
    set({ error: null });
    try {
      await deleteNote(id);
      
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        activeNote: state.activeNote?.id === id ? null : state.activeNote,
        openNotes: state.openNotes.filter((noteId) => noteId !== id)
      }));
    } catch (error: any) {
      console.error('Error deleting note:', error);
      set({ error: error.message });
      throw error;
    }
  },

  setActiveNote: (note) => {
    set((state) => ({
      activeNote: note,
      openNotes: [...new Set([...state.openNotes, note.id])]
    }));
  },

  closeNote: (id) => {
    set((state) => {
      const newOpenNotes = state.openNotes.filter((noteId) => noteId !== id);
      return {
        openNotes: newOpenNotes,
        activeNote: state.activeNote?.id === id
          ? get().notes.find((n) => n.id === newOpenNotes[newOpenNotes.length - 1]) ?? null
          : state.activeNote
      };
    });
  },

  clearNotes: () => {
    set({ notes: [], activeNote: null, openNotes: [], error: null });
  },
}));