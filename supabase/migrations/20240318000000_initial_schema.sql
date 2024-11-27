-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Create users table
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create folders table
create table if not exists public.folders (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create notes table
create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  raw_content text,
  user_id uuid references auth.users(id) on delete cascade not null,
  folder_id uuid references public.folders(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create backlinks table
create table if not exists public.backlinks (
  id uuid primary key default uuid_generate_v4(),
  source_note_id uuid references public.notes(id) on delete cascade not null,
  target_note_id uuid references public.notes(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(source_note_id, target_note_id)
);

-- Create tags table
create table if not exists public.tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create note_tags junction table
create table if not exists public.note_tags (
  note_id uuid references public.notes(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  primary key (note_id, tag_id)
);

-- Create note_embeddings table for vector search
create table if not exists public.note_embeddings (
  id uuid primary key default uuid_generate_v4(),
  note_id uuid references public.notes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  embedding vector(1536) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index if not exists note_embeddings_embedding_idx on note_embeddings 
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

-- Create RLS policies for folders
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

-- Create RLS policies for backlinks
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

-- Create RLS policies for tags
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

-- Create RLS policies for note_tags
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

-- Create RLS policies for note_embeddings
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

-- Create function for vector similarity search
create or replace function match_notes(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
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
    and note_embeddings.user_id = p_user_id
  order by note_embeddings.embedding <=> query_embedding
  limit match_count;
$$;

-- Create trigger function for updating timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create triggers for updating timestamps
create trigger update_notes_updated_at
    before update on notes
    for each row
    execute procedure update_updated_at_column();

create trigger update_folders_updated_at
    before update on folders
    for each row
    execute procedure update_updated_at_column();

-- Create storage bucket for note attachments
insert into storage.buckets (id, name)
values ('note-attachments', 'note-attachments')
on conflict (id) do nothing;

-- Create storage policies
create policy "Users can upload their own attachments"
  on storage.objects for insert
  with check (bucket_id = 'note-attachments' and auth.uid() = owner);

create policy "Users can view their own attachments"
  on storage.objects for select
  using (bucket_id = 'note-attachments' and auth.uid() = owner);