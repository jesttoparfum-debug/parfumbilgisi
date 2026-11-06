import Link from "next/link";
import SearchForm from "@/components/SearchForm";
import { Grid } from "@/components/PerfumeCard";
import { GUIDES, readMinutes } from "@/lib/guides";
import { getFamilies, getPopular, getShowcase, getStats, getTopBrands, getTopNotes } from "@/lib/data";
import { jsonLd, nf, SITE } from "@/lib/format";

export const revalidate = 3600;

const FEATURED_GUIDES = ["edp-edt-extrait-farki", "parfum-nedir", "koku-piramidi"];

const POPULAR = ["Sauvage", "Baccarat Rouge", "Aventus", "Oud", "Black Opium", "Libre"];

const TILES = [
  { href: "/bul", title: "Koku Bulucu", text: "Sevdiğin notaları seç, sana uygun parfümleri bulalım." },
  { href: "/notalar", title: "Notalar", text: "Vanilyadan oud'a tüm notalar ve bu notaların baskın olduğu parfümler." },
  { href: "/markalar", title: "Markalar", text: "A'dan Z'ye tüm markalar ve koleksiyonları." },
  { href: "/parfumorler", title: "Parfümörler", text: "Kokuları yaratan burunlar ve imzalarını taşıyan parfümler." },
  { href: "/rehber", title: "Rehber", text: "EDP mi EDT mi? Notalar, akorlar, parfüm sürme ve saklama rehberi." },
];

export default async function Home() {
  const [stats, brands, notes, families] = await Promise.all([
    getStats(),
    getTopBrands(24),
    getTopNotes(30),
    getFamilies(),
  ]);
  const [showcase, men, women] = await Promise.all([getShowcase(), getPopular("erkek"), getPopular("kadin")]);

  const ld = [{
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/icon-512.png`,
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
          <p className="eyebrow">Koku rehberin</p>
          <h1>
            Aradığın kokuyu <em>notalarından</em> bul.
          </h1>
          <p className="lead">
            Yazmaya başla: parfümü, markayı ya da sevdiğin notayı bulalım. Üst, orta ve alt notalar, akorlar ve koku aileleri.
          </p>
          <SearchForm large />
          <p className="popular">
            <span>Popüler:</span>
            {POPULAR.map((t) => (
              <Link key={t} href={`/ara?q=${encodeURIComponent(t)}`}>{t}</Link>
            ))}
          </p>
          <dl className="stats">
            <div><dt>Parfüm</dt><dd>{nf.format(stats.perfumes)}</dd></div>
            <div><dt>Marka</dt><dd>{nf.format(stats.brands)}</dd></div>
            <div><dt>Nota</dt><dd>{nf.format(stats.notes)}</dd></div>
          </dl>
        </div>
      </section>

      <section className="wrap tiles" aria-label="Hızlı erişim">
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} className="tile">
            <strong>{t.title}</strong>
            <span>{t.text}</span>
            <em aria-hidden="true">→</em>
          </Link>
        ))}
      </section>

      {showcase.length > 0 && (
        <section className="wrap section">
          <div className="section__head">
            <h2>Keşfet</h2>
          </div>
          <Grid items={showcase} />
        </section>
      )}

      {men.length > 0 && (
        <section className="wrap section">
          <div className="section__head">
            <h2>Popüler erkek parfümleri</h2>
            <Link href="/ara?cinsiyet=erkek">Tümü →</Link>
          </div>
          <Grid items={men} />
        </section>
      )}

      {women.length > 0 && (
        <section className="wrap section">
          <div className="section__head">
            <h2>Popüler kadın parfümleri</h2>
            <Link href="/ara?cinsiyet=kadin">Tümü →</Link>
          </div>
          <Grid items={women} />
        </section>
      )}

      <section className="wrap section">
        <div className="section__head">
          <h2>Rehberden</h2>
          <Link href="/rehber">Tüm yazılar →</Link>
        </div>
        <ul className="guidegrid">
          {FEATURED_GUIDES.map((slug) => GUIDES.find((g) => g.slug === slug))
            .filter((g): g is NonNullable<typeof g> => !!g)
            .map((g) => (
              <li key={g.slug}>
                <Link href={`/rehber/${g.slug}`} className="guidecard">
                  <span className="guidecard__cat">{g.category} · {readMinutes(g)} dk</span>
                  <strong>{g.title}</strong>
                  <span>{g.description}</span>
                </Link>
              </li>
            ))}
        </ul>
      </section>

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
