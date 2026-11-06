-- =====================================================================
--  parfumbilgisi.com — Supabase veritabanı kurulumu
--  Supabase > SQL Editor > New query > bu dosyanın TAMAMINI yapıştır > Run
--  Birden fazla çalıştırmak güvenlidir (veri silinmez).
-- =====================================================================

create extension if not exists pg_trgm  with schema extensions;
create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------
-- 1) Yardımcı fonksiyonlar
-- ---------------------------------------------------------------------

-- URL dostu ad: "Fransız Vanilyası" -> "fransiz-vanilyasi"
-- (Sitedeki lib/format.ts içindeki slugify ile BİREBİR aynı kurala sahip.)
create or replace function public.slugify(t text)
returns text
language sql
immutable
parallel safe
as $$
  select trim(both '-' from regexp_replace(
    lower(translate(coalesce(t, ''),
      'çÇğĞıöÖşŞüÜâÂîÎûÛéÉèÈêÊëËáÁàÀäÄãÃåÅíÍìÌïÏóÓòÒõÕôÔúÚùÙñÑýÝÿŸøØæÆœŒßİ',
      'cCgGioOsSuUaAiIuUeEeEeEeEaAaAaAaAaAiIiIiIoOoOoOoOuUuUnNyYyYoOaAoOsi')),
    '[^a-z0-9]+', '-', 'g'))
$$;

-- '["a","b"]' metnini diziye çevirir; bozuk veri gelirse boş dizi döner.
create or replace function public.j2a(t text)
returns text[]
language plpgsql
immutable
as $$
begin
  if t is null or btrim(t) in ('', '[]', 'null') then return '{}'; end if;
  return array(
    select btrim(x) from jsonb_array_elements_text(t::jsonb) as x where btrim(x) <> ''
  );
exception when others then
  return '{}';
end
$$;

-- Akor metnini ('[{"name":"Taze","value":100}]') güvenli şekilde jsonb'ye çevirir.
create or replace function public.j2j(t text)
returns jsonb
language plpgsql
immutable
as $$
declare j jsonb;
begin
  if t is null or btrim(t) in ('', '[]', 'null') then return '[]'; end if;
  j := t::jsonb;
  if jsonb_typeof(j) <> 'array' then return '[]'; end if;
  return j;
exception when others then
  return '[]';
end
$$;

-- ---------------------------------------------------------------------
-- 2) Ana tablo
-- ---------------------------------------------------------------------
create table if not exists public.perfumes (
  id              bigint generated always as identity primary key,
  slug            text not null unique,
  name            text not null,
  brand           text not null,
  brand_slug      text not null,
  gender          text check (gender in ('kadin', 'erkek', 'unisex')),
  year            smallint,
  perfumers       text[] not null default '{}',
  top_notes       text[] not null default '{}',
  heart_notes     text[] not null default '{}',
  base_notes      text[] not null default '{}',
  all_note_slugs  text[] not null default '{}',
  accords         jsonb  not null default '[]',
  family          text,
  family_slug     text,
  season          text,
  image           text,
  search_text     text not null,
  indexable       boolean not null default false,  -- Google'a gösterilecek kadar dolu mu?
  updated_at      timestamptz not null default now()
);

create index if not exists perfumes_brand_idx   on public.perfumes (brand_slug, indexable desc, name);
create index if not exists perfumes_family_idx  on public.perfumes (family_slug);
create index if not exists perfumes_notes_gin   on public.perfumes using gin (all_note_slugs);
create index if not exists perfumes_search_trgm on public.perfumes using gin (search_text extensions.gin_trgm_ops);
create index if not exists perfumes_sitemap_idx on public.perfumes (slug) where indexable;
create index if not exists perfumes_image_idx   on public.perfumes (brand_slug) where image is not null;

-- Yükleme için geçici tablo (CSV buraya gelir, sonra temizlenip ana tabloya aktarılır)
create table if not exists public.staging_perfumes (
  slug text, name text, brand text, gender text, release_year text, perfumers text,
  top_notes text, heart_notes text, base_notes text, accord_spectrum text,
  family text, season text, image text
);

-- ---------------------------------------------------------------------
-- 3) Marka / nota / aile listeleri (hızlı sayfalar için önceden hesaplanır)
-- ---------------------------------------------------------------------
drop materialized view if exists public.brands_mv;
create materialized view public.brands_mv as
  select brand_slug,
         min(brand) as brand,
         count(*)::int as perfume_count
  from public.perfumes
  group by brand_slug;
create unique index brands_mv_slug on public.brands_mv (brand_slug);
create index brands_mv_count on public.brands_mv (perfume_count desc);

drop materialized view if exists public.notes_mv;
create materialized view public.notes_mv as
  select public.slugify(n) as slug,
         mode() within group (order by n) as name,
         count(distinct p.id)::int as perfume_count
  from public.perfumes p,
       unnest(p.top_notes || p.heart_notes || p.base_notes) as n
  where public.slugify(n) <> ''
  group by 1;
create unique index notes_mv_slug on public.notes_mv (slug);
create index notes_mv_count on public.notes_mv (perfume_count desc);

drop materialized view if exists public.families_mv;
create materialized view public.families_mv as
  select family_slug as slug,
         min(family) as name,
         count(*)::int as perfume_count
  from public.perfumes
  where family_slug is not null and family_slug <> ''
  group by 1;
create unique index families_mv_slug on public.families_mv (slug);

