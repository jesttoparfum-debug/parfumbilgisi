import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Yönetim",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function YonetimLayout({ children }: { children: React.ReactNode }) {
  const ok = await isAdmin();
  return (
    <div className="wrap section adm">
      {ok && (
        <nav className="adm__nav" aria-label="Yönetim">
          <Link href="/yonetim">Özet</Link>
          <Link href="/yonetim/aranmayanlar">Aranıp bulunamayanlar</Link>
          <Link href="/yonetim/eksikler">Eksikler</Link>
          <Link href="/yonetim/adaylar">Onay bekleyenler</Link>
          <Link href="/yonetim/ekle">+ Parfüm ekle</Link>
        </nav>
      )}
      {children}
    </div>
  );
}
