import { supabase } from './supabase';
import { createOpenAIClient } from './openai';
import type { Note } from '@/types/Note';

export async function processNote(note: Note, apiKey: string) {
  const openai = createOpenAIClient(apiKey);
  if (!openai) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate embedding for the note content
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: `${note.title}\n${note.content}`,
    });

    const embedding = response.data[0].embedding;

    // First, delete any existing embedding for this note
    await supabase
      .from('note_embeddings')
      .delete()
      .match({ note_id: note.id, user_id: user.id });

    // Then insert the new embedding
    const { error } = await supabase
      .from('note_embeddings')
      .insert({
        note_id: note.id,
        user_id: user.id,
        embedding,
        content: note.content,
      });

    if (error) {
      // If we get a schema cache error, try refreshing the cache and retry
      if (error.message.includes('schema cache')) {
        await supabase.rpc('refresh_schema_cache');
        // Retry the insert
        const { error: retryError } = await supabase
          .from('note_embeddings')
          .insert({
            note_id: note.id,
            user_id: user.id,
            embedding,
            content: note.content,
          });
        
        if (retryError) throw retryError;
      } else {
        throw error;
      }
    }

    return embedding;
  } catch (error) {
    console.error('Error processing note:', error);
    return null;
  }
}

export async function findSimilarNotes(query: string, apiKey: string, threshold = 0.7, limit = 5) {
  const openai = createOpenAIClient(apiKey);
  if (!openai) return [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate embedding for the query
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });

    const queryEmbedding = response.data[0].embedding;

    // Search for similar notes using the match_notes function
    const { data: similarNotes, error } = await supabase
      .rpc('match_notes', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
        p_user_id: user.id
      });

    if (error) throw error;
    return similarNotes;
  } catch (error) {
    console.error('Error finding similar notes:', error);
    return [];
  }
}

export async function chatWithSage(messages: any[], apiKey: string) {
  const openai = createOpenAIClient(apiKey);
  if (!openai) return null;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: `You are Sage, an AI assistant specialized in helping users organize and analyze their notes. Only provide responses based on the content of the user's notes. Do not answer questions or provide information that falls outside the context of these notes. If you are asked about something not included in the notes, politely inform the user that you can only assist with the information provided.

Format your responses using Markdown for better readability. Use headings, lists, and emphasis where appropriate.

When providing summaries or analysis:

- Use clear section headings
- Break down complex information into bullet points
- Use bold for key terms
- Include relevant quotes in blockquotes
- Organize related points under subheadings`
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return completion.choices[0].message;
  } catch (error) {
    console.error('Error chatting with Sage:', error);
    return null;
  }
}

export async function cleanupNote(note: Note, apiKey: string): Promise<Note> {
  const openai = createOpenAIClient(apiKey);
  if (!openai) return note;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert editor. Improve the given note while maintaining its core meaning. 
          - Fix grammar and spelling
          - Improve clarity and structure
          - Format with Markdown
          - Preserve all links and references
          - Keep the same general length
          - Maintain any [[wiki-style links]]`
        },
        {
          role: "user",
          content: `Please improve this note:\n\nTitle: ${note.title}\n\nContent:\n${note.content}`
        }
      ],
      temperature: 0.3,
    });

    const improvedContent = completion.choices[0].message.content;
    
    // Extract title and content from the improved version
    const titleMatch = improvedContent.match(/Title:\s*(.*?)\s*\n/);
    const contentMatch = improvedContent.match(/Content:\s*([\s\S]*)/);

    return {
      ...note,
      title: titleMatch?.[1] || note.title,
      content: (contentMatch?.[1] || improvedContent).trim(),
      rawContent: note.content, // Preserve original content
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error cleaning up note:', error);
    return note;
  }
}