import Link from "next/link";
import SearchForm from "@/components/SearchForm";
import { Grid } from "@/components/PerfumeCard";
import { getFamilies, getShowcase, getStats, getTopBrands, getTopNotes } from "@/lib/data";
import { jsonLd, nf, SITE } from "@/lib/format";

export const revalidate = 3600;

export default async function Home() {
  const [stats, brands, notes, families] = await Promise.all([
    getStats(),
    getTopBrands(24),
    getTopNotes(30),
    getFamilies(),
  ]);
  const showcase = await getShowcase();

  const ld = [{
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/icon.svg`,
    email: "parfumbilgisi@gmail.com",
  }, {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    inLanguage: "tr",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE.url}/ara?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }];

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">Türkçe parfüm ansiklopedisi</p>
          <h1>
            Her parfümün <em>notaları</em>, tek yerde.
          </h1>
          <p className="lead">
            Üst, orta ve alt notalar, akorlar ve koku aileleri. Reklamsız, hızlı, sade.
          </p>
          <SearchForm large />
          <dl className="stats">
            <div><dt>Parfüm</dt><dd>{nf.format(stats.perfumes)}</dd></div>
            <div><dt>Marka</dt><dd>{nf.format(stats.brands)}</dd></div>
            <div><dt>Nota</dt><dd>{nf.format(stats.notes)}</dd></div>
          </dl>
        </div>
      </section>

      {showcase.length > 0 && (
        <section className="wrap section">
          <div className="section__head">
            <h2>Keşfet</h2>
          </div>
          <Grid items={showcase} />
        </section>
      )}

      <section className="wrap section">
        <div className="section__head">
          <h2>Popüler notalar</h2>
          <Link href="/notalar">Tüm notalar →</Link>
        </div>
        <ul className="chips">
          {notes.map((n) => (
            <li key={n.slug}>
              <Link href={`/nota/${n.slug}`}>
                {n.name} <small>{nf.format(n.perfume_count)}</small>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {families.length > 0 && (
        <section className="wrap section">
          <div className="section__head">
            <h2>Koku aileleri</h2>
          </div>
          <ul className="chips">
            {families.slice(0, 20).map((f) => (
              <li key={f.slug}>
                <Link href={`/aile/${f.slug}`}>
                  {f.name} <small>{nf.format(f.perfume_count)}</small>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="wrap section">
        <div className="section__head">
          <h2>Öne çıkan markalar</h2>
          <Link href="/markalar">Tüm markalar →</Link>
        </div>
        <ul className="chips">
          {brands.map((b) => (
            <li key={b.brand_slug}>
              <Link href={`/marka/${b.brand_slug}`} lang="en">
                {b.brand} <small>{nf.format(b.perfume_count)}</small>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
    </>
  );
}
