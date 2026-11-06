import Link from "next/link";
import Bottle from "./Bottle";
import type { PerfumeCard as P } from "@/lib/data";
import { genderLabel } from "@/lib/format";

export default function PerfumeCard({ p }: { p: P }) {
  const meta = [p.year, genderLabel(p.gender)].filter(Boolean).join(" · ");
  return (
    <Link href={`/parfum/${p.slug}`} className="card">
      <Bottle name={p.name} brand={p.brand} image={p.image} />
      <div className="card__body">
        <span className="card__brand" lang="en">{p.brand}</span>
        <span className="card__name">{p.name}</span>
        {meta && <span className="card__meta">{meta}</span>}
      </div>
    </Link>
  );
}

export function Grid({ items }: { items: P[] }) {
  return (
    <div className="grid">
      {items.map((p) => (
        <PerfumeCard key={p.id} p={p} />
      ))}
    </div>
  );
}
