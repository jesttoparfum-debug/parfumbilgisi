import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GuideBody, { Inline } from "@/components/GuideBody";
import { getGuide, GUIDES, headingId, readMinutes } from "@/lib/guides";
import { jsonLd, SITE } from "@/lib/format";

export const dynamicParams = false;
export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return { title: "Yazı bulunamadı", robots: { index: false } };
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/rehber/${g.slug}` },
    openGraph: {
      title: g.title,
      description: g.description,
      url: `/rehber/${g.slug}`,
      type: "article",
      publishedTime: g.published,
      modifiedTime: g.updated,
    },
  };
}

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00Z").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();

  const toc = g.body.filter((b) => b.t === "h2").map((b) => (b as { x: string }).x);
  const related = g.related.map((s) => getGuide(s)).filter((x): x is NonNullable<typeof x> => !!x);
  const url = `${SITE.url}/rehber/${g.slug}`;

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: g.title,
      description: g.description,
      inLanguage: "tr",
      datePublished: g.published,
      dateModified: g.updated,
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: SITE.name, url: SITE.url },
      publisher: {
        "@type": "Organization",
        name: SITE.name,
        logo: { "@type": "ImageObject", url: `${SITE.url}/icon-512.png` },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ana sayfa", item: SITE.url },
        { "@type": "ListItem", position: 2, name: "Rehber", item: `${SITE.url}/rehber` },
        { "@type": "ListItem", position: 3, name: g.title, item: url },
      ],
    },
  ];

  return (
    <article className="wrap section article">
      <nav className="crumbs" aria-label="Konum">
        <Link href="/">Ana sayfa</Link>
        <span className="crumbs__item"><span aria-hidden="true">/</span><Link href="/rehber">Rehber</Link></span>
      </nav>

      <header className="article__head">
        <p className="eyebrow">{g.category}</p>
        <h1>{g.title}</h1>
        <p className="article__meta">
          <span>{readMinutes(g)} dk okuma</span>
          <span aria-hidden="true">·</span>
          <span>Güncelleme: <time dateTime={g.updated}>{fmtDate(g.updated)}</time></span>
        </p>
      </header>

      <aside className="article__sum" aria-label="Kısaca">
        <h2 className="mini-h">Kısaca</h2>
        <ul>
          {g.summary.map((s, i) => (
            <li key={i}><Inline text={s} /></li>
          ))}
        </ul>
      </aside>

      {toc.length > 2 && (
        <nav className="article__toc" aria-label="İçindekiler">
          <h2 className="mini-h">İçindekiler</h2>
          <ol>
            {toc.map((t) => (
              <li key={t}><a href={`#${headingId(t)}`}>{t}</a></li>
            ))}
          </ol>
        </nav>
      )}

      <GuideBody body={g.body} />

      {g.faq && g.faq.length > 0 && (
        <section className="article__faq">
          <h2 id="sik-sorulan-sorular">Sık sorulan sorular</h2>
          <dl className="faq">
            {g.faq.map((f) => (
              <div key={f.q}>
                <dt>{f.q}</dt>
                <dd><Inline text={f.a} /></dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {related.length > 0 && (
        <section className="article__more">
          <h2>Bunları da oku</h2>
          <ul className="guidegrid">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/rehber/${r.slug}`} className="guidecard">
                  <span className="guidecard__cat">{r.category}</span>
                  <strong>{r.title}</strong>
                  <span>{r.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
    </article>
  );
}
