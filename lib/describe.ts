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

/** Arama motorları için en fazla ~155 karakterlik özet: kimlik + notalar öne alınır. */
export function metaDescription(p: Perfume): string {
  const s = describe(p);
  const picked = [...p.top_notes.slice(0, 2), ...p.heart_notes.slice(0, 2), ...p.base_notes.slice(0, 2)];
  const uniq = [...new Set(picked)];
  // Önce 6, sığmazsa 4, sonra 3 nota dene; hiçbiri sığmazsa notasız bırak.
  const notes =
    [6, 4, 3]
      .map((n) => (uniq.length ? `Notalar: ${list(uniq, n)}.` : null))
      .find((t) => t && `${s[0]} ${t}`.length <= 155) ?? null;
  const rest = s.slice(1).filter((x) => !/Açılışta|Koku .* ile açılır|Üst notalarda|Notaları arasında/.test(x));
  let out = "";
  for (const sentence of [s[0], notes, ...rest]) {
    if (!sentence) continue;
    if ((out + " " + sentence).trim().length > 155) continue;
    out = (out + " " + sentence).trim();
  }
  return out || s[0].slice(0, 155);
}

/* ---------------------------------------------------------------------
 * Sayfadaki "Hakkında" bölümü ve sık sorulan sorular.
 * Yalnızca parfümün kendi verisinden üretilir; olmayan bilgi yazılmaz.
 * Akor yorumları genel koku bilgisidir ("odunsu = sıcak ve derin"), parfüme özel iddia değildir
 * ve "uygun olabilir" gibi ihtiyatlı ifadelerle yazılır.
 * ------------------------------------------------------------------- */

// Akor adı (Türkçe/İngilizce) -> kokuya verdiği his
const FEEL: [RegExp, string][] = [
  [/vanil/, "yumuşak ve sarıcı"],
  [/karamel|caramel|bal\b|honey/, "tatlı ve sıcak"],
  [/tatli|sweet|gurme|gourmand/, "tatlı ve davetkar"],
  [/amber|kehribar|balsam/, "sıcak ve kehribarımsı"],
  [/baharat|spic/, "sıcak ve hareketli"],
  [/oud|\bud\b/, "derin ve gizemli"],
  [/deri|leather/, "karakterli ve sert"],
  [/tutun|tobacco/, "sıcak ve dumanlı"],
  [/odun|wood|sedir|sandal/, "sıcak ve derin"],
  [/yosun|moss|sipr|chypre|toprak|earth/, "toprağımsı ve doğal"],
  [/yesil|green|aromatik|aromatic/, "doğal ve ferah"],
  [/narenciye|citrus|limon|bergamot/, "canlı ve parlak"],
  [/sucul|aquatic|marine|deniz|ozon/, "serin ve ferah"],
  [/taze|fresh|ferah|sabun|soap/, "temiz ve ferah"],
  [/beyaz cicek|white floral|yasemin|tuberoz/, "zarif ve baygın"],
  [/gul\b|rose/, "romantik ve zarif"],
  [/cicek|floral/, "zarif ve çiçeksi"],
  [/meyve|fruit|tropik/, "neşeli ve sulu"],
  [/pudra|powder/, "yumuşak ve pudramsı"],
  [/misk|musk/, "yumuşak ve tene yakın"],
];
const DAY = /narenciye|citrus|sucul|aquatic|marine|taze|fresh|ferah|yesil|green|aromatik|aromatic|cicek|floral|meyve|fruit|ozon/;
const NIGHT = /amber|oud|\bud\b|vanil|tatli|sweet|deri|leather|tutun|tobacco|baharat|spic|odun|wood|balsam|karamel|caramel/;

const fold = (s: string) =>
  s
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u");

function feelOf(accord: string): string | null {
  const t = fold(accord);
  for (const [re, f] of FEEL) if (re.test(t)) return f;
  return null;
}

export type Faq = { q: string; a: string };

