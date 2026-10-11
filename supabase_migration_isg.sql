-- =======================================================
-- ISG (İş Sağlığı ve Güvenliği) Saha Denetim Modeli Migration
-- =======================================================

-- 1. Profiles tablosuna kurumsal ve uzman bilgileri kolonları
alter table public.profiles
  add column if not exists company_name text,
  add column if not exists company_logo_url text,
  add column if not exists osgb_name text,
  add column if not exists osgb_logo_url text,
  add column if not exists inspector_title text default 'İş Güvenliği Uzmanı',
  add column if not exists certificate_no text;

-- 2. Reports tablosuna yapılandırılmış İSG verisi ve rapor numarası
alter table public.reports
  add column if not exists isg_data jsonb,
  add column if not exists report_number text;

-- 3. Rapor numarası ve hızlı arama için index
create index if not exists reports_report_number_idx
  on public.reports (report_number);

-- 4. İSG Raporları için GIN index (JSONB içi sorgulama performansı)
create index if not exists reports_isg_data_gin_idx
  on public.reports using gin (isg_data);

-- 5. Saha fotoğrafları için Supabase Storage Bucket yapılandırması
insert into storage.buckets (id, name, public)
values ('isg-photos', 'isg-photos', true)
on conflict (id) do nothing;

-- 6. Storage Bucket Güvenlik Politikaları (RLS)
-- Authenticated kullanıcılar kendi fotoğraflarını yükleyebilir
create policy "Authenticated users can upload inspection photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'isg-photos');

-- Herkes (paylaşılan raporlar dahil) fotoğrafları görüntüleyebilir
create policy "Public inspection photos are viewable"
  on storage.objects for select
  to public
  using (bucket_id = 'isg-photos');

-- Kullanıcılar kendi yükledikleri fotoğrafları silebilir
create policy "Users can delete their own inspection photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'isg-photos' and auth.uid() = owner);
