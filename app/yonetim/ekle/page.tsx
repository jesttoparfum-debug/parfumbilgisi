import { redirect } from "next/navigation";
import { adminDb, requireAdmin, splitList } from "@/lib/admin";
import { GENDERS } from "@/lib/format";

async function kaydet(fd: FormData) {
  "use server";
  await requireAdmin();
  const db = adminDb();
  const payload = {
    id: String(fd.get("id") ?? ""),
    brand: String(fd.get("brand") ?? ""),
    name: String(fd.get("name") ?? ""),
    gender: String(fd.get("gender") ?? ""),
    year: String(fd.get("year") ?? ""),
    season: String(fd.get("season") ?? ""),
    family: String(fd.get("family") ?? ""),
    perfumers: splitList(fd.get("perfumers")),
    top: splitList(fd.get("top")),
    heart: splitList(fd.get("heart")),
    base: splitList(fd.get("base")),
  };
  const { data, error } = await db.rpc("yonetim_kaydet", { p: payload });
  if (error || !data?.ok) {
    const msg = encodeURIComponent(data?.hata ?? "Kaydedilemedi");
    const back = payload.id ? `id=${payload.id}` : "";
    redirect(`/yonetim/ekle?${back}&hata=${msg}`);
  }
  const aday = Number(fd.get("aday"));
  if (aday) await db.from("candidates").update({ status: "onaylandi" }).eq("id", aday);
  const miss = String(fd.get("miss") ?? "");
  if (miss) await db.from("search_misses").update({ durum: "eklendi" }).eq("q_norm", miss);
  redirect(`/yonetim/ekle?kaydedildi=${encodeURIComponent(data.slug)}`);
}

type SP = { id?: string; ad?: string; miss?: string; aday?: string; hata?: string; kaydedildi?: string };

export default async function Ekle({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const db = adminDb();

  type Init = {
    id?: number; brand: string; name: string; gender: string; year: string; season: string; family: string;
    perfumers: string; top: string; heart: string; base: string;
  };
  let init: Init = { brand: "", name: sp.ad ?? "", gender: "", year: "", season: "", family: "", perfumers: "", top: "", heart: "", base: "" };
  let adayId = "";

  if (sp.id && /^\d+$/.test(sp.id)) {
    const { data } = await db.from("perfumes").select("*").eq("id", sp.id).maybeSingle();
    if (data) {
      init = {
        id: data.id, brand: data.brand, name: data.name, gender: data.gender ?? "", year: data.year ? String(data.year) : "",
        season: data.season ?? "", family: data.family ?? "", perfumers: (data.perfumers ?? []).join(", "),
        top: (data.top_notes ?? []).join(", "), heart: (data.heart_notes ?? []).join(", "), base: (data.base_notes ?? []).join(", "),
      };
    }
  } else if (sp.aday && /^\d+$/.test(sp.aday)) {
    const { data } = await db.from("candidates").select("*").eq("id", sp.aday).maybeSingle();
    if (data) {
      adayId = String(data.id);
      init = { ...init, brand: data.brand ?? "", name: data.name, year: data.year ? String(data.year) : "", perfumers: (data.perfumers ?? []).join(", ") };
    }
  }

  const { data: fam } = await db.from("families_mv").select("name").order("perfume_count", { ascending: false }).limit(40);

  return (
    <>
      <h1>{init.id ? "Parfümü düzenle" : "Parfüm ekle"}</h1>
      {sp.kaydedildi && (
        <p className="adm__ok">
          Kaydedildi. <a href={`/parfum/${sp.kaydedildi}`}>Sayfayı gör →</a>
        </p>
      )}
      {sp.hata && <p className="adm__warn">{sp.hata}</p>}
      <p className="adm__hint">Notaları virgülle ayırarak yaz (örn. Bergamot, Limon, Mandalina). Kendi bilginle ya da marka sayfasından doldur; başka sitelerden metin, akor yüzdesi ya da fotoğraf kopyalama.</p>
      <form action={kaydet} className="adm__form">
        <input type="hidden" name="id" value={init.id ?? ""} />
        <input type="hidden" name="aday" value={adayId} />
        <input type="hidden" name="miss" value={sp.miss ?? ""} />
        <label>Marka *<input name="brand" defaultValue={init.brand} required maxLength={80} /></label>
        <label>Parfüm adı *<input name="name" defaultValue={init.name} required maxLength={120} /></label>
        <div className="adm__2">
          <label>Çıkış yılı<input name="year" defaultValue={init.year} inputMode="numeric" pattern="[0-9]{4}" placeholder="2019" /></label>
          <label>
            Cinsiyet
            <select name="gender" defaultValue={init.gender}>
              <option value="">Bilinmiyor</option>
              {Object.entries(GENDERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>
        <label>Parfümör(ler)<input name="perfumers" defaultValue={init.perfumers} placeholder="virgülle ayır" /></label>
        <label>Üst notalar<textarea name="top" rows={2} defaultValue={init.top} /></label>
        <label>Orta notalar<textarea name="heart" rows={2} defaultValue={init.heart} /></label>
        <label>Alt notalar<textarea name="base" rows={2} defaultValue={init.base} /></label>
        <div className="adm__2">
          <label>
            Koku ailesi
            <input name="family" list="aileler" defaultValue={init.family} />
            <datalist id="aileler">{(fam ?? []).map((f) => <option key={f.name} value={f.name} />)}</datalist>
          </label>
          <label>Mevsim<input name="season" defaultValue={init.season} placeholder="İlkbahar, Yaz" /></label>
        </div>
        <button type="submit">Kaydet</button>
      </form>
    </>
  );
}
