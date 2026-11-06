import Link from "next/link";
import { Grid } from "./PerfumeCard";
import Pager from "./Pager";
import type { PerfumeCard } from "@/lib/data";
import { jsonLd, nf, SITE } from "@/lib/format";

/** Marka, nota ve koku ailesi sayfalarının ortak iskeleti. */
export default function HubPage({
  eyebrow,
  title,
  count,
  intro,
  crumbs,
  items,
  base,
  page,
  maxPage,
}: {
  eyebrow: string;
  title: string;
  count: number;
  intro?: string;
  crumbs: [string, string][];
  items: PerfumeCard[];
  base: string;
  page: number;
  maxPage: number;
}) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana sayfa", item: SITE.url },
      ...crumbs.map(([href, label], i) => ({ "@type": "ListItem", position: i + 2, name: label, item: `${SITE.url}${href}` })),
      { "@type": "ListItem", position: crumbs.length + 2, name: title, item: `${SITE.url}${base}` },
    ],
  };
  return (
    <div className="wrap section">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <nav className="crumbs" aria-label="Konum">
        <Link href="/">Ana sayfa</Link>
        {crumbs.map(([href, label]) => (
          <span key={href} className="crumbs__item">
            <span aria-hidden="true">/</span>
            <Link href={href}>{label}</Link>
          </span>
        ))}
      </nav>
      <header className="page-head">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lead">{intro ?? `${nf.format(count)} parfüm`}</p>
      </header>
      <Grid items={items} />
      <Pager base={base} page={page} hasNext={page < maxPage} />
    </div>
  );
}
