import type { Metadata } from "next";
import Link from "next/link";
import { getTopPerfumers } from "@/lib/data";
import { nf } from "@/lib/format";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Parfümörler",
  description: "Parfümleri yaratan burunlar. Her parfümörün imzasını taşıyan parfümleri ve notalarını keşfet.",
  alternates: { canonical: "/parfumorler" },
};

export default async function PerfumersIndex() {
  const top = await getTopPerfumers(600, 3);
  const featured = top.slice(0, 24);
  const alpha = [...top].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  return (
    <div className="wrap section">
      <header className="page-head">
        <p className="eyebrow">Keşfet</p>
        <h1>Parfümörler</h1>
        <p className="lead">Parfümleri yaratan burunlar. Birini seç, imzasını taşıyan tüm parfümleri gör.</p>
      </header>

      {top.length === 0 ? (
        <p className="empty">Parfümör listesi şu an hazır değil.</p>
      ) : (
        <>
          <section className="block block--first">
            <h2>En çok imza atanlar</h2>
            <ul className="chips">
              {featured.map((h) => (
                <li key={h.slug}>
                  <Link href={`/parfumor/${h.slug}`}>
                    {h.name} <small>{nf.format(h.perfume_count)}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="block">
            <h2>A'dan Z'ye</h2>
            <ul className="brandlist">
              {alpha.map((h) => (
                <li key={h.slug}>
                  <Link href={`/parfumor/${h.slug}`}>
                    {h.name} <small>{nf.format(h.perfume_count)}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
