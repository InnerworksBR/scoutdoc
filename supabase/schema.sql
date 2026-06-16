-- ============================================================
-- ScoutDoc.AI — Schema Completo
-- ============================================================

-- ============================================================
-- 1. TABELA DE DOCUMENTOS (existente)
-- ============================================================
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  type text not null default 'PUD',
  linha text not null,
  status text not null default 'draft', -- 'draft', 'generating', 'completed'
  content jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table documents enable row level security;

create policy "Users can view their own documents" on documents
  for select using (auth.uid() = user_id);

create policy "Users can insert their own documents" on documents
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own documents" on documents
  for update using (auth.uid() = user_id);

create policy "Users can delete their own documents" on documents
  for delete using (auth.uid() = user_id);

create index if not exists documents_user_id_idx on documents (user_id);

-- ============================================================
-- 2. PERFIS DE USUÁRIO (roles)
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles enable row level security;

-- Usuário vê/edita apenas seu próprio perfil
create policy "profiles_self_select" on profiles
  for select using (auth.uid() = id);

create policy "profiles_self_update" on profiles
  for update using (auth.uid() = id);

-- Admin pode ler todos os perfis
create policy "profiles_admin_all" on profiles
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Trigger: criar profile automaticamente ao criar usuário
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 3. AGENTES DE CONVERSA
-- ============================================================
create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  system_prompt text not null,
  avatar_color text default 'linear-gradient(135deg, #38a169, #3b82f6)',
  is_active boolean default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table agents enable row level security;

-- Usuários autenticados podem ler agentes ativos
create policy "agents_read_active" on agents
  for select using (auth.role() = 'authenticated' and is_active = true);

-- Admin pode fazer tudo com agentes
create policy "agents_admin_all" on agents
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- 4. DOCUMENTOS DE CONSULTA DOS AGENTES
-- ============================================================
create table if not exists agent_documents (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id) on delete cascade not null,
  name text not null,
  file_path text,        -- path no Supabase Storage
  content_text text,     -- texto extraído/conteúdo do arquivo
  file_type text,        -- 'pdf' | 'txt' | 'text'
  file_size bigint,      -- tamanho em bytes
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table agent_documents enable row level security;

-- Usuários autenticados podem ler documentos
create policy "agent_docs_read" on agent_documents
  for select using (auth.role() = 'authenticated');

-- Admin pode fazer tudo
create policy "agent_docs_admin_all" on agent_documents
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create index if not exists agent_documents_agent_id_idx on agent_documents (agent_id);

-- ============================================================
-- 5. CONVERSAS
-- ============================================================
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete cascade not null,
  title text default 'Nova conversa',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table conversations enable row level security;

-- Usuário vê apenas suas próprias conversas
create policy "conversations_self" on conversations
  for all using (auth.uid() = user_id);

create index if not exists conversations_user_id_idx on conversations (user_id);
create index if not exists conversations_agent_id_idx on conversations (agent_id);

-- ============================================================
-- 6. MENSAGENS
-- ============================================================
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table messages enable row level security;

-- Usuário acessa mensagens apenas das suas conversas
create policy "messages_self" on messages
  for all using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create index if not exists messages_conversation_id_idx on messages (conversation_id);

-- ============================================================
-- 7. MIGRAÇÃO 001 — Sugestões e Boas-vindas por Agente
-- ============================================================
alter table agents
  add column if not exists welcome_message text,
  add column if not exists suggestions jsonb not null default '[]'::jsonb;

-- ============================================================
-- 8. MIGRAÇÃO 004 — Documentos Estruturados Configuráveis
-- ============================================================
alter table agents
  add column if not exists produces_document boolean not null default false,
  add column if not exists document_template jsonb,
  add column if not exists document_title text;
