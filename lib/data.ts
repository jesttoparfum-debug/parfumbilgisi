import { cache } from "react";
import { db } from "./supabase";
import { fold, imageUrl, slugify } from "./format";

export type PerfumeCard = {
  id: number;
  slug: string;
  name: string;
  brand: string;
  brand_slug: string;
  year: number | null;
  gender: string | null;
  image: string | null;
  family: string | null;
};

export type Accord = { name: string; value: number };

export type Perfume = PerfumeCard & {
  perfumers: string[];
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  accords: Accord[];
  family_slug: string | null;
  season: string | null;
  indexable: boolean;
};

export type Hub = { slug: string; name: string; perfume_count: number };
export type Brand = { brand_slug: string; brand: string; perfume_count: number };

const CARD = "id,slug,name,brand,brand_slug,year,gender,image,family";
export const PAGE_SIZE = 24;

/** URL'den gelen slug'ı veritabanına gitmeden doğrula. */
export const isSlug = (s: string) => s.length <= 200 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);

const cards = (d: unknown) => (d ?? []) as PerfumeCard[];
const range = (page: number) => [(page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1] as const;

/* ---------- Parfüm ---------- */
export const getPerfume = cache(async (slug: string): Promise<Perfume | null> => {
  if (!isSlug(slug)) return null;
  const { data, error } = await db()
    .from("perfumes")
    .select(`${CARD},perfumers,top_notes,heart_notes,base_notes,accords,family,family_slug,season,indexable`)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as Perfume | null;
});

export async function getSameBrand(brandSlug: string, exceptSlug: string) {
  const { data } = await db()
    .from("perfumes")
    .select(CARD)
    .eq("brand_slug", brandSlug)
    .neq("slug", exceptSlug)
    .order("indexable", { ascending: false })
    .order("name")
    .limit(8);
  return cards(data);
}

export async function getSimilar(p: Perfume) {
  // Aynı ailede, ana notaları paylaşan parfümler
  const notes = [...p.heart_notes, ...p.base_notes, ...p.top_notes].slice(0, 3);
  if (!p.family_slug || notes.length === 0) return [];
  const { data } = await db()
    .from("perfumes")
    .select(CARD)
    .eq("family_slug", p.family_slug)
    .eq("indexable", true)
    .overlaps("all_note_slugs", notes.map(slugify))
    .neq("brand_slug", p.brand_slug)
    .limit(8);
  return cards(data);
}

/* ---------- Marka ---------- */
export const getBrand = cache(async (slug: string): Promise<Brand | null> => {
  if (!isSlug(slug)) return null;
  const { data } = await db().from("brands_mv").select("*").eq("brand_slug", slug).maybeSingle();
  return data as Brand | null;
});

export async function getBrandPerfumes(slug: string, page: number) {
  const [a, b] = range(page);
  const { data } = await db()
    .from("perfumes")
    .select(CARD)
    .eq("brand_slug", slug)
    .order("indexable", { ascending: false })
    .order("name")
    .range(a, b);
  return cards(data);
}

export async function getTopBrands(limit: number) {
  const { data } = await db().from("brands_mv").select("*").order("perfume_count", { ascending: false }).limit(limit);
  return (data ?? []) as Brand[];
}

export async function getBrandsByLetter(letter: string) {
  const out: Brand[] = [];
  for (let from = 0; from < 30000; from += 1000) {
    let q = db().from("brands_mv").select("*").order("brand_slug").range(from, from + 999);
    q = letter === "0" ? q.lt("brand_slug", "a") : q.like("brand_slug", `${letter}%`);
    const { data } = await q;
    if (!data?.length) break;
    out.push(...(data as Brand[]));
    if (data.length < 1000) break;
  }
  return out;
}

/* ---------- Nota ---------- */
export const getNote = cache(async (slug: string): Promise<Hub | null> => {
  if (!isSlug(slug)) return null;
  const { data } = await db().from("notes_mv").select("*").eq("slug", slug).maybeSingle();
  return data as Hub | null;
});

export async function getNotePerfumes(slug: string, page: number) {
  // Notanın en baskın olduğu parfümler önce (puanlar veritabanında önceden hesaplı)
  const { data, error } = await db().rpc("note_perfumes", {
    p_slug: slug,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });
  if (error) throw error;
  return cards(data);
}

export async function getTopNotes(limit: number, min = 1) {
  const out: Hub[] = [];
  for (let from = 0; from < limit; from += 1000) {
    const { data } = await db()
      .from("notes_mv")
      .select("*")
      .gte("perfume_count", min)
      .order("perfume_count", { ascending: false })
      .range(from, Math.min(from + 999, limit - 1));
    if (!data?.length) break;
    out.push(...(data as Hub[]));
    if (data.length < 1000) break;
  }
  return out;
}

/* ---------- Koku ailesi ---------- */
export const getFamily = cache(async (slug: string): Promise<Hub | null> => {
  if (!isSlug(slug)) return null;
  const { data } = await db().from("families_mv").select("*").eq("slug", slug).maybeSingle();
  return data as Hub | null;
});

export async function getFamilyPerfumes(slug: string, page: number) {
  const [a, b] = range(page);
  const { data } = await db()
    .from("perfumes")
    .select(CARD)
    .eq("family_slug", slug)
    .order("indexable", { ascending: false })
    .order("name")
    .range(a, b);
  return cards(data);
}

export async function getFamilies() {
  const { data } = await db().from("families_mv").select("*").order("perfume_count", { ascending: false });
  return (data ?? []) as Hub[];
}

/* ---------- Koku Bulucu ---------- */
export type Bul = {
  include: string[];
  exclude: string[];
  gender: string | null;
  family: string | null;
  season: string | null;
};

export async function bulPerfumes(f: Bul, page: number) {
  const { data, error } = await db().rpc("bul_perfumes", {
    p_include: f.include,
    p_exclude: f.exclude,
    p_gender: f.gender,
    p_family: f.family,
    p_season: f.season,
    p_limit: PAGE_SIZE + 1,
    p_offset: (page - 1) * PAGE_SIZE,
  });
  if (error) throw error;
  const rows = cards(data);
  return { items: rows.slice(0, PAGE_SIZE), hasNext: rows.length > PAGE_SIZE };
}

export async function getNotesBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];
  const { data } = await db().from("notes_mv").select("*").in("slug", slugs);
  return (data ?? []) as Hub[];
}

