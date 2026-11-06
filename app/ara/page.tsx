import type { Metadata } from "next";
import SearchForm from "@/components/SearchForm";
import { Grid } from "@/components/PerfumeCard";
import Pager, { readPage } from "@/components/Pager";
import Link from "next/link";
import { after } from "next/server";
import { logMiss, matchingBrands, searchPerfumes } from "@/lib/data";
import { GENDERS, nf } from "@/lib/format";

export const metadata: Metadata = {
  title: "Parfüm ara",
  robots: { index: false, follow: true }, // arama sonuç sayfaları Google'a girmez
};

type Props = { searchParams: Promise<{ q?: string; cinsiyet?: string; sayfa?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 80);
  const gender = sp.cinsiyet && sp.cinsiyet in GENDERS ? sp.cinsiyet : null;
  const page = readPage(sp.sayfa, 40);

  let result: Awaited<ReturnType<typeof searchPerfumes>> | null = null;
  try {
    result = await searchPerfumes(q, gender, page);
  } catch (e) {
    console.error("arama hatasi", e);
  }
  const brands = q && page === 1 ? await matchingBrands(q).catch(() => []) : [];
  const items = result?.items ?? [];
  const hasNext = result?.hasNext ?? false;
  // Sonuç çıkmayan gerçek aramaları (ilk sayfa, sunucu hatası değil) yönetim listesine yaz
  if (result !== null && q.length >= 3 && page === 1 && items.length === 0 && brands.length === 0) {
    after(() => logMiss(q));
  }
  const params: Record<string, string> = {};
  if (q) params.q = q;
  if (gender) params.cinsiyet = gender;

  return (
    <div className="wrap section">
      <header className="page-head">
        <h1>{q ? <>“{q}” için sonuçlar</> : "Parfüm ara"}</h1>
      </header>
      <SearchForm q={q} gender={gender ?? ""} />
      {brands.length > 0 && (
        <section className="brandhit" aria-label="Eşleşen markalar">
          <h2 className="mini-h">Markalar</h2>
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
      )}
      {result === null ? (
        <p className="empty">Arama şu an yapılamadı. Birkaç saniye sonra tekrar dene.</p>
      ) : items.length === 0 ? (
        <div className="empty">
          <p>“{q}” için sonuç bulunamadı. Daha kısa bir kelime ya da sadece marka adı dene.</p>
          <p>
            Ne aradığından emin değil misin? <Link href="/bul">Koku Bulucu</Link> ile sevdiğin notalardan
            parfüm bulabilirsin.
          </p>
        </div>
      ) : (
        <>
          <Grid items={items} />
          <Pager base="/ara" page={page} hasNext={hasNext} params={params} />
        </>
      )}
    </div>
  );
}
