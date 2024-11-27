# Supabase Setup Guide

## 1. Project Setup

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Enter project details:
   - Name: `ai-note-taking-app`
   - Database Password: (generate a strong password)
   - Region: (choose closest to your users)
   - Pricing Plan: Free tier

## 2. Database Schema

Execute these SQL commands in the Supabase SQL Editor:

```sql
-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Create tables
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.folders (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.notes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  raw_content text,
  user_id uuid references auth.users(id) on delete cascade not null,
  folder_id uuid references public.folders(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.backlinks (
  id uuid primary key default uuid_generate_v4(),
  source_note_id uuid references public.notes(id) on delete cascade not null,
  target_note_id uuid references public.notes(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(source_note_id, target_note_id)
);

create table public.tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.note_tags (
  note_id uuid references public.notes(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  primary key (note_id, tag_id)
);

-- Create embeddings table for vector search
create table public.note_embeddings (
  id uuid primary key default uuid_generate_v4(),
  note_id uuid references public.notes(id) on delete cascade not null,
  embedding vector(1536) not null, -- OpenAI embeddings are 1536 dimensions
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index note_embeddings_embedding_idx on note_embeddings 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Enable Row Level Security (RLS)
alter table public.notes enable row level security;
alter table public.folders enable row level security;
alter table public.backlinks enable row level security;
alter table public.tags enable row level security;
alter table public.note_tags enable row level security;
alter table public.note_embeddings enable row level security;

-- Create RLS policies
create policy "Users can only see their own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on public.notes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- Similar policies for folders
create policy "Users can only see their own folders"
  on public.folders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own folders"
  on public.folders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own folders"
  on public.folders for update
  using (auth.uid() = user_id);

create policy "Users can delete their own folders"
  on public.folders for delete
  using (auth.uid() = user_id);

-- Policies for backlinks
create policy "Users can see backlinks for their notes"
  on public.backlinks for select
  using (exists (
    select 1 from public.notes
    where notes.id = backlinks.source_note_id
    and notes.user_id = auth.uid()
  ));

create policy "Users can create backlinks"
  on public.backlinks for insert
  with check (exists (
    select 1 from public.notes
    where notes.id = source_note_id
    and notes.user_id = auth.uid()
  ));

create policy "Users can delete backlinks"
  on public.backlinks for delete
  using (exists (
    select 1 from public.notes
    where notes.id = source_note_id
    and notes.user_id = auth.uid()
  ));

-- Policies for tags
create policy "Users can only see their own tags"
  on public.tags for select
  using (auth.uid() = user_id);

create policy "Users can create tags"
  on public.tags for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tags"
  on public.tags for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tags"
  on public.tags for delete
  using (auth.uid() = user_id);

-- Policies for note_tags
create policy "Users can see note tags for their notes"
  on public.note_tags for select
  using (exists (
    select 1 from public.notes
    where notes.id = note_id
    and notes.user_id = auth.uid()
  ));

create policy "Users can create note tags"
  on public.note_tags for insert
  with check (exists (
    select 1 from public.notes
    where notes.id = note_id
    and notes.user_id = auth.uid()
  ));

create policy "Users can delete note tags"
  on public.note_tags for delete
  using (exists (
    select 1 from public.notes
    where notes.id = note_id
    and notes.user_id = auth.uid()
  ));

-- Policies for note_embeddings
create policy "Users can only see their own note embeddings"
  on public.note_embeddings for select
  using (exists (
    select 1 from public.notes
    where notes.id = note_embeddings.note_id
    and notes.user_id = auth.uid()
  ));

create policy "Users can create note embeddings"
  on public.note_embeddings for insert
  with check (exists (
    select 1 from public.notes
    where notes.id = note_id
    and notes.user_id = auth.uid()
  ));

create policy "Users can update note embeddings"
  on public.note_embeddings for update
  using (exists (
    select 1 from public.notes
    where notes.id = note_id
    and notes.user_id = auth.uid()
  ));

create policy "Users can delete note embeddings"
  on public.note_embeddings for delete
  using (exists (
    select 1 from public.notes
    where notes.id = note_id
    and notes.user_id = auth.uid()
  ));

-- Functions for vector similarity search
create or replace function match_notes(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select
    note_embeddings.note_id as id,
    note_embeddings.content,
    1 - (note_embeddings.embedding <=> query_embedding) as similarity
  from note_embeddings
  where 1 - (note_embeddings.embedding <=> query_embedding) > match_threshold
  order by note_embeddings.embedding <=> query_embedding
  limit match_count;
$$;

-- Create triggers for updating timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_notes_updated_at
    before update on notes
    for each row
    execute procedure update_updated_at_column();

create trigger update_folders_updated_at
    before update on folders
    for each row
    execute procedure update_updated_at_column();
```

## 3. Edge Functions Setup

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Initialize Supabase:
```bash
supabase init
```

3. Create Edge Functions:

```bash
supabase functions new process-note
supabase functions new chat
```

4. Deploy Functions:
```bash
supabase functions deploy process-note --project-ref your-project-ref
supabase functions deploy chat --project-ref your-project-ref
```

## 4. Environment Variables

Set these environment variables in your Supabase project dashboard:

1. Go to Project Settings > API
2. Add the following secrets:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PINECONE_API_KEY`: Your Pinecone API key
   - `PINECONE_ENVIRONMENT`: Your Pinecone environment

## 5. Authentication Setup

1. Go to Authentication > Providers
2. Enable Email auth
3. (Optional) Configure OAuth providers:
   - GitHub
   - Google
   - Microsoft

## 6. Storage Setup

1. Create a new bucket for note attachments:
```sql
insert into storage.buckets (id, name)
values ('note-attachments', 'note-attachments');
```

2. Set up storage policies:
```sql
create policy "Users can upload their own attachments"
  on storage.objects for insert
  with check (bucket_id = 'note-attachments' and auth.uid() = owner);

create policy "Users can view their own attachments"
  on storage.objects for select
  using (bucket_id = 'note-attachments' and auth.uid() = owner);
```

## 7. API Keys and Configuration

1. Get your API keys from Supabase dashboard:
   - Project URL
   - Project API Key (anon, public)
   - Service Role Key (for admin tasks)

2. Update your `.env` file:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_OPENAI_API_KEY=your_openai_key
```

## 8. Real-time Subscriptions

Enable real-time for required tables:

1. Go to Database > Replication
2. Enable real-time for:
   - notes
   - folders
   - backlinks
   - tags

## 9. Monitoring Setup

1. Enable Database Webhooks for important events
2. Set up Logflare integration for monitoring
3. Configure performance alerts

## 10. Backup Configuration

1. Enable Point-in-Time Recovery
2. Schedule regular backups
3. Set up backup retention policies

## Security Considerations

1. Always use RLS policies
2. Never expose service role key
3. Use prepared statements
4. Implement rate limiting
5. Set up CORS properly
6. Use secure websocket connections
7. Implement proper error handling

## Production Checklist

1. SSL/TLS configuration
2. Database connection pooling
3. Caching strategy
4. Rate limiting
5. Error tracking
6. Performance monitoring
7. Backup strategy
8. Disaster recovery plan