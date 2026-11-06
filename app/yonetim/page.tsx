import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminDb, COOKIE, requireAdmin } from "@/lib/admin";
import { nf } from "@/lib/format";

async function cikis() {
  "use server";
  (await cookies()).delete({ name: COOKIE, path: "/yonetim" });
  redirect("/yonetim/giris");
}

async function yenile() {
  "use server";
  await requireAdmin();
  await adminDb().rpc("yonetim_yenile");
  redirect("/yonetim?yenilendi=1");
}

const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;

export default async function Ozet({ searchParams }: { searchParams: Promise<{ yenilendi?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const db = adminDb();
  const [adaylar, kayip, notaYok] = await Promise.all([
    count(db.from("candidates").select("id", { count: "exact", head: true }).eq("status", "bekliyor")),
    count(db.from("search_misses").select("q_norm", { count: "exact", head: true }).eq("durum", "bekliyor")),
    count(
      db
        .from("perfumes")
        .select("id", { count: "estimated", head: true })
        .eq("top_notes", "{}")
        .eq("heart_notes", "{}")
        .eq("base_notes", "{}"),
    ),
  ]);
  return (
    <>
      <h1>Yönetim</h1>
      {sp.yenilendi && <p className="adm__ok">Marka, nota ve aile sayıları yenilendi.</p>}
      <ul className="adm__cards">
        <li>
          <Link href="/yonetim/adaylar">
            <b>{nf.format(adaylar)}</b>
            <span>Onay bekleyen aday</span>
          </Link>
        </li>
        <li>
          <Link href="/yonetim/aranmayanlar">
            <b>{nf.format(kayip)}</b>
            <span>Aranıp bulunamayan kelime</span>
          </Link>
        </li>
        <li>
          <Link href="/yonetim/eksikler?alan=nota">
            <b>~{nf.format(notaYok)}</b>
            <span>Notası olmayan parfüm</span>
          </Link>
        </li>
      </ul>
      <div className="adm__row">
        <form action={yenile}>
          <button type="submit">Sayıları yenile</button>
        </form>
        <form action={cikis}>
          <button type="submit" className="adm__ghost">Çıkış</button>
        </form>
      </div>
      <p className="adm__hint">
        &quot;Sayıları yenile&quot;: çok parfüm ekledikten sonra ana sayfadaki marka/nota sayılarını günceller (birkaç saniye sürer).
      </p>
    </>
  );
}
