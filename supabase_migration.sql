-- 1. Create templates table
create table if not exists public.templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  icon text default '🤖',
  system_prompt text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS on templates
alter table public.templates enable row level security;

-- 3. Create policies for templates
create policy "Users can view their own templates"
  on public.templates for select
  using (auth.uid() = user_id);

create policy "Users can insert their own templates"
  on public.templates for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own templates"
  on public.templates for update
  using (auth.uid() = user_id);

create policy "Users can delete their own templates"
  on public.templates for delete
  using (auth.uid() = user_id);

-- 4. Update reports table for sharing
alter table public.reports add column if not exists share_token uuid default gen_random_uuid();
alter table public.reports add column if not exists is_public boolean default false;

-- 5. Add index for share_token
create index if not exists reports_share_token_idx on public.reports(share_token);

-- 6. Add RLS policy for public reports (Allowing anyone to read if public)
create policy "Public reports are viewable by everyone"
  on public.reports for select
  to anon, authenticated
  using (is_public = true);
