import type { Metadata } from "next";
import SearchForm from "@/components/SearchForm";
import { Grid } from "@/components/PerfumeCard";
import Pager, { readPage } from "@/components/Pager";
import { searchPerfumes } from "@/lib/data";
import { GENDERS } from "@/lib/format";

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

  const { items, hasNext } = await searchPerfumes(q, gender, page);
  const params: Record<string, string> = {};
  if (q) params.q = q;
  if (gender) params.cinsiyet = gender;

  return (
    <div className="wrap section">
      <header className="page-head">
        <h1>{q ? <>“{q}” için sonuçlar</> : "Parfüm ara"}</h1>
      </header>
      <SearchForm q={q} gender={gender ?? ""} />
      {items.length === 0 ? (
        <p className="empty">
          Sonuç bulunamadı. Daha kısa bir kelime ya da sadece marka adı dene.
        </p>
      ) : (
        <>
          <Grid items={items} />
          <Pager base="/ara" page={page} hasNext={hasNext} params={params} />
        </>
      )}
    </div>
  );
}
