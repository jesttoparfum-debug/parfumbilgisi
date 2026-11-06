import Link from "next/link";
import { Grid } from "./PerfumeCard";
import Pager from "./Pager";
import type { PerfumeCard } from "@/lib/data";
import { nf } from "@/lib/format";

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
  return (
    <div className="wrap section">
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
