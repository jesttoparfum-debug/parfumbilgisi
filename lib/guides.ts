/*
 * Rehber (makale) altyapısı. Makaleler content/rehber/ klasöründe, düz veri olarak durur.
 * Metin içinde [yazı](/adres) biçiminde bağlantı ve **kalın** kullanılabilir.
 */
export type Block =
  | { t: "h2"; x: string }
  | { t: "h3"; x: string }
  | { t: "p"; x: string }
  | { t: "ul"; x: string[] }
  | { t: "ol"; x: string[] }
  | { t: "table"; head: string[]; rows: string[][]; caption?: string }
  | { t: "note"; x: string };

export type Guide = {
  slug: string;
  title: string;
  description: string; // Google özeti (~155 karakter)
  category: string;
  published: string; // YYYY-MM-DD
  updated: string;
  summary: string[]; // "Kısaca" kutusu
  body: Block[];
  faq?: { q: string; a: string }[];
  related: string[]; // başka makalelerin slug'ları
  sources: { title: string; url: string }[];
};

import { parfumNedir } from "@/content/rehber/parfum-nedir";
import { edpEdtFarki } from "@/content/rehber/edp-edt-extrait-farki";
import { kokuPiramidi } from "@/content/rehber/koku-piramidi";
import { kokuAileleri } from "@/content/rehber/koku-aileleri";
import { parfumNasilSurulur } from "@/content/rehber/parfum-nasil-surulur";
import { parfumNasilSaklanir } from "@/content/rehber/parfum-nasil-saklanir";
import { parfumSozlugu } from "@/content/rehber/parfum-sozlugu";
import { parfumTarihi } from "@/content/rehber/parfum-tarihi";
import { kokuYorgunlugu } from "@/content/rehber/koku-yorgunlugu";
import { parfumAlerjisi } from "@/content/rehber/parfum-alerjisi";

export const GUIDES: Guide[] = [
  parfumNedir,
  edpEdtFarki,
  kokuPiramidi,
  kokuAileleri,
  parfumNasilSurulur,
  parfumNasilSaklanir,
  parfumSozlugu,
  parfumTarihi,
  kokuYorgunlugu,
  parfumAlerjisi,
];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug) ?? null;

/** Makalenin yaklaşık okuma süresi (dakika). */
export function readMinutes(g: Guide): number {
  const text = [
    ...g.summary,
    ...g.body.flatMap((b) =>
      b.t === "ul" || b.t === "ol" ? b.x : b.t === "table" ? [...b.head, ...b.rows.flat()] : [b.x],
    ),
    ...(g.faq ?? []).flatMap((f) => [f.q, f.a]),
  ].join(" ");
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

/** Başlık metninden sabit bir kimlik (içindekiler bağlantıları için). */
export function headingId(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[çÇ]/g, "c").replace(/[ğĞ]/g, "g").replace(/[ıİ]/g, "i").replace(/[öÖ]/g, "o").replace(/[şŞ]/g, "s").replace(/[üÜ]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
