import { createClient } from '@supabase/supabase-js';
import { Note } from '@/types/Note';
import { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
  },
});

// Initialize schema cache
export async function initializeSchema() {
  try {
    // First, refresh the schema cache
    await supabase.rpc('refresh_schema_cache');
    
    // Wait a moment for the cache to update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Add missing columns if they don't exist
    await supabase.rpc('ensure_required_columns');
    
    // Verify tables and columns exist
    const { error: notesError } = await supabase
      .from('notes')
      .select('id, is_public')
      .limit(1);

    const { error: embeddingsError } = await supabase
      .from('note_embeddings')
      .select('id, user_id')
      .limit(1);

    if (notesError || embeddingsError) {
      console.error('Schema verification failed:', { notesError, embeddingsError });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error initializing schema:', error);
    return false;
  }
}

// Note operations
export async function getNotes(): Promise<Note[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data.map(note => ({
    id: note.id,
    title: note.title,
    content: note.content,
    rawContent: note.raw_content || '',
    folderId: note.folder_id,
    isPublic: note.is_public,
    publicId: note.public_id,
    tags: [],
    backlinks: [],
    createdAt: new Date(note.created_at),
    updatedAt: new Date(note.updated_at),
  }));
}

export async function saveNote(note: Note) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('notes')
    .upsert({
      id: note.id,
      title: note.title,
      content: note.content,
      raw_content: note.rawContent,
      folder_id: note.folderId,
      is_public: note.isPublic,
      public_id: note.publicId,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}

export async function deleteNote(id: string) {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getPublicNote(publicId: string): Promise<Note | null> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('public_id', publicId)
    .eq('is_public', true)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    rawContent: data.raw_content || '',
    folderId: data.folder_id,
    isPublic: data.is_public,
    publicId: data.public_id,
    tags: [],
    backlinks: [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function generateShareLink(noteId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .rpc('generate_share_link', { note_id: noteId });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error generating share link:', error);
    return null;
  }
}

// Folder operations
export async function getFolders() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function saveFolder(folder: { id: string; name: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('folders')
    .upsert({
      id: folder.id,
      name: folder.name,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFolder(id: string) {
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateNoteFolder(noteId: string, folderId: string | null) {
  const { error } = await supabase
    .from('notes')
    .update({ folder_id: folderId })
    .eq('id', noteId);

  if (error) throw error;
}

// Embeddings operations
export async function saveEmbedding(noteId: string, embedding: number[], content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // First refresh schema cache
  await supabase.rpc('refresh_schema_cache');

  // Delete any existing embedding
  await supabase
    .from('note_embeddings')
    .delete()
    .match({ note_id: noteId });

  // Insert new embedding
  const { error } = await supabase
    .from('note_embeddings')
    .insert({
      note_id: noteId,
      user_id: user.id,
      embedding,
      content,
    });

  if (error) throw error;
}

export async function refreshUserEmbeddings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await supabase.rpc('refresh_user_embeddings', { p_user_id: user.id });
}