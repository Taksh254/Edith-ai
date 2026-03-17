-- ============================================================
-- E.D.I.T.H. — Supabase Database Setup
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ══════════════════════════════════════════════
-- 1. PROFILES TABLE
-- ══════════════════════════════════════════════

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  created_at timestamptz default now()
);

-- Auto-create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: fires after each signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ══════════════════════════════════════════════
-- 2. CHATS TABLE
-- ══════════════════════════════════════════════

create table if not exists public.chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default 'New Chat',
  created_at timestamptz default now()
);


-- ══════════════════════════════════════════════
-- 3. MESSAGES TABLE
-- ══════════════════════════════════════════════

create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references public.chats(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);


-- ══════════════════════════════════════════════
-- 4. ENABLE ROW LEVEL SECURITY
-- ══════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;


-- ══════════════════════════════════════════════
-- 5. RLS POLICIES — PROFILES
-- ══════════════════════════════════════════════

-- Users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- ══════════════════════════════════════════════
-- 6. RLS POLICIES — CHATS
-- ══════════════════════════════════════════════

-- Users can view their own chats
create policy "Users can view own chats"
  on public.chats for select
  using (auth.uid() = user_id);

-- Users can create their own chats
create policy "Users can create own chats"
  on public.chats for insert
  with check (auth.uid() = user_id);

-- Users can update their own chats (e.g. rename)
create policy "Users can update own chats"
  on public.chats for update
  using (auth.uid() = user_id);

-- Users can delete their own chats
create policy "Users can delete own chats"
  on public.chats for delete
  using (auth.uid() = user_id);


-- ══════════════════════════════════════════════
-- 7. RLS POLICIES — MESSAGES
-- ══════════════════════════════════════════════

-- Users can view messages in their own chats
create policy "Users can view own messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
        and chats.user_id = auth.uid()
    )
  );

-- Users can insert messages into their own chats
create policy "Users can insert own messages"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
        and chats.user_id = auth.uid()
    )
  );

-- Users can delete messages in their own chats
create policy "Users can delete own messages"
  on public.messages for delete
  using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
        and chats.user_id = auth.uid()
    )
  );


-- ══════════════════════════════════════════════
-- 8. INDEXES FOR PERFORMANCE
-- ══════════════════════════════════════════════

create index if not exists idx_chats_user_id on public.chats(user_id);
create index if not exists idx_chats_created_at on public.chats(created_at desc);
create index if not exists idx_messages_chat_id on public.chats(id);
create index if not exists idx_messages_created_at on public.messages(created_at asc);


-- ✅ DONE! Your tables, RLS, and policies are ready.
