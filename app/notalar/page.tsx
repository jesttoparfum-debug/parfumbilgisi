import type { Metadata } from "next";
import Link from "next/link";
import { getFamilies, getTopNotes } from "@/lib/data";
import { nf } from "@/lib/format";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Parfüm notaları ve koku aileleri",
  description: "Vanilya, gül, misk, oud ve yüzlerce nota. Her notanın geçtiği parfümleri keşfet.",
  alternates: { canonical: "/notalar" },
};

export default async function NotesIndex() {
  const [families, notes] = await Promise.all([getFamilies(), getTopNotes(600, 5)]);
  return (
    <div className="wrap section">
      <header className="page-head">
        <p className="eyebrow">Keşfet</p>
        <h1>Notalar ve koku aileleri</h1>
      </header>

      {families.length > 0 && (
        <section className="block block--first">
          <h2>Koku aileleri</h2>
          <ul className="chips">
            {families.map((f) => (
              <li key={f.slug}>
                <Link href={`/aile/${f.slug}`}>
                  {f.name} <small>{nf.format(f.perfume_count)}</small>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="block">
        <h2>En çok kullanılan notalar</h2>
        <ul className="brandlist">
          {notes.map((n) => (
            <li key={n.slug}>
              <Link href={`/nota/${n.slug}`}>
                {n.name} <small>{nf.format(n.perfume_count)}</small>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
