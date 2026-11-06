import Link from "next/link";
import { revalidatePath } from "next/cache";
import { adminDb, requireAdmin } from "@/lib/admin";

async function yoksay(fd: FormData) {
  "use server";
  await requireAdmin();
  await adminDb().from("search_misses").update({ durum: "yoksay" }).eq("q_norm", String(fd.get("q")));
  revalidatePath("/yonetim/aranmayanlar");
}

export default async function Aranmayanlar() {
  await requireAdmin();
  const { data } = await adminDb()
    .from("search_misses")
    .select("q_norm,q_raw,hits,last_at")
    .eq("durum", "bekliyor")
    .order("hits", { ascending: false })
    .order("last_at", { ascending: false })
    .limit(100);
  const rows = data ?? [];
  return (
    <>
      <h1>Aranıp bulunamayanlar</h1>
      <p className="adm__hint">
        Ziyaretçilerin aradığı ama sonuç bulamadığı kelimeler, en çok aranandan başlayarak. Gerçek bir parfümse &quot;Ekle&quot;,
        anlamsızsa &quot;Yoksay&quot;.
      </p>
      {rows.length === 0 ? (
        <p className="empty">Henüz kayıt yok. Arama yapılıp sonuç çıkmayınca burada birikir.</p>
      ) : (
        <ul className="adm__list">
          {rows.map((r) => (
            <li key={r.q_norm}>
              <span className="adm__main">
                <b>{r.q_raw}</b>
                <small>{r.hits} kez arandı</small>
              </span>
              <span className="adm__acts">
                <Link href={`/yonetim/ekle?ad=${encodeURIComponent(r.q_raw)}&miss=${encodeURIComponent(r.q_norm)}`}>Ekle</Link>
                <form action={yoksay}>
                  <input type="hidden" name="q" value={r.q_norm} />
                  <button type="submit" className="adm__ghost">Yoksay</button>
                </form>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
