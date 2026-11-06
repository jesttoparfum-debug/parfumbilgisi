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

-- Cinsiyet bilgisinin kaynağı: 'veri' (orijinal) veya 'isim' (isimden kesin kuralla çıkarıldı)
alter table public.perfumes add column if not exists gender_kaynak text;

create index if not exists perfumes_brand_idx   on public.perfumes (brand_slug, indexable desc, name);
create index if not exists perfumes_family_idx  on public.perfumes (family_slug);
create index if not exists perfumes_notes_gin   on public.perfumes using gin (all_note_slugs);
create index if not exists perfumes_search_trgm on public.perfumes using gin (search_text extensions.gin_trgm_ops);
create index if not exists perfumes_search_prefix on public.perfumes (search_text text_pattern_ops);
create index if not exists perfumes_sitemap_idx on public.perfumes (slug) where indexable;
create index if not exists perfumes_image_idx   on public.perfumes (brand_slug) where image is not null;

-- Zenginleştirme için geçici tablo (yıl/parfümör; sadece BOŞ alanları doldurur)
create table if not exists public.staging_enrich (
  slug text, year text, perfumers text, concentration text
);

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
-- İsimde KESİN ifade geçen ve cinsiyeti boş parfümleri tamamlar.
-- ("Pour Homme", "For Her", "Femme", "Uomo"...). Hem kadın hem erkek ifadesi varsa dokunmaz.
create or replace function public.cinsiyet_tamamla()
returns int
language plpgsql
security definer
set search_path = public, extensions
as $$
declare adet int;
begin
  with ad as (
    select id, lower(extensions.unaccent(name)) as n
    from public.perfumes
    where gender is null
  ), karar as (
    select id,
      n ~ '\m(pour femme|for her|for women|femme|femmes|woman|women|donna|mujer|lady|ladies|girl|girls|pour elle|feminine|feminin|femenina|femenino|feminino)\M' as k,
      n ~ '\m(pour homme|for him|for men|homme|hommes|man|men|uomo|hombre|masculin|masculine|masculino|gentleman|gentlemen|pour lui|caballero)\M' as e
    from ad
  )
  update public.perfumes p
     set gender = case when k.k then 'kadin' else 'erkek' end,
         gender_kaynak = 'isim'
    from karar k
   where p.id = k.id and (k.k <> k.e);
  get diagnostics adet = row_count;
  return adet;
end
$$;

create or replace function public.zenginlestir_uygula()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare adet int;
begin
  update public.perfumes p
     set year = coalesce(p.year,
                  case when btrim(e.year) ~ '^\d{4}$' then btrim(e.year)::smallint end),
         perfumers = case when cardinality(p.perfumers) = 0 then public.j2a(e.perfumers)
                          else p.perfumers end,
         updated_at = now()
    from public.staging_enrich e
   where e.slug = p.slug
     and ((p.year is null and btrim(e.year) ~ '^\d{4}$')
       or (cardinality(p.perfumers) = 0 and cardinality(public.j2a(e.perfumers)) > 0));
  get diagnostics adet = row_count;
  truncate public.staging_enrich;
  return adet || ' parfum zenginlestirildi';
end
$$;

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
    family, family_slug, season, image, search_text, indexable, gender_kaynak
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
      and jsonb_array_length(x.accords) > 0),
    case when x.gender is not null then 'veri' end
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
    gender = excluded.gender,
    year = coalesce(excluded.year, p.year),
    perfumers = case when cardinality(excluded.perfumers) > 0 then excluded.perfumers else p.perfumers end,
    top_notes = excluded.top_notes, heart_notes = excluded.heart_notes, base_notes = excluded.base_notes,
    all_note_slugs = excluded.all_note_slugs, accords = excluded.accords,
    family = excluded.family, family_slug = excluded.family_slug, season = excluded.season,
    image = excluded.image, search_text = excluded.search_text, indexable = excluded.indexable,
    gender_kaynak = excluded.gender_kaynak,
    updated_at = now();

  get diagnostics adet = row_count;
  truncate public.staging_perfumes;
  perform public.cinsiyet_tamamla();
  refresh materialized view public.brands_mv;
  refresh materialized view public.notes_mv;
  refresh materialized view public.families_mv;
  refresh materialized view public.note_rank_mv;
  analyze public.perfumes;
  return adet || ' parfum yuklendi/guncellendi';
end
$$;

-- ---------------------------------------------------------------------
-- 5) Arama (yazım hatalarını da yakalar: "savage" -> "Sauvage")
-- ---------------------------------------------------------------------
drop function if exists public.search_perfumes(text, text, int, int);
create function public.search_perfumes(
  q        text default null,
  p_gender text default null,
  p_limit  int  default 24,
  p_offset int  default 0
)
returns table (
  id bigint, slug text, name text, brand text, brand_slug text,
  year smallint, gender text, image text, family text
)
language plpgsql
stable
set search_path = public, extensions
as $$
declare
  t   text := lower(extensions.unaccent(left(btrim(coalesce(q, '')), 80)));
  lim int  := least(greatest(p_limit, 1), 50);
  off int  := least(greatest(p_offset, 0), 1000);
  n   int;
