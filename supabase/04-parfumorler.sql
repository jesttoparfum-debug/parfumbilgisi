-- 04: Parfümörler (burnu / parfüm yaratıcıları) sayfaları için hazır tablolar.
-- Güvenle tekrar çalıştırılabilir. Küçük yer kaplar (yaklaşık 10-15 MB).
begin;
set local statement_timeout = 0;

drop function if exists public.perfumer_perfumes(text, int, int);
drop materialized view if exists public.perfumer_perfume_mv;
drop materialized view if exists public.perfumers_mv;

-- Hangi parfümörün hangi parfümleri var (parfüm başına tek satır)
create materialized view public.perfumer_perfume_mv as
  select public.slugify(n) as perfumer_slug, p.id as perfume_id
  from public.perfumes p, unnest(p.perfumers) as n
  where public.slugify(n) <> ''
  group by 1, 2;
create index perfumer_perfume_idx on public.perfumer_perfume_mv (perfumer_slug, perfume_id);

-- Parfümör listesi (ad + kaç parfümü var)
create materialized view public.perfumers_mv as
  select public.slugify(n) as slug,
         mode() within group (order by n) as name,
         count(distinct p.id)::int as perfume_count
  from public.perfumes p, unnest(p.perfumers) as n
  where public.slugify(n) <> ''
  group by 1;
create unique index perfumers_mv_slug on public.perfumers_mv (slug);
create index perfumers_mv_count on public.perfumers_mv (perfume_count desc);

-- Bir parfümörün parfümleri (görselli ve bilgisi dolu olanlar önce, sonra yeniden eskiye)
create function public.perfumer_perfumes(
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
  from public.perfumer_perfume_mv r
  join public.perfumes p on p.id = r.perfume_id
  where r.perfumer_slug = p_slug
  order by p.indexable desc, p.year desc nulls last, p.name
  limit  least(greatest(p_limit, 1), 50)
  offset least(greatest(p_offset, 0), 10000);
$$;

revoke all on public.perfumers_mv, public.perfumer_perfume_mv from anon, authenticated;
grant select on public.perfumers_mv, public.perfumer_perfume_mv to anon;
revoke all on function public.perfumer_perfumes(text, int, int) from public;
grant execute on function public.perfumer_perfumes(text, int, int) to anon;

commit;
notify pgrst, 'reload schema';

select (select count(*) from public.perfumers_mv) as parfumor_sayisi,
       (select count(*) from public.perfumer_perfume_mv) as eslesme_satiri,
       pg_size_pretty(pg_total_relation_size('public.perfumer_perfume_mv') + pg_total_relation_size('public.perfumers_mv')) as kapladigi_yer;
