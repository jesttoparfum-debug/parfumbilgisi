-- Yönetim paneli + onay kuyruğu. Supabase > SQL Editor'a yapıştırıp bir kez çalıştır.
-- Bu tablolar ve fonksiyonlar SADECE service_role anahtarıyla (sunucu) kullanılır; anon erişemez.

-- 1) Aranıp bulunamayan kelimeler
create table if not exists public.search_misses (
  q_norm   text primary key,
  q_raw    text not null,
  hits     int  not null default 1,
  first_at timestamptz not null default now(),
  last_at  timestamptz not null default now(),
  durum    text not null default 'bekliyor' check (durum in ('bekliyor', 'eklendi', 'yoksay'))
);
alter table public.search_misses enable row level security;
revoke all on public.search_misses from anon, authenticated;

-- 2) Robotun bulduğu adaylar (onaylanmadan sitede görünmez)
create table if not exists public.candidates (
  id          bigint generated always as identity primary key,
  source      text not null,            -- örn. 'wikidata'
  source_id   text not null,            -- kaynaktaki kimlik (örn. Q12345)
  source_url  text,
  license     text,                     -- örn. 'CC0'
  name        text not null,
  brand       text,
  year        smallint,
  perfumers   text[] not null default '{}',
  note        text,
  status      text not null default 'bekliyor' check (status in ('bekliyor', 'onaylandi', 'reddedildi')),
  created_at  timestamptz not null default now(),
  unique (source, source_id)
);
alter table public.candidates enable row level security;
revoke all on public.candidates from anon, authenticated;

-- 3) Arama kaydı (sadece sunucu çağırır)
create or replace function public.log_miss(p_q text)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  insert into public.search_misses as m (q_norm, q_raw)
  values (lower(extensions.unaccent(btrim(p_q))), left(btrim(p_q), 80))
  on conflict (q_norm) do update set hits = m.hits + 1, last_at = now()
  where m.durum = 'bekliyor';
$$;
revoke all on function public.log_miss(text) from public, anon, authenticated;
grant execute on function public.log_miss(text) to service_role;

-- 4) Parfüm ekle / güncelle (yeni için id verme, düzenlemek için id ver)
create or replace function public.yonetim_kaydet(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id      bigint := nullif(p->>'id', '')::bigint;
  v_brand   text := btrim(p->>'brand');
  v_name    text := btrim(p->>'name');
  v_gender  text := nullif(btrim(coalesce(p->>'gender', '')), '');
  v_year    smallint := case when btrim(coalesce(p->>'year', '')) ~ '^\d{4}$' then btrim(p->>'year')::smallint end;
  v_perf    text[] := coalesce(array(select btrim(x) from jsonb_array_elements_text(coalesce(p->'perfumers', '[]')) x where btrim(x) <> ''), '{}');
  v_top     text[] := coalesce(array(select btrim(x) from jsonb_array_elements_text(coalesce(p->'top', '[]')) x where btrim(x) <> ''), '{}');
  v_heart   text[] := coalesce(array(select btrim(x) from jsonb_array_elements_text(coalesce(p->'heart', '[]')) x where btrim(x) <> ''), '{}');
  v_base    text[] := coalesce(array(select btrim(x) from jsonb_array_elements_text(coalesce(p->'base', '[]')) x where btrim(x) <> ''), '{}');
  v_family  text := nullif(btrim(coalesce(p->>'family', '')), '');
  v_season  text := nullif(btrim(coalesce(p->>'season', '')), '');
  v_slugs   text[];
  v_slug    text;
  v_base_slug text;
  v_n       int := 1;
  v_acc     jsonb;
  v_index   boolean;
begin
  if v_brand is null or v_brand = '' or v_name is null or v_name = '' then
    return jsonb_build_object('ok', false, 'hata', 'Marka ve parfüm adı zorunlu');
  end if;
  if v_gender is not null and v_gender not in ('kadin', 'erkek', 'unisex') then
    return jsonb_build_object('ok', false, 'hata', 'Cinsiyet geçersiz');
  end if;

  v_slugs := array(select distinct public.slugify(n) from unnest(v_top || v_heart || v_base) n where public.slugify(n) <> '');

  if v_id is null then
    v_base_slug := public.slugify(v_brand || ' ' || v_name);
    if v_base_slug = '' then
      return jsonb_build_object('ok', false, 'hata', 'Ad geçersiz');
    end if;
    v_slug := v_base_slug;
    while exists (select 1 from public.perfumes where slug = v_slug) loop
      v_n := v_n + 1;
      v_slug := v_base_slug || '-' || v_n;
    end loop;
    v_index := cardinality(v_top || v_heart || v_base) >= 3 and v_year is not null;
    insert into public.perfumes (
      slug, name, brand, brand_slug, gender, year, perfumers, top_notes, heart_notes, base_notes,
      all_note_slugs, accords, family, family_slug, season, search_text, indexable, gender_kaynak
    ) values (
      v_slug, v_name, v_brand,
      coalesce(nullif(public.slugify(v_brand), ''), 'marka-' || left(md5(v_brand), 8)),
      v_gender, v_year, v_perf, v_top, v_heart, v_base,
      v_slugs, '[]'::jsonb, v_family, nullif(public.slugify(v_family), ''), v_season,
      lower(extensions.unaccent(v_brand || ' ' || v_name)), v_index,
      case when v_gender is not null then 'veri' end
    ) returning id into v_id;
  else
    select accords into v_acc from public.perfumes where id = v_id;
    if not found then
      return jsonb_build_object('ok', false, 'hata', 'Parfüm bulunamadı');
    end if;
    v_index := cardinality(v_top || v_heart || v_base) >= 3
               and (v_year is not null or (jsonb_typeof(v_acc) = 'array' and jsonb_array_length(v_acc) > 0));
    update public.perfumes set
      name = v_name, brand = v_brand,
      brand_slug = coalesce(nullif(public.slugify(v_brand), ''), 'marka-' || left(md5(v_brand), 8)),
      gender = v_gender, year = v_year, perfumers = v_perf,
      top_notes = v_top, heart_notes = v_heart, base_notes = v_base, all_note_slugs = v_slugs,
      family = v_family, family_slug = nullif(public.slugify(v_family), ''), season = v_season,
      search_text = lower(extensions.unaccent(v_brand || ' ' || v_name)),
      indexable = v_index,
      gender_kaynak = case when v_gender is not null then 'veri' else null end,
      updated_at = now()
    where id = v_id
    returning slug into v_slug;
  end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'slug', v_slug);
end
$$;
revoke all on function public.yonetim_kaydet(jsonb) from public, anon, authenticated;
grant execute on function public.yonetim_kaydet(jsonb) to service_role;

-- 5) Marka / nota / aile sayılarını yenile (toplu ekleme sonrası bir kez)
create or replace function public.yonetim_yenile()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view public.brands_mv;
  refresh materialized view public.notes_mv;
  refresh materialized view public.families_mv;
  refresh materialized view public.note_rank_mv;
  return 'yenilendi';
end
$$;
revoke all on function public.yonetim_yenile() from public, anon, authenticated;
grant execute on function public.yonetim_yenile() to service_role;

-- 6) Robotun mevcut kayıtları kontrol edebilmesi için: bu ad-marka birleşimi var mı?
create or replace function public.var_mi(p_texts text[])
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(search_text), '{}') from public.perfumes where search_text = any (p_texts);
$$;
revoke all on function public.var_mi(text[]) from public, anon, authenticated;
grant execute on function public.var_mi(text[]) to service_role;