begin
  -- Her sorgu index kullanır ve en fazla 2000 aday üzerinde sıralar (veri büyüse de hızlı).
  if t = '' then
    return query
      select p.id, p.slug, p.name, p.brand, p.brand_slug, p.year, p.gender, p.image, p.family
      from public.perfumes p
      where p.indexable and (p_gender is null or p.gender = p_gender)
      order by p.id
      limit lim offset off;
    return;
  end if;

  if length(t) < 3 then
    -- 1-2 harf: baş harf eşleşmesi (b-tree index sırasıyla)
    return query
      select p.id, p.slug, p.name, p.brand, p.brand_slug, p.year, p.gender, p.image, p.family
      from public.perfumes p
      where p.search_text like t || '%' and (p_gender is null or p.gender = p_gender)
      order by p.search_text
      limit lim offset off;
    return;
  end if;

  -- 1) İçinde geçenler ("kirke", "dior", "pour homme")
  return query
    select c.id, c.slug, c.name, c.brand, c.brand_slug, c.year, c.gender, c.image, c.family
    from (
      select p.*
      from public.perfumes p
      where p.search_text like '%' || t || '%' and (p_gender is null or p.gender = p_gender)
      limit 2000
    ) c
    order by (c.search_text like t || '%' or c.search_text like '% ' || t || '%') desc,
             c.indexable desc,
             extensions.similarity(c.search_text, t) desc,
             c.name
    limit lim offset off;
  get diagnostics n = row_count;
  if n > 0 or off > 0 then return; end if;

  -- 2) Hiç yoksa yazım hatası toleranslı benzerlik ("savage" -> "sauvage")
  return query
    select c.id, c.slug, c.name, c.brand, c.brand_slug, c.year, c.gender, c.image, c.family
    from (
      select p.*
      from public.perfumes p
      where p.search_text % t and (p_gender is null or p.gender = p_gender)
      limit 2000
    ) c
    order by extensions.similarity(c.search_text, t) desc, c.indexable desc
    limit lim;
end
$$;

-- ---------------------------------------------------------------------
-- 5b) Nota sayfası: o notanın EN BASKIN olduğu parfümler önce.
--     Puanlar yüklemede bir kez hesaplanır; sayfa sadece hazır listeyi okur.
-- ---------------------------------------------------------------------
begin;
set local statement_timeout = 0;  -- bu liste büyük, hesaplanması 1-2 dakika sürebilir
drop materialized view if exists public.note_rank_mv;
create materialized view public.note_rank_mv as
  select ns.slug as note_slug,
         p.id    as perfume_id,
         (
           -- 1) Aynı isimli akorun gücü (0-100) — en güçlü sinyal
           coalesce((select max((a->>'value')::numeric)
                     from jsonb_array_elements(p.accords) a
                     where public.slugify(a->>'name') = ns.slug
                        or ns.slug like public.slugify(a->>'name') || '-%'
                        or ns.slug like '%-' || public.slugify(a->>'name')), 0)
           -- 2) Kaç katmanda geçiyor (her katman +12)
           + 12 * ( (exists (select 1 from unnest(p.top_notes)   n where public.slugify(n) = ns.slug))::int
                  + (exists (select 1 from unnest(p.heart_notes) n where public.slugify(n) = ns.slug))::int
                  + (exists (select 1 from unnest(p.base_notes)  n where public.slugify(n) = ns.slug))::int )
           -- 3) Az notalı parfümde nota daha belirgin
           + 120.0 / greatest(cardinality(p.all_note_slugs), 1)
           -- 4) Dolu ve görselli kayıtlar biraz önde
           + case when p.indexable then 8 else 0 end
           + case when p.image is not null then 5 else 0 end
         )::smallint as score
  from public.perfumes p
  cross join lateral unnest(p.all_note_slugs) as ns(slug);
create        index note_rank_ord on public.note_rank_mv (note_slug, score desc, perfume_id);
commit;

drop function if exists public.note_perfumes(text, int, int);
create function public.note_perfumes(
  p_slug   text,
  p_limit  int default 24,
  p_offset int default 0
)
returns table (
  id bigint, slug text, name text, brand text, brand_slug text,
  year smallint, gender text, image text, family text
)
language sql
stable
set search_path = public, extensions
as $$
  select p.id, p.slug, p.name, p.brand, p.brand_slug, p.year, p.gender, p.image, p.family
  from public.note_rank_mv r
  join public.perfumes p on p.id = r.perfume_id
  where r.note_slug = p_slug
  order by r.score desc, r.perfume_id
  limit  least(greatest(p_limit, 1), 50)
  offset least(greatest(p_offset, 0), 10000);
$$;

