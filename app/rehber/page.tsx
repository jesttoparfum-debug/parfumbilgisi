import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES, readMinutes } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Parfüm rehberi: EDP, EDT, notalar ve daha fazlası",
  description:
    "Parfüm nedir, EDP ile EDT arasındaki fark ne, koku piramidi nasıl okunur? Parfümü anlamak için sade ve özgün Türkçe rehber yazıları.",
  alternates: { canonical: "/rehber" },
};

export default function GuideIndex() {
  return (
    <div className="wrap section">
      <header className="page-head">
        <p className="eyebrow">Rehber</p>
        <h1>Parfümü anlamak için rehber</h1>
        <p className="lead">
          EDP mi EDT mi? Notalar ne anlama gelir? Parfüm nasıl sürülür, nasıl saklanır? Merak ettiklerini sade bir
          dille anlattık.
        </p>
      </header>
      <ul className="guidegrid">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link href={`/rehber/${g.slug}`} className="guidecard">
              <span className="guidecard__cat">{g.category} · {readMinutes(g)} dk</span>
              <strong>{g.title}</strong>
              <span>{g.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
