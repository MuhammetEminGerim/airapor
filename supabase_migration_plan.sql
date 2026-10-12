-- =======================================================
-- Kullanıcı Plan ve Abonelik Kolonu Migration
-- =======================================================

alter table public.profiles
  add column if not exists plan text default 'free';

-- Plan türü için kontrol kısıtlaması (free, pro, enterprise)
alter table public.profiles
  drop constraint if exists profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'pro', 'enterprise'));
