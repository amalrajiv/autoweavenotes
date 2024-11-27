export interface Note {
  id: string;
  title: string;
  content: string;
  rawContent: string;
  folderId?: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  backlinks: string[];
  isPublic?: boolean;
  publicId?: string;
}