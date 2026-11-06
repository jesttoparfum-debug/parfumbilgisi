import type { Metadata } from "next";
import { Grid } from "@/components/PerfumeCard";
import Pager, { readPage } from "@/components/Pager";
import { bulPerfumes, getFamilies, getNotesBySlugs, getTopNotes, type Bul } from "@/lib/data";
import { GENDERS, slugify } from "@/lib/format";

export const revalidate = 3600;

const SEASONS = ["İlkbahar", "Yaz", "Sonbahar", "Kış"];

type SP = Record<string, string | string[] | undefined>;
type Props = { searchParams: Promise<SP> };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v ?? "").trim().slice(0, 60);

function readFilters(sp: SP) {
  const inc = ["n1", "n2", "n3"].map((k) => one(sp[k])).filter(Boolean);
  const exc = ["x1", "x2"].map((k) => one(sp[k])).filter(Boolean);
  const g = one(sp.cinsiyet);
  const fam = one(sp.aile);
  const se = one(sp.mevsim);
  return {
    raw: { inc, exc, g, fam, se },
    filter: {
      include: [...new Set(inc.map(slugify).filter(Boolean))],
      exclude: [...new Set(exc.map(slugify).filter(Boolean))],
      gender: g in GENDERS ? g : null,
      family: /^[a-z0-9-]{1,80}$/.test(fam) ? fam : null,
      season: SEASONS.includes(se) ? se : null,
    } as Bul,
  };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const hasQuery = Object.keys(sp).length > 0;
  return {
    title: "Koku Bulucu: notaya, mevsime ve cinsiyete göre parfüm bul",
    description:
      "Sevdiğin notaları seç, sevmediklerini çıkar; mevsim, cinsiyet ve koku ailesine göre sana uygun parfümleri anında bul.",
    alternates: { canonical: "/bul" },
    robots: hasQuery ? { index: false, follow: true } : undefined,
  };
}

export default async function Finder({ searchParams }: Props) {
  const sp = await searchParams;
  const { raw, filter } = readFilters(sp);
  const page = readPage(sp.sayfa as string | undefined, 20);
  const active =
    filter.include.length + filter.exclude.length > 0 || filter.gender || filter.family || filter.season;

  const [notes, families, known] = await Promise.all([
    getTopNotes(500, 20),
    getFamilies(),
    getNotesBySlugs([...filter.include, ...filter.exclude]),
  ]);
  const knownSlugs = new Set(known.map((n) => n.slug));
  const unknown = [...raw.inc, ...raw.exc].filter((n) => !knownSlugs.has(slugify(n)));
  const nameOf = (s: string) => known.find((n) => n.slug === s)?.name ?? s;

  let result: Awaited<ReturnType<typeof bulPerfumes>> | null = null;
  if (active) {
    try {
      result = await bulPerfumes(filter, page);
    } catch (e) {
      console.error("bulucu hatasi", e);
    }
  }

  const params: Record<string, string> = {};
  for (const k of ["n1", "n2", "n3", "x1", "x2", "cinsiyet", "aile", "mevsim"]) {
    const v = one(sp[k]);
    if (v) params[k] = v;
  }

  const summary = [
    filter.include.length ? `${filter.include.map(nameOf).join(" + ")} içeren` : "",
    filter.exclude.length ? `${filter.exclude.map(nameOf).join(", ")} içermeyen` : "",
    filter.season ? `${filter.season.toLocaleLowerCase("tr-TR")} için` : "",
    filter.gender ? `${GENDERS[filter.gender].toLocaleLowerCase("tr-TR")}` : "",
    filter.family ? families.find((f) => f.slug === filter.family)?.name.toLocaleLowerCase("tr-TR") ?? "" : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="wrap section">
      <header className="page-head">
        <p className="eyebrow">Koku Bulucu</p>
        <h1>Sana uygun kokuyu bul</h1>
        <p className="lead">Sevdiğin notaları yaz, sevmediklerini çıkar. Notanın en yoğun olduğu parfümler en üstte gelir.</p>
      </header>

      <form action="/bul" method="get" className="finder">
        <datalist id="notalar">
          {notes.map((n) => (
            <option key={n.slug} value={n.name} />
          ))}
        </datalist>

        <fieldset>
          <legend>İstediğin notalar</legend>
          <div className="finder__row">
            {["n1", "n2", "n3"].map((k, i) => (
              <input key={k} name={k} list="notalar" defaultValue={one(sp[k])} maxLength={60}
                placeholder={["örn. Vanilya", "örn. Tonka", "örn. Gül"][i]} aria-label={`İstenen nota ${i + 1}`} autoComplete="off" />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>İstemediğin notalar</legend>
          <div className="finder__row">
            {["x1", "x2"].map((k, i) => (
              <input key={k} name={k} list="notalar" defaultValue={one(sp[k])} maxLength={60}
                placeholder={["örn. Oud", "örn. Paçuli"][i]} aria-label={`İstenmeyen nota ${i + 1}`} autoComplete="off" />
            ))}
          </div>
        </fieldset>

        <div className="finder__row finder__selects">
          <label>
            <span>Mevsim</span>
            <select name="mevsim" defaultValue={filter.season ?? ""}>
              <option value="">Fark etmez</option>
              {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>
            <span>Cinsiyet</span>
            <select name="cinsiyet" defaultValue={filter.gender ?? ""}>
              <option value="">Fark etmez</option>
              {Object.entries(GENDERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>
            <span>Koku ailesi</span>
            <select name="aile" defaultValue={filter.family ?? ""}>
              <option value="">Fark etmez</option>
              {families.slice(0, 60).map((f) => <option key={f.slug} value={f.slug}>{f.name}</option>)}
            </select>
          </label>
        </div>

        <div className="finder__actions">
          <button type="submit">Parfümleri bul</button>
          {active && <a href="/bul" className="finder__reset">Temizle</a>}
        </div>
      </form>

      {unknown.length > 0 && (
        <p className="empty">
          Şu notaları tanımadık: <strong>{unknown.join(", ")}</strong>. Yazarken çıkan önerilerden seçmeyi dene.
        </p>
      )}

      {active && (
        <section className="block">
          {result === null ? (
            <p className="empty">Arama şu an yapılamadı. Birkaç saniye sonra tekrar dene.</p>
          ) : result.items.length === 0 ? (
            <p className="empty">Bu seçimlere uyan parfüm bulunamadı. Bir filtreyi kaldırmayı dene.</p>
          ) : (
            <>
              {summary && <h2 className="finder__summary">{summary.charAt(0).toLocaleUpperCase("tr-TR") + summary.slice(1)} parfümler</h2>}
              <Grid items={result.items} />
              <Pager base="/bul" page={page} hasNext={result.hasNext && page < 20} params={params} />
            </>
          )}
        </section>
      )}
    </div>
  );
}
