import Link from "next/link";
import { revalidatePath } from "next/cache";
import { adminDb, requireAdmin } from "@/lib/admin";

async function reddet(fd: FormData) {
  "use server";
  await requireAdmin();
  await adminDb().from("candidates").update({ status: "reddedildi" }).eq("id", Number(fd.get("id")));
  revalidatePath("/yonetim/adaylar");
}

export default async function Adaylar() {
  await requireAdmin();
  const { data } = await adminDb()
    .from("candidates")
    .select("id,source,source_url,license,name,brand,year,perfumers")
    .eq("status", "bekliyor")
    .order("id")
    .limit(100);
  const rows = data ?? [];
  return (
    <>
      <h1>Onay bekleyenler</h1>
      <p className="adm__hint">
        Robotun açık kaynaklardan bulduğu parfümler. &quot;İncele&quot; ile formu açıp eksikleri tamamla ve kaydet; sitede ancak o zaman görünür.
      </p>
      {rows.length === 0 ? (
        <p className="empty">Bekleyen aday yok. Robot çalıştıkça burada birikir.</p>
      ) : (
        <ul className="adm__list">
          {rows.map((r) => (
            <li key={r.id}>
              <span className="adm__main">
                <b>{r.name}</b>
                <small>
                  {r.brand ?? "Marka yok"}
                  {r.year ? ` · ${r.year}` : ""}
                  {r.perfumers?.length ? ` · ${r.perfumers.join(", ")}` : ""}
                  {" · "}
                  {r.source_url ? <a href={r.source_url} rel="noreferrer noopener" target="_blank">{r.source}</a> : r.source}
                  {r.license ? ` (${r.license})` : ""}
                </small>
              </span>
              <span className="adm__acts">
                <Link href={`/yonetim/ekle?aday=${r.id}`}>İncele</Link>
                <form action={reddet}>
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className="adm__ghost">Reddet</button>
                </form>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
