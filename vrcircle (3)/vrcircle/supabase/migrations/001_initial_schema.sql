-- VRCircle Database Schema
-- Run this in the Supabase SQL Editor

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- =====================
-- PROFILES
-- =====================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint username_length check (char_length(username) >= 3 and char_length(username) <= 24)
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username', 'New User')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================
-- SERVERS
-- =====================
create table public.servers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text default '',
  game text not null,
  icon text default '🎮',
  owner_id uuid references public.profiles(id) on delete cascade not null,
  member_count integer default 1 not null,
  is_public boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint name_length check (char_length(name) >= 2 and char_length(name) <= 40)
);

create index servers_public_idx on public.servers (is_public) where is_public = true;
create index servers_game_idx on public.servers (game);

-- =====================
-- MEMBERSHIPS
-- =====================
create table public.server_members (
  id uuid default uuid_generate_v4() primary key,
  server_id uuid references public.servers(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' not null check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz default now() not null,
  unique (server_id, user_id)
);

create index server_members_user_idx on public.server_members (user_id);
create index server_members_server_idx on public.server_members (server_id);

-- =====================
-- CHANNELS
-- =====================
create table public.channels (
  id uuid default uuid_generate_v4() primary key,
  server_id uuid references public.servers(id) on delete cascade not null,
  name text not null,
  type text default 'text' not null check (type in ('text', 'voice')),
  position integer default 0 not null,
  created_at timestamptz default now() not null,
  unique (server_id, name)
);

-- =====================
-- MESSAGES
-- =====================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  channel_id uuid references public.channels(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamptz default now() not null,
  constraint content_length check (char_length(content) >= 1 and char_length(content) <= 1000)
);

create index messages_channel_created_idx on public.messages (channel_id, created_at desc);

-- =====================
-- HELPER FUNCTIONS
-- =====================

-- Increment / decrement member count safely
create or replace function public.update_member_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (TG_OP = 'INSERT') then
    update public.servers
    set member_count = member_count + 1,
        updated_at = now()
    where id = NEW.server_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update public.servers
    set member_count = greatest(member_count - 1, 0),
        updated_at = now()
    where id = OLD.server_id;
    return OLD;
  end if;
  return null;
end;
$$;

create trigger on_member_change
  after insert or delete on public.server_members
  for each row execute procedure public.update_member_count();

-- Auto-create default channels when a server is created
create or replace function public.create_default_channels()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.channels (server_id, name, type, position) values
    (NEW.id, 'general', 'text', 0),
    (NEW.id, 'looking-for-group', 'text', 1),
    (NEW.id, 'clips-and-screenshots', 'text', 2);

  -- Add owner as member
  insert into public.server_members (server_id, user_id, role)
  values (NEW.id, NEW.owner_id, 'owner');

  return NEW;
end;
$$;

create trigger on_server_created
  after insert on public.servers
  for each row execute procedure public.create_default_channels();

-- =====================
-- ROW LEVEL SECURITY
-- =====================
alter table public.profiles enable row level security;
alter table public.servers enable row level security;
alter table public.server_members enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;

-- PROFILES policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- SERVERS policies
create policy "Public servers are viewable by everyone"
  on public.servers for select using (is_public = true or exists (
    select 1 from public.server_members
    where server_id = servers.id and user_id = auth.uid()
  ));

create policy "Authenticated users can create servers"
  on public.servers for insert with check (auth.uid() = owner_id);

create policy "Owners can update their servers"
  on public.servers for update using (auth.uid() = owner_id);

create policy "Owners can delete their servers"
  on public.servers for delete using (auth.uid() = owner_id);

-- MEMBERSHIPS policies
create policy "Members can view memberships of servers they belong to"
  on public.server_members for select using (
    exists (
      select 1 from public.server_members sm
      where sm.server_id = server_members.server_id and sm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.servers s
      where s.id = server_members.server_id and s.is_public = true
    )
  );

create policy "Authenticated users can join public servers"
  on public.server_members for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.servers s
      where s.id = server_id and s.is_public = true
    )
  );

create policy "Users can leave servers (except force-remove by owner)"
  on public.server_members for delete using (auth.uid() = user_id);

-- CHANNELS policies
create policy "Members can view channels"
  on public.channels for select using (
    exists (
      select 1 from public.server_members
      where server_id = channels.server_id and user_id = auth.uid()
    )
  );

create policy "Owners can manage channels"
  on public.channels for all using (
    exists (
      select 1 from public.servers
      where id = channels.server_id and owner_id = auth.uid()
    )
  );

-- MESSAGES policies
create policy "Members can view messages"
  on public.messages for select using (
    exists (
      select 1 from public.channels c
      join public.server_members sm on sm.server_id = c.server_id
      where c.id = messages.channel_id and sm.user_id = auth.uid()
    )
  );

create policy "Members can send messages"
  on public.messages for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.channels c
      join public.server_members sm on sm.server_id = c.server_id
      where c.id = messages.channel_id and sm.user_id = auth.uid()
    )
  );

-- Enable realtime for messages
alter publication supabase_realtime add table public.messages;
