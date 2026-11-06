import Link from "next/link";
import { adminDb, requireAdmin } from "@/lib/admin";
import { fold, genderLabel } from "@/lib/format";

const ALANLAR: Record<string, string> = {
  nota: "Notası yok",
  yil: "Yılı yok",
  cinsiyet: "Cinsiyeti yok",
  aile: "Koku ailesi yok",
  akor: "Akoru yok",
};
const SAYFA = 30;

type SP = { alan?: string; q?: string; sayfa?: string };

export default async function Eksikler({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const alan = sp.alan && sp.alan in ALANLAR ? sp.alan : "nota";
  const q = fold(String(sp.q ?? "")).slice(0, 60);
  const sayfa = Math.max(1, Math.min(500, parseInt(sp.sayfa ?? "1", 10) || 1));

  let sorgu = adminDb().from("perfumes").select("id,name,brand,year,gender,family", { count: "estimated" });
  if (alan === "nota") sorgu = sorgu.eq("top_notes", "{}").eq("heart_notes", "{}").eq("base_notes", "{}");
  if (alan === "yil") sorgu = sorgu.is("year", null);
  if (alan === "cinsiyet") sorgu = sorgu.is("gender", null);
  if (alan === "aile") sorgu = sorgu.is("family", null);
  if (alan === "akor") sorgu = sorgu.eq("accords", "[]");
  if (q) sorgu = sorgu.like("search_text", `%${q.replace(/[%_]/g, "")}%`);
  const { data, count, error } = await sorgu
    .order("brand")
    .order("name")
    .range((sayfa - 1) * SAYFA, sayfa * SAYFA - 1);
  const rows = data ?? [];
  const href = (o: Partial<SP>) => {
    const p = new URLSearchParams();
    const m = { alan, q: sp.q, sayfa: String(sayfa), ...o };
    for (const [k, v] of Object.entries(m)) if (v) p.set(k, String(v));
    return `/yonetim/eksikler?${p}`;
  };

  return (
    <>
      <h1>Eksikler</h1>
      <p className="adm__hint">Marka ya da parfüm adı yazıp daraltabilirsin. Önce en çok bilinen markaları doldurmak en çok işe yarar.</p>
      <nav className="adm__tabs" aria-label="Eksik alan">
        {Object.entries(ALANLAR).map(([k, v]) => (
          <Link key={k} href={href({ alan: k, sayfa: "1" })} aria-current={k === alan ? "page" : undefined}>
            {v}
          </Link>
        ))}
      </nav>
      <form action="/yonetim/eksikler" className="adm__search">
        <input type="hidden" name="alan" value={alan} />
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Marka veya parfüm ara…" />
        <button type="submit">Ara</button>
      </form>
      {error && <p className="adm__warn">Liste alınamadı.</p>}
      <ul className="adm__list">
        {rows.map((r) => (
          <li key={r.id}>
            <span className="adm__main">
              <b>{r.name}</b>
              <small>
                {r.brand}
                {r.year ? ` · ${r.year}` : ""}
                {genderLabel(r.gender) ? ` · ${genderLabel(r.gender)}` : ""}
              </small>
            </span>
            <span className="adm__acts">
              <Link href={`/yonetim/ekle?id=${r.id}`}>Düzenle</Link>
            </span>
          </li>
        ))}
      </ul>
      {rows.length === 0 && !error && <p className="empty">Bu filtrede kayıt yok.</p>}
      <div className="adm__row">
        {sayfa > 1 && <Link href={href({ sayfa: String(sayfa - 1) })}>← Önceki</Link>}
        {rows.length === SAYFA && <Link href={href({ sayfa: String(sayfa + 1) })}>Sonraki →</Link>}
        {typeof count === "number" && <small>Yaklaşık {count.toLocaleString("tr-TR")} kayıt</small>}
      </div>
    </>
  );
}
