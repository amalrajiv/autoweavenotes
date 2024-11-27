import { create } from 'zustand';
import { saveFolder, deleteFolder, getFolders, updateNoteFolder } from '@/lib/supabase';

export interface Folder {
  id: string;
  name: string;
  expanded: boolean;
  noteIds: string[];
}

interface FolderStore {
  folders: Record<string, Folder>;
  isLoading: boolean;
  loadFolders: () => Promise<void>;
  addFolder: (name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  toggleFolder: (id: string) => void;
  moveNote: (noteId: string, fromFolderId: string | null, toFolderId: string | null) => Promise<void>;
  clearFolders: () => void;
}

export const useFolderStore = create<FolderStore>((set, get) => ({
  folders: {},
  isLoading: false,

  loadFolders: async () => {
    set({ isLoading: true });
    try {
      const folders = await getFolders();
      const folderMap = folders.reduce((acc, folder) => ({
        ...acc,
        [folder.id]: {
          id: folder.id,
          name: folder.name,
          expanded: true,
          noteIds: [],
        },
      }), {});
      set({ folders: folderMap, isLoading: false });
    } catch (error) {
      console.error('Error loading folders:', error);
      set({ folders: {}, isLoading: false });
    }
  },
  
  addFolder: async (name: string) => {
    try {
      const id = crypto.randomUUID();
      const folder = await saveFolder({ id, name });
      set((state) => ({
        folders: {
          ...state.folders,
          [id]: {
            id,
            name: folder.name,
            expanded: true,
            noteIds: [],
          },
        },
      }));
    } catch (error) {
      console.error('Error adding folder:', error);
    }
  },

  deleteFolder: async (id: string) => {
    try {
      await deleteFolder(id);
      set((state) => {
        const { [id]: deleted, ...rest } = state.folders;
        return { folders: rest };
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  },

  toggleFolder: (id: string) => {
    set((state) => ({
      folders: {
        ...state.folders,
        [id]: {
          ...state.folders[id],
          expanded: !state.folders[id].expanded,
        },
      },
    }));
  },

  moveNote: async (noteId: string, fromFolderId: string | null, toFolderId: string | null) => {
    try {
      await updateNoteFolder(noteId, toFolderId);
      
      set((state) => {
        const newFolders = { ...state.folders };

        if (fromFolderId && newFolders[fromFolderId]) {
          newFolders[fromFolderId] = {
            ...newFolders[fromFolderId],
            noteIds: newFolders[fromFolderId].noteIds.filter(id => id !== noteId),
          };
        }

        if (toFolderId && newFolders[toFolderId]) {
          newFolders[toFolderId] = {
            ...newFolders[toFolderId],
            noteIds: [...newFolders[toFolderId].noteIds, noteId],
          };
        }

        return { folders: newFolders };
      });
    } catch (error) {
      console.error('Error moving note:', error);
    }
  },

  clearFolders: () => {
    set({ folders: {} });
  },
}));