export function describeSections(p: Perfume): { paragraphs: string[]; faq: Faq[] } {
  const h = hash(p.slug + "#s");
  const pick = <T,>(arr: T[], salt: number) => arr[(h >>> salt) % arr.length];
  const full = `${p.brand} ${p.name}`;
  const fam = p.family ? tr(p.family) : null;
  const g = p.gender ?? null;

  // Paragraf 1: kimlik (kısa, "describe" ile aynı gerçekler)
  const p1 = describe(p).filter((s) => !/Açılışta|Koku .* ile açılır|Üst notalarda|Notaları arasında|akor|aylarında|mevsim/.test(s));

  // Paragraf 2: koku profili
  const [top, heart, base] = [p.top_notes, p.heart_notes, p.base_notes];
  const acc = [...p.accords]
    .filter((a) => a && typeof a.name === "string")
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const p2: string[] = [];
  if (top.length && heart.length && base.length) {
    p2.push(
      pick(
        [
          `${full} koku piramidinde ${list(top, 4)} üst notalarla açılır. Orta notalarda ${list(heart, 4)} öne çıkar; alt notalarda ${list(base, 4)} kalıcı izi oluşturur.`,
          `${full} ilk sıkışta ${list(top, 4)} ile karşılar. Kalbinde ${list(heart, 4)} bulunur, kuruyan izinde ise ${list(base, 4)} kalır.`,
          `Piramidin tepesinde ${list(top, 4)}, kalbinde ${list(heart, 4)}, dibinde ${list(base, 4)} yer alır; ${full} bu üç katmanla zamanla gelişen bir koku sunar.`,
        ],
        4,
      ),
    );
  } else {
    const all = [...top, ...heart, ...base];
    if (all.length) p2.push(`${full} notaları arasında ${list(all, 6)} bulunur.`);
  }
  if (acc.length >= 2) {
    const [a, b] = [acc[0], acc[1]];
    const pa = Math.round(a.value ?? 0);
    const pb = Math.round(b.value ?? 0);
    p2.push(
      pick(
        [
          `Akor dağılımında ${tr(a.name)} (%${pa}) ve ${tr(b.name)} (%${pb}) öndedir.`,
          `Karakterini en çok ${tr(a.name)} (%${pa}) ve ${tr(b.name)} (%${pb}) akorları belirler.`,
        ],
        9,
      ),
    );
    const fa = feelOf(a.name);
    const fb = feelOf(b.name);
    if (fa && fb && fa !== fb) {
      p2.push(`Genel olarak ${tr(a.name)} akoru kokuya ${fa}, ${tr(b.name)} akoru ise ${fb} bir hava katar.`);
    } else if (fa) {
      p2.push(`Genel olarak ${tr(a.name)} akoru kokuya ${fa} bir hava katar.`);
    }
  } else if (acc.length === 1) {
    p2.push(`Baskın akoru ${tr(acc[0].name)} (%${Math.round(acc[0].value ?? 0)}).`);
  }

  // Paragraf 3: ne zaman / kime (ihtiyatlı)
  const p3: string[] = [];
  const top3 = acc.slice(0, 3).map((a) => fold(a.name));
  const day = top3.filter((t) => DAY.test(t)).length;
  const night = top3.filter((t) => NIGHT.test(t)).length;
  if (day > night) p3.push("Yapısı gereği gündüz ve günlük kullanımda öne çıkabilir.");
  else if (night > day) p3.push("Yapısı gereği akşam ve serin havalarda daha çok öne çıkabilir.");
  else if (day > 0 && day === night) p3.push("Dengeli yapısı sayesinde hem gündüz hem akşam denenebilir.");
  if (p.season) p3.push(seasonSentence(p.season));
  if (p3.length) p3.push("Koku her ciltte farklı gelişir; satın almadan önce kendi cildinde denemeni öneririz.");

  const paragraphs = [p1.join(" "), p2.join(" "), p3.join(" ")].filter((s) => s.trim().length > 0);

  // Sık sorulan sorular (yalnızca cevabı veride olanlar)
  const faq: Faq[] = [];
  if (fam) faq.push({ q: `${full} hangi koku ailesine ait?`, a: `${full}, ${fam} koku ailesinde yer alır.` });
  if (top.length || heart.length || base.length) {
    const parts: string[] = [];
    if (top.length) parts.push(`üst notalar: ${list(top, 6)}`);
    if (heart.length) parts.push(`orta notalar: ${list(heart, 6)}`);
    if (base.length) parts.push(`alt notalar: ${list(base, 6)}`);
    faq.push({ q: `${full} notaları nelerdir?`, a: `${full} için ${parts.join("; ")}.` });
  }
  if (acc.length >= 2) {
    faq.push({
      q: `${full} akorları nelerdir?`,
      a: `En baskın akorlar ${list(acc.map((a) => `${tr(a.name)} (%${Math.round(a.value ?? 0)})`), 4)}.`,
    });
  }
  if (g) {
    faq.push({
      q: `${full} kadın mı, erkek mi, unisex mi?`,
      a: `${full}, ${g === "unisex" ? "unisex (kadın ve erkekler için)" : g === "kadin" ? "kadınlar için" : "erkekler için"} bir parfüm olarak listelenir.`,
    });
  }
  if (p.year) faq.push({ q: `${full} hangi yıl çıktı?`, a: `${full}, ${p.year} yılında piyasaya sürülmüştür.` });
  if (p.perfumers.length) {
    faq.push({
      q: `${full} parfümörü kim?`,
      a: `${full}, ${list(p.perfumers, 4)} imzasını taşır.`,
    });
  }
  if (p.season) faq.push({ q: `${full} hangi mevsimde kullanılır?`, a: seasonSentence(p.season) });

  return { paragraphs, faq };
}
