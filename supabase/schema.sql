-- Create documents table
create table documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  type text not null default 'PUD',
  linha text not null,
  status text not null default 'draft', -- 'draft', 'generating', 'completed'
  content jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table documents enable row level security;

-- Create policies
create policy "Users can view their own documents" on documents
  for select using (auth.uid() = user_id);

create policy "Users can insert their own documents" on documents
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own documents" on documents
  for update using (auth.uid() = user_id);

-- Create index on user_id for performance
create index documents_user_id_idx on documents (user_id);
