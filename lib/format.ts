export const SITE = {
  name: "Parfüm Bilgisi",
  url: "https://parfumbilgisi.com",
  description:
    "Binlerce parfümün üst, orta ve alt notaları, akorları ve koku aileleri. Türkçe parfüm ansiklopedisi.",
};

/*
 * Veritabanındaki public.slugify() ile BİREBİR aynı kural.
 * Değiştirirsen supabase/01-kurulum.sql içindekini de aynı şekilde değiştir.
 */
const FROM = "çÇğĞıöÖşŞüÜâÂîÎûÛéÉèÈêÊëËáÁàÀäÄãÃåÅíÍìÌïÏóÓòÒõÕôÔúÚùÙñÑýÝÿŸøØæÆœŒßİ";
const TO = "cCgGioOsSuUaAiIuUeEeEeEeEaAaAaAaAaAiIiIiIoOoOoOoOuUuUnNyYyYoOaAoOsi";
const MAP = new Map([...FROM].map((c, i) => [c, TO[i]]));

export function slugify(t: string): string {
  return [...t]
    .map((c) => MAP.get(c) ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const GENDERS: Record<string, string> = {
  kadin: "Kadın",
  erkek: "Erkek",
  unisex: "Unisex",
};
export const genderLabel = (g: string | null) => (g ? GENDERS[g] ?? null : null);

export const nf = new Intl.NumberFormat("tr-TR");

/**
 * Görselin herkese açık adresi.
 * IMAGE_BASE_URL tanımlıysa (örn. https://gorsel.parfumbilgisi.com, Cloudflare R2) oradan,
 * değilse Supabase Storage'dan sunulur. Dosyalar R2'ye taşınmadan IMAGE_BASE_URL tanımlanmamalı.
 */
export function imageUrl(file: string | null): string | null {
  if (!file) return null;
  const cdn = process.env.IMAGE_BASE_URL?.replace(/\/+$/, "");
  if (cdn) return `${cdn}/${encodeURIComponent(file)}`;
  const base = process.env.SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/parfum/${encodeURIComponent(file)}`;
}

/** Marka adından sabit bir renk tonu (görselsiz parfümler için). */
export function hueOf(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function initials(brand: string | null, name: string): string {
  // "Tom Ford" -> "TF", "Dior" -> "D" (tek kelimede tek harf daha zarif durur)
  const words = (brand || name).replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/).filter(Boolean);
  const s = words.length > 1 ? words[0][0] + words[1][0] : (words[0]?.[0] ?? "");
  return s.toUpperCase();
}

/** JSON-LD'yi güvenli şekilde sayfaya gömmek için. */
export const jsonLd = (o: unknown) => ({ __html: JSON.stringify(o).replace(/</g, "\\u003c") });

/**
 * Arama için Türkçe/aksanlı harfleri sadeleştirir ("Şişe"→"sise", "ı"→"i").
 * Noktalama KORUNUR (veritabanındaki arama metni "l'homme" gibi tutuyor), sadece boşluklar toplanır.
 */
export function fold(t: string): string {
  return [...t.normalize("NFC")]
    .map((c) => MAP.get(c) ?? c)
    .join("")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