/* ---------- Ana sayfa ---------- */
export async function getShowcase() {
  // Büyük markalardan, her markadan 1 görselli parfüm; sayfa her saat yenilendikçe değişir
  const { data, error } = await db().rpc("showcase", { p_limit: 12 });
  if (error) return [];
  return cards(data);
}

export async function getStats() {
  const [p, b, n] = await Promise.all([
    db().from("perfumes").select("id", { count: "estimated", head: true }),
    // Özet tablolar küçük: kesin sayım hızlı. (Tahmini sayım, yeni yenilenmiş tabloda 0 dönebiliyor.)
    // .gt(...) filtresi: eski (boşken önbelleğe alınmış) 0 sonucunu atlayıp taze sayım yapar.
    db().from("brands_mv").select("brand_slug", { count: "exact", head: true }).gt("perfume_count", 0),
    db().from("notes_mv").select("slug", { count: "exact", head: true }).gt("perfume_count", 0),
  ]);
  return { perfumes: p.count ?? 0, brands: b.count ?? 0, notes: n.count ?? 0 };
}

/* ---------- Arama ---------- */
export async function searchPerfumes(q: string, gender: string | null, page: number) {
  const { data, error } = await db().rpc("search_perfumes", {
    q: fold(q) || null,
    p_gender: gender,
    p_limit: PAGE_SIZE + 1,
    p_offset: (page - 1) * PAGE_SIZE,
  });
  if (error) throw error;
  const rows = cards(data);
  return { items: rows.slice(0, PAGE_SIZE), hasNext: rows.length > PAGE_SIZE };
}

/** Arama kutusu önerileri: önce markalar, sonra parfümler (hafif ve cache'li). */
export type Suggestion = {
  type: "brand" | "perfume";
  href: string;
  title: string;
  sub: string;
  image: string | null;
};

export async function suggest(q: string): Promise<Suggestion[]> {
  const t = fold(q).slice(0, 60);
  if (t.length < 2) return [];
  const slug = slugify(t);
  const [brands, perfumes] = await Promise.all([
    slug.length >= 2
      ? db()
          .from("brands_mv")
          .select("brand,brand_slug,perfume_count")
          .like("brand_slug", `${slug}%`)
          .order("perfume_count", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] as Brand[] }),
    db().rpc("search_perfumes", { q: t, p_gender: null, p_limit: 6, p_offset: 0 }),
  ]);
  const out: Suggestion[] = [];
  for (const b of (brands.data ?? []) as Brand[]) {
    out.push({
      type: "brand",
      href: `/marka/${b.brand_slug}`,
      title: b.brand,
      sub: `Marka · ${b.perfume_count} parfüm`,
      image: null,
    });
  }
  for (const p of cards(perfumes.data)) {
    out.push({
      type: "perfume",
      href: `/parfum/${p.slug}`,
      title: p.name,
      sub: p.brand,
      image: imageUrl(p.image),
    });
  }
  return out;
}

/** Arama sayfasında: yazılan metne uyan markalar (yazım hatasına karşı da çalışır). */
export async function matchingBrands(q: string) {
  const slug = slugify(fold(q));
  if (slug.length < 2) return [];
  const { data } = await db()
    .from("brands_mv")
    .select("*")
    .like("brand_slug", `${slug}%`)
    .order("perfume_count", { ascending: false })
    .limit(6);
  return (data ?? []) as Brand[];
}

/* ---------- Sitemap ---------- */
export const SITEMAP_CHUNK = 40000;

export async function countIndexable() {
  const { count } = await db()
    .from("perfumes")
    .select("id", { count: "exact", head: true })
    .eq("indexable", true);
  return count ?? 0;
}

/** 1 adet ana-sayfalar haritası + parfüm haritaları */
export async function sitemapCount() {
  return 1 + Math.max(1, Math.ceil((await countIndexable()) / SITEMAP_CHUNK));
}

export async function getSitemapSlugs(chunk: number) {
  const out: string[] = [];
  const start = chunk * SITEMAP_CHUNK;
  for (let off = 0; off < SITEMAP_CHUNK; off += 1000) {
    const { data } = await db()
      .from("perfumes")
      .select("slug")
      .eq("indexable", true)
      .order("slug")
      .range(start + off, start + off + 999);
    if (!data?.length) break;
    out.push(...data.map((r) => r.slug as string));
    if (data.length < 1000) break;
  }
  return out;
}

export async function getAllBrandSlugs() {
  const out: string[] = [];
  for (let from = 0; from < 50000; from += 1000) {
    const { data } = await db().from("brands_mv").select("brand_slug").order("brand_slug").range(from, from + 999);
    if (!data?.length) break;
    out.push(...data.map((r) => r.brand_slug as string));
    if (data.length < 1000) break;
  }
  return out;
}
