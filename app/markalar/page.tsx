import type { Metadata } from "next";
import Link from "next/link";
import { getBrandsByLetter } from "@/lib/data";
import { nf } from "@/lib/format";

export const revalidate = 86400;

const LETTERS = ["0", ..."abcdefghijklmnopqrstuvwxyz"];

type Props = { searchParams: Promise<{ harf?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { harf } = await searchParams;
  const l = LETTERS.includes(harf ?? "") ? harf! : "a";
  return {
    title: `Parfüm markaları — ${l === "0" ? "0-9" : l.toUpperCase()}`,
    description: "Tüm parfüm markaları alfabetik sırayla.",
    alternates: { canonical: l === "a" ? "/markalar" : `/markalar?harf=${l}` },
  };
}

export default async function Brands({ searchParams }: Props) {
  const { harf } = await searchParams;
  const letter = LETTERS.includes(harf ?? "") ? harf! : "a";
  const brands = await getBrandsByLetter(letter);

  return (
    <div className="wrap section">
      <header className="page-head">
        <p className="eyebrow">A'dan Z'ye</p>
        <h1>Markalar</h1>
      </header>
      <nav className="letters" aria-label="Harf seç">
        {LETTERS.map((l) => (
          <Link
            key={l}
            href={l === "a" ? "/markalar" : `/markalar?harf=${l}`}
            aria-current={l === letter ? "page" : undefined}
          >
            {l === "0" ? "0-9" : l.toUpperCase()}
          </Link>
        ))}
      </nav>
      {brands.length === 0 ? (
        <p className="empty">Bu harfle başlayan marka yok.</p>
      ) : (
        <ul className="brandlist">
          {brands.map((b) => (
            <li key={b.brand_slug}>
              <Link href={`/marka/${b.brand_slug}`}>
                {b.brand} <small>{nf.format(b.perfume_count)}</small>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
