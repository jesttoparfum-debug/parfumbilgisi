import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Bottle from "@/components/Bottle";
import { Grid } from "@/components/PerfumeCard";
import { getPerfume, getSameBrand, getSimilar } from "@/lib/data";
import { accordColor } from "@/lib/accords";
import { describe, metaDescription } from "@/lib/describe";
import { genderLabel, imageUrl, jsonLd, SITE, slugify } from "@/lib/format";

// Sayfalar ilk ziyarette üretilip 1 gün cache'lenir (ISR); build'de 200 bin sayfa üretilmez.
export const revalidate = 86400;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

const fullName = (p: { brand: string; name: string }) => `${p.brand} ${p.name}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPerfume(slug);
  if (!p) return { title: "Parfüm bulunamadı", robots: { index: false } };

  const title = `${fullName(p)}${p.year ? ` (${p.year})` : ""} notaları ve akorları`;
  const description = metaDescription(p);
  const img = imageUrl(p.image);

  return {
    title,
    description,
    alternates: { canonical: `/parfum/${p.slug}` },
    // Bilgisi az olan sayfalar sitede durur ama Google'a gösterilmez.
    robots: p.indexable ? undefined : { index: false, follow: true },
    openGraph: { title, description, url: `/parfum/${p.slug}`, type: "article", images: img ? [img] : undefined },
  };
}

function NoteList({ notes }: { notes: string[] }) {
  return (
    <ul>
      {notes.map((n) => {
        const s = slugify(n);
        return <li key={n}>{s ? <Link href={`/nota/${s}`}>{n}</Link> : n}</li>;
      })}
    </ul>
  );
}

export default async function PerfumePage({ params }: Props) {
  const { slug } = await params;
  const p = await getPerfume(slug);
  if (!p) notFound();

  const [others, similar] = await Promise.all([getSameBrand(p.brand_slug, p.slug), getSimilar(p)]);
  const tiers = (
    [
      ["Üst notalar", "İlk izlenim, ilk 15-30 dakika", p.top_notes],
      ["Orta notalar", "Kokunun kalbi, birkaç saat", p.heart_notes],
      ["Alt notalar", "Kalıcı iz, gün boyu", p.base_notes],
    ] as [string, string, string[]][]
  ).filter(([, , l]) => l.length > 0);
  const accords = [...p.accords]
    .filter((a) => a && typeof a.name === "string")
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, 10);

  const facts: [string, React.ReactNode][] = [];
  if (p.family) facts.push(["Koku ailesi", p.family_slug ? <Link href={`/aile/${p.family_slug}`}>{p.family}</Link> : p.family]);
  if (genderLabel(p.gender)) facts.push(["Cinsiyet", genderLabel(p.gender)]);
  if (p.season) facts.push(["Mevsim", p.season]);
  if (p.year) facts.push(["Çıkış yılı", String(p.year)]);

  const about = describe(p);
  const img = imageUrl(p.image);
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: fullName(p),
      brand: { "@type": "Brand", name: p.brand },
      category: "Parfüm",
      description: about.join(" "),
      url: `${SITE.url}/parfum/${p.slug}`,
      ...(img && { image: img }),
      ...(p.year && { releaseDate: String(p.year) }),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ana sayfa", item: SITE.url },
        { "@type": "ListItem", position: 2, name: p.brand, item: `${SITE.url}/marka/${p.brand_slug}` },
        { "@type": "ListItem", position: 3, name: p.name, item: `${SITE.url}/parfum/${p.slug}` },
      ],
    },
  ];

  return (
    <article className="wrap perfume">
      <nav className="crumbs" aria-label="Konum">
        <Link href="/">Ana sayfa</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/marka/${p.brand_slug}`} lang="en">{p.brand}</Link>
      </nav>

      <div className="perfume__top">
        <Bottle name={p.name} brand={p.brand} image={p.image} family={p.family} slug={p.slug} size="hero" priority />
        <div className="perfume__intro">
          <Link href={`/marka/${p.brand_slug}`} className="perfume__brand" lang="en">
            {p.brand}
          </Link>
          <h1>{p.name}</h1>
          {facts.length > 0 && (
            <dl className="facts">
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {p.perfumers.length > 0 && (
            <p className="perfumers">
              <span>{p.perfumers.length > 1 ? "Parfümörler" : "Parfümör"}</span>
              {p.perfumers.map((n, i) => {
                const s = slugify(n);
                return (
                  <span className="perfumers__name" key={n}>
                    {s ? <Link href={`/parfumor/${s}`}>{n}</Link> : n}
                    {i < p.perfumers.length - 1 ? "," : ""}
                  </span>
                );
              })}
            </p>
          )}
          {accords.length > 0 && (
            <section aria-label="Ana akorlar">
              <h2 className="mini-h">Ana akorlar</h2>
              <ul className="accords">
                {accords.map((a) => {
                  const v = Math.max(0, Math.min(100, a.value ?? 0));
                  return (
                    <li
                      key={a.name}
                      style={{ ["--w" as string]: `${Math.max(4, v)}%`, ["--c" as string]: accordColor(a.name) }}
                    >
                      <span className="acc__top">
                        <span className="acc__name">{a.name}</span>
                        <b className="acc__pct">{Math.round(v)}%</b>
                      </span>
                      <span className="acc__bar" aria-hidden="true"><i /></span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </div>

      <section className="block">
        <h2>Hakkında</h2>
        <p className="prose">{about.join(" ")}</p>
      </section>

      {tiers.length > 0 && (
        <section className="block">
          <h2>Koku piramidi</h2>
          <div className="pyramid">
            {tiers.map(([title, hint, list]) => (
              <div className="tier" key={title}>
                <h3>
                  {title} <small>{hint}</small>
                </h3>
                <NoteList notes={list} />
              </div>
            ))}
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section className="block">
          <div className="section__head">
            <h2>Benzer kokular</h2>
          </div>
          <Grid items={similar} />
        </section>
      )}

      {others.length > 0 && (
        <section className="block">
          <div className="section__head">
            <h2>
              <span lang="en">{p.brand}</span> markasından
            </h2>
            <Link href={`/marka/${p.brand_slug}`}>Tümü →</Link>
          </div>
          <Grid items={others} />
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
    </article>
  );
}
