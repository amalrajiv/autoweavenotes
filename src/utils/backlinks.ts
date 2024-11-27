import { Note } from '../types/Note';

export const extractBacklinks = (content: string, notes: Note[], currentNoteId: string): string[] => {
  const linkRegex = /\[\[(.*?)\]\]/g;
  const matches = content.match(linkRegex) || [];
  
  return matches
    .map(match => match.slice(2, -2)) // Remove [[ and ]]
    .map(title => notes.find(note => note.title === title && note.id !== currentNoteId))
    .filter((note): note is Note => note !== undefined)
    .map(note => note.id);
};