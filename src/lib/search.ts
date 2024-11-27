import { Note } from '@/types/Note';
import { createOpenAIClient } from './openai';

export async function getEmbedding(text: string, apiKey: string | null) {
  const openai = createOpenAIClient(apiKey);
  if (!openai) return null;

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    return null;
  }
}

export async function semanticSearch(query: string, notes: Note[], apiKey: string | null) {
  if (!apiKey) {
    return basicSearch(query, notes);
  }

  try {
    const queryEmbedding = await getEmbedding(query, apiKey);
    if (!queryEmbedding) {
      return basicSearch(query, notes);
    }
    
    // Generate embeddings for each note's content
    const noteEmbeddings = await Promise.all(
      notes.map(async (note) => {
        const content = `${note.title}\n${note.content}`;
        const embedding = await getEmbedding(content, apiKey);
        return { note, embedding };
      })
    );

    // Filter out notes where embedding failed
    const validEmbeddings = noteEmbeddings.filter(
      (item): item is { note: Note; embedding: number[] } => item.embedding !== null
    );

    if (validEmbeddings.length === 0) {
      return basicSearch(query, notes);
    }

    // Calculate cosine similarity
    const results = validEmbeddings.map(({ note, embedding }) => ({
      note,
      similarity: cosineSimilarity(queryEmbedding, embedding)
    }));

    // Sort by similarity and filter out low-relevance results
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .filter(result => result.similarity > 0.7)
      .map(result => result.note);
  } catch (error) {
    console.error('Semantic search error:', error);
    return basicSearch(query, notes);
  }
}

function basicSearch(query: string, notes: Note[]): Note[] {
  const searchTerm = query.toLowerCase();
  return notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm) ||
    note.content.toLowerCase().includes(searchTerm)
  );
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}