export interface Database {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string;
          title: string;
          content: string;
          raw_content: string | null;
          folder_id: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
          is_public: boolean;
          public_id: string | null;
        };
        Insert: {
          id: string;
          title: string;
          content: string;
          raw_content?: string | null;
          folder_id?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
          is_public?: boolean;
          public_id?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          raw_content?: string | null;
          folder_id?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
          is_public?: boolean;
          public_id?: string | null;
        };
      };
      note_embeddings: {
        Row: {
          id: string;
          note_id: string;
          user_id: string;
          embedding: number[];
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          note_id: string;
          user_id: string;
          embedding: number[];
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          note_id?: string;
          user_id?: string;
          embedding?: number[];
          content?: string;
          created_at?: string;
        };
      };
      // Other table definitions remain the same...
    };
    Functions: {
      refresh_schema_cache: {
        Args: Record<string, never>;
        Returns: void;
      };
      generate_share_link: {
        Args: { note_id: string };
        Returns: string;
      };
      match_notes: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_count: number;
          p_user_id: string;
        };
        Returns: Array<{
          id: string;
          content: string;
          similarity: number;
        }>;
      };
    };
  };
}