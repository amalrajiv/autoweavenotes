import { v4 as uuidv4 } from 'uuid';
import { Note } from '../types/Note';

export const createNewNote = (): Note => ({
  id: uuidv4(),
  title: 'Untitled Note',
  content: '',
  rawContent: '',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  backlinks: [],
});