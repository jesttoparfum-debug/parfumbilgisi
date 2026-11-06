import type { Perfume } from "./data";

/*
 * Parfümün kendi verisinden Türkçe açıklama üretir.
 * Kurallar:
 *  - Özel isimlere (marka, parfüm, nota) ek getirilmez -> "Dior'un/Dior'nun" gibi hatalar olmaz.
 *  - Olmayan bilgi uydurulmaz; eksik bölüm cümlede de yer almaz.
 *  - Cümle kalıpları sayfaya göre değişir (aynı metin 175 bin sayfada tekrarlanmaz).
 */

const tr = (s: string) => s.toLocaleLowerCase("tr-TR");

function list(items: string[], max = 3): string {
  const a = items.slice(0, max);
  if (a.length <= 1) return a[0] ?? "";
  return `${a.slice(0, -1).join(", ")} ve ${a[a.length - 1]}`;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}

const GENDER_FOR: Record<string, string> = {
  kadin: "kadınlar için",
  erkek: "erkekler için",
  unisex: "kadın ve erkekler için",
};
const GENDER_WORD: Record<string, string> = { kadin: "kadın", erkek: "erkek", unisex: "unisex" };

function seasonSentence(season: string): string {
  const s = tr(season);
  if (s.includes("mevsim")) return "Her mevsim kullanıma uygundur.";
  const parts = s.split(/\s*[,/]\s*|\s+ve\s+/).filter(Boolean);
  return `Özellikle ${list(parts, 4)} aylarında tercih edilebilir.`;
}

export function describe(p: Perfume): string[] {
  const h = hash(p.slug);
  const pick = <T,>(arr: T[], salt: number) => arr[(h >>> salt) % arr.length];
  const fam = p.family ? tr(p.family) : null;
  const g = p.gender ?? null;
  const out: string[] = [];

  // 1) Giriş
  if (fam && g) {
    out.push(
      pick(
        [
          `${p.name}, ${p.brand} markasının ${GENDER_FOR[g]} sunduğu ${fam} bir parfümdür.`,
          `${p.brand} imzalı ${p.name}, ${fam} koku ailesinde yer alan bir ${GENDER_WORD[g]} parfümüdür.`,
        ],
        0,
      ),
    );
  } else if (fam) {
    out.push(
      pick(
        [
          `${p.name}, ${p.brand} markasının ${fam} koku ailesindeki parfümlerinden biridir.`,
          `${p.brand} imzalı ${p.name}, ${fam} koku ailesinde yer alır.`,
        ],
        0,
      ),
    );
  } else if (g) {
    out.push(`${p.name}, ${p.brand} markasının ${GENDER_FOR[g]} sunduğu bir parfümdür.`);
  } else {
    out.push(`${p.name}, ${p.brand} markasına ait bir parfümdür.`);
  }

  // 2) Yıl ve parfümör
  if (p.year) {
    out.push(pick([`${p.year} yılında piyasaya sürülmüştür.`, `Piyasaya çıkış yılı ${p.year}.`], 3));
  }
  if (p.perfumers.length === 1) out.push(`Parfümörü ${p.perfumers[0]}.`);
  else if (p.perfumers.length > 1) out.push(`Parfümörleri ${list(p.perfumers, 4)}.`);

  // 3) Notalar
  const [top, heart, base] = [p.top_notes, p.heart_notes, p.base_notes];
  if (top.length && heart.length && base.length) {
    out.push(
      pick(
        [
          `Açılışta ${list(top)} hissedilir; kalbinde ${list(heart)}, dibinde ise ${list(base)} yer alır.`,
          `Koku ${list(top)} ile açılır; ardından ${list(heart)} öne çıkar, ${list(base)} ise kalıcı izi bırakır.`,
          `Üst notalarda ${list(top)}, orta notalarda ${list(heart)}, alt notalarda ise ${list(base)} bulunur.`,
        ],
        5,
      ),
    );
  } else {
    const all = [...top, ...heart, ...base];
    if (all.length) out.push(`Notaları arasında ${list(all, 5)} bulunur.`);
  }

  // 4) Akorlar
  const acc = [...p.accords]
    .filter((a) => a && typeof a.name === "string")
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .map((a) => tr(a.name));
  if (acc.length >= 2) {
    out.push(
      pick(
        [
          `En baskın akorları ${list(acc)} olarak öne çıkar.`,
          `Karakterini en çok ${list(acc)} akorları belirler.`,
        ],
        8,
      ),
    );
  } else if (acc.length === 1) {
    out.push(`Baskın akoru ${acc[0]}.`);
  }

  // 5) Mevsim
  if (p.season) out.push(seasonSentence(p.season));

  return out;
}

/** Arama motorları için en fazla ~155 karakterlik özet. */
export function metaDescription(p: Perfume): string {
  const s = describe(p);
  let out = "";
  for (const sentence of s) {
    if ((out + " " + sentence).trim().length > 155) continue;
    out = (out + " " + sentence).trim();
  }
  return out || s[0].slice(0, 155);
}
