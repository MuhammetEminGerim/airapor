-- Add an expiry field for shared report links.
alter table public.reports
  add column if not exists share_expires_at timestamp with time zone;

-- Backfill active public links so they don't stay permanently valid.
update public.reports
set share_expires_at = timezone('utc'::text, now()) + interval '7 days'
where is_public = true
  and share_expires_at is null;

-- Speed up token + expiry lookups for public report route.
create index if not exists reports_public_share_expiry_idx
  on public.reports (share_token, share_expires_at)
  where is_public = true;

-- Ensure RLS only allows non-expired public links to be read anonymously.
do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reports'
      and policyname = 'Public reports are viewable by everyone'
  ) then
    alter policy "Public reports are viewable by everyone"
      on public.reports
      using (
        is_public = true
        and share_expires_at is not null
        and share_expires_at > now()
      );
  else
    create policy "Public reports are viewable by everyone"
      on public.reports for select
      to anon, authenticated
      using (
        is_public = true
        and share_expires_at is not null
        and share_expires_at > now()
      );
  end if;
end
$$;