-- ---------------------------------------------------------------------
-- 5c) Ana sayfa vitrini: büyük markalardan, her markadan 1 görselli parfüm
-- ---------------------------------------------------------------------
drop function if exists public.showcase(int);
create function public.showcase(p_limit int default 12)
returns table (
  id bigint, slug text, name text, brand text, brand_slug text,
  year smallint, gender text, image text, family text
)
language sql
volatile
set search_path = public, extensions
as $$
  select x.id, x.slug, x.name, x.brand, x.brand_slug, x.year, x.gender, x.image, x.family
  from (
    select distinct on (p.brand_slug) p.*
    from public.perfumes p
    join (select brand_slug from public.brands_mv order by perfume_count desc limit 80) b
      on b.brand_slug = p.brand_slug
    where p.image is not null and p.indexable
    order by p.brand_slug, random()
  ) x
  order by random()
  limit least(greatest(p_limit, 1), 24);
$$;

-- ---------------------------------------------------------------------
-- 5d) Koku Bulucu: istenen/istenmeyen notalar + cinsiyet, aile, mevsim
--     İstenen nota varsa en nadir olanı üzerinden, yoğunluk sırasıyla gelir.
-- ---------------------------------------------------------------------
drop function if exists public.bul_perfumes(text[], text[], text, text, text, int, int);
create function public.bul_perfumes(
  p_include text[] default '{}',
  p_exclude text[] default '{}',
  p_gender  text   default null,
  p_family  text   default null,
  p_season  text   default null,
  p_limit   int    default 24,
  p_offset  int    default 0
)
returns table (
  id bigint, slug text, name text, brand text, brand_slug text,
  year smallint, gender text, image text, family text
)
language plpgsql
stable
set search_path = public, extensions
as $$
declare
  inc text[] := coalesce(p_include[1:5], '{}');
  exc text[] := coalesce(p_exclude[1:5], '{}');
  lim int    := least(greatest(p_limit, 1), 50);
  off int    := least(greatest(p_offset, 0), 480);
  drv text;
begin
  if cardinality(inc) > 0 then
    select n.slug into drv from public.notes_mv n
     where n.slug = any(inc) order by n.perfume_count asc limit 1;
    if drv is null then return; end if;
    return query
      select p.id, p.slug, p.name, p.brand, p.brand_slug, p.year, p.gender, p.image, p.family
      from public.note_rank_mv r
      join public.perfumes p on p.id = r.perfume_id
      where r.note_slug = drv
        and p.all_note_slugs @> inc
        and not (p.all_note_slugs && exc)
        and (p_gender is null or p.gender = p_gender)
        and (p_family is null or p.family_slug = p_family)
        and (p_season is null or lower(p.season) like '%' || lower(p_season) || '%')
      order by r.score desc, r.perfume_id
      limit lim offset off;
  else
    return query
      select p.id, p.slug, p.name, p.brand, p.brand_slug, p.year, p.gender, p.image, p.family
      from public.perfumes p
      where p.indexable
        and not (p.all_note_slugs && exc)
        and (p_gender is null or p.gender = p_gender)
        and (p_family is null or p.family_slug = p_family)
        and (p_season is null or lower(p.season) like '%' || lower(p_season) || '%')
      order by p.id
      limit lim offset off;
  end if;
end
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
alter table public.staging_enrich   enable row level security;

drop policy if exists "herkes okuyabilir" on public.perfumes;
create policy "herkes okuyabilir" on public.perfumes for select to anon using (true);

grant usage on schema extensions to anon;  -- arama fonksiyonu icin (Supabase'de zaten acik)
revoke all on public.perfumes, public.staging_perfumes, public.staging_enrich from anon, authenticated;
grant select on public.perfumes to anon;

revoke all on public.brands_mv, public.notes_mv, public.families_mv, public.note_rank_mv from anon, authenticated;
grant select on public.brands_mv, public.notes_mv, public.families_mv, public.note_rank_mv to anon;

revoke all on function public.yukle_staging() from public, anon, authenticated;
revoke all on function public.cinsiyet_tamamla() from public, anon, authenticated;
revoke all on function public.zenginlestir_uygula() from public, anon, authenticated;
revoke all on function public.j2a(text)       from public, anon, authenticated;
revoke all on function public.j2j(text)       from public, anon, authenticated;
revoke all on function public.slugify(text)   from anon, authenticated;
revoke all on function public.search_perfumes(text, text, int, int) from public;
grant execute on function public.search_perfumes(text, text, int, int) to anon;
revoke all on function public.note_perfumes(text, int, int) from public;
grant execute on function public.note_perfumes(text, int, int) to anon;
revoke all on function public.showcase(int) from public;
grant execute on function public.showcase(int) to anon;
revoke all on function public.bul_perfumes(text[], text[], text, text, text, int, int) from public;
grant execute on function public.bul_perfumes(text[], text[], text, text, text, int, int) to anon;

-- API katmanının fonksiyon/tablo listesini yenile
notify pgrst, 'reload schema';

select 'Kurulum tamam' as durum;