-- ---------------------------------------------------------------------
-- 4) Yükleme fonksiyonu: geçici tablo -> ana tablo (tekrar çalıştırılabilir)
-- ---------------------------------------------------------------------
create or replace function public.yukle_staging()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare adet int;
begin
  insert into public.perfumes as p (
    slug, name, brand, brand_slug, gender, year, perfumers,
    top_notes, heart_notes, base_notes, all_note_slugs, accords,
    family, family_slug, season, image, search_text, indexable
  )
  select
    x.slug, x.name, x.brand,
    coalesce(nullif(public.slugify(x.brand), ''), 'marka-' || left(md5(x.brand), 8)),
    x.gender, x.year, x.perfumers,
    x.top, x.heart, x.base,
    array(select distinct public.slugify(n) from unnest(x.top || x.heart || x.base) n
          where public.slugify(n) <> ''),
    x.accords,
    x.family, nullif(public.slugify(x.family), ''),
    x.season, x.image,
    lower(extensions.unaccent(x.brand || ' ' || x.name)),
    (cardinality(x.top) + cardinality(x.heart) + cardinality(x.base) >= 3
      and jsonb_array_length(x.accords) > 0)
  from (
    select
      btrim(s.slug) as slug, btrim(s.name) as name, btrim(s.brand) as brand,
      case lower(btrim(coalesce(s.gender, '')))
        when 'kadın' then 'kadin' when 'kadin' then 'kadin'
        when 'erkek' then 'erkek'
        when 'uniseks' then 'unisex' when 'unisex' then 'unisex'
      end as gender,
      case when btrim(s.release_year) ~ '^\d{4}$' then btrim(s.release_year)::smallint end as year,
      public.j2a(s.perfumers)   as perfumers,
      public.j2a(s.top_notes)   as top,
      public.j2a(s.heart_notes) as heart,
      public.j2a(s.base_notes)  as base,
      public.j2j(s.accord_spectrum) as accords,
      nullif(btrim(s.family), '') as family,
      nullif(btrim(s.season), '') as season,
      nullif(btrim(s.image), '')  as image
    from public.staging_perfumes s
    where nullif(btrim(s.slug), '')  is not null
      and nullif(btrim(s.name), '')  is not null
      and nullif(btrim(s.brand), '') is not null
  ) x
  on conflict (slug) do update set
    name = excluded.name, brand = excluded.brand, brand_slug = excluded.brand_slug,
    gender = excluded.gender, year = excluded.year, perfumers = excluded.perfumers,
    top_notes = excluded.top_notes, heart_notes = excluded.heart_notes, base_notes = excluded.base_notes,
    all_note_slugs = excluded.all_note_slugs, accords = excluded.accords,
    family = excluded.family, family_slug = excluded.family_slug, season = excluded.season,
    image = excluded.image, search_text = excluded.search_text, indexable = excluded.indexable,
    updated_at = now();

  get diagnostics adet = row_count;
  truncate public.staging_perfumes;
  refresh materialized view public.brands_mv;
  refresh materialized view public.notes_mv;
  refresh materialized view public.families_mv;
  analyze public.perfumes;
  return adet || ' parfum yuklendi/guncellendi';
end
$$;

-- ---------------------------------------------------------------------
-- 5) Arama (yazım hatalarını da yakalar: "savage" -> "Sauvage")
-- ---------------------------------------------------------------------
create or replace function public.search_perfumes(
  q        text default null,
  p_gender text default null,
  p_limit  int  default 24,
  p_offset int  default 0
)
returns table (
  id bigint, slug text, name text, brand text, brand_slug text,
  year smallint, gender text, image text
)
language sql
stable
set search_path = public, extensions
as $$
  with term as (
    select lower(extensions.unaccent(left(btrim(coalesce(q, '')), 80))) as t
  )
  select p.id, p.slug, p.name, p.brand, p.brand_slug, p.year, p.gender, p.image
  from public.perfumes p, term
  where (term.t = '' or p.search_text % term.t or p.search_text like '%' || term.t || '%')
    and (p_gender is null or p.gender = p_gender)
  order by
    case when term.t = '' then 0 else extensions.similarity(p.search_text, term.t) end desc,
    p.indexable desc,
    p.name
  limit  least(greatest(p_limit, 1), 50)
  offset least(greatest(p_offset, 0), 1000);
$$;

-- ---------------------------------------------------------------------
-- 6) Görsel deposu (herkes görebilir, sadece sen yükleyebilirsin)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('parfum', 'parfum', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------
-- 7) GÜVENLİK: site yalnızca OKUYABİLİR, hiçbir şey yazamaz/silemez
-- ---------------------------------------------------------------------
alter table public.perfumes         enable row level security;
alter table public.staging_perfumes enable row level security;

drop policy if exists "herkes okuyabilir" on public.perfumes;
create policy "herkes okuyabilir" on public.perfumes for select to anon using (true);

grant usage on schema extensions to anon;  -- arama fonksiyonu icin (Supabase'de zaten acik)
revoke all on public.perfumes, public.staging_perfumes from anon, authenticated;
grant select on public.perfumes to anon;

revoke all on public.brands_mv, public.notes_mv, public.families_mv from anon, authenticated;
grant select on public.brands_mv, public.notes_mv, public.families_mv to anon;

revoke all on function public.yukle_staging() from public, anon, authenticated;
revoke all on function public.j2a(text)       from public, anon, authenticated;
revoke all on function public.j2j(text)       from public, anon, authenticated;
revoke all on function public.slugify(text)   from anon, authenticated;
revoke all on function public.search_perfumes(text, text, int, int) from public;
grant execute on function public.search_perfumes(text, text, int, int) to anon;

select 'Kurulum tamam' as durum;
