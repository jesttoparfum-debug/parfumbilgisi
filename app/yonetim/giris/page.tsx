import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkPassword, COOKIE } from "@/lib/admin";

async function giris(fd: FormData) {
  "use server";
  const t = checkPassword(String(fd.get("sifre") ?? ""));
  if (!t) {
    await new Promise((r) => setTimeout(r, 1200)); // deneme-yanılmayı yavaşlat
    redirect("/yonetim/giris?hata=1");
  }
  (await cookies()).set(COOKIE, t, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/yonetim",
    maxAge: 60 * 60 * 24 * 14,
  });
  redirect("/yonetim");
}

export default async function Giris({ searchParams }: { searchParams: Promise<{ hata?: string }> }) {
  const sp = await searchParams;
  const kurulu = !!process.env.YONETIM_SIFRE && !!process.env.SUPABASE_SERVICE_KEY;
  return (
    <div className="adm__box">
      <h1>Yönetim girişi</h1>
      {!kurulu && (
        <p className="adm__warn">
          Henüz kurulmamış: Vercel&apos;de YONETIM_SIFRE (en az 8 karakter) ve SUPABASE_SERVICE_KEY ortam değişkenleri eklenmeli.
        </p>
      )}
      {sp.hata && <p className="adm__warn">Şifre yanlış.</p>}
      <form action={giris} className="adm__form">
        <label>
          Şifre
          <input type="password" name="sifre" autoComplete="current-password" required />
        </label>
        <button type="submit">Giriş</button>
      </form>
    </div>
  );
}
