import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import { SITE } from "@/lib/format";
import "./globals.css";

const display = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--f-display", display: "swap" });
const body = Inter({ subsets: ["latin", "latin-ext"], variable: "--f-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — Parfüm notaları ve ansiklopedisi`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  openGraph: { siteName: SITE.name, locale: "tr_TR", type: "website" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark) and (hover: none) and (pointer: coarse)", color: "#16130f" },
    { color: "#f7f3ec" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${display.variable} ${body.variable}`}>
      <body>
        <a href="#icerik" className="skip">İçeriğe geç</a>
        <header className="top">
          <div className="wrap top__in">
            <Link href="/" className="logo" aria-label="Parfüm Bilgisi ana sayfa">
              parfüm<em>bilgisi</em>
            </Link>
            <nav className="top__nav">
              <Link href="/bul">Bulucu</Link>
              <Link href="/notalar">Notalar</Link>
              <Link href="/markalar">Markalar</Link>
              <Link href="/ara">Ara</Link>
            </nav>
          </div>
        </header>
        <main id="icerik">{children}</main>
        <footer className="foot">
          <div className="wrap foot__in">
            <span className="logo logo--sm">parfüm<em>bilgisi</em></span>
            <nav className="foot__nav" aria-label="Alt menü">
              <Link href="/bul">Koku Bulucu</Link>
              <Link href="/notalar">Notalar</Link>
              <Link href="/markalar">Markalar</Link>
              <Link href="/kullanim-kosullari">Kullanım Koşulları</Link>
            </nav>
            <p>© {new Date().getFullYear()} Parfüm Bilgisi. Verilerin otomatik toplanması ve yeniden kullanımı yasaktır. Marka adları sahiplerine aittir.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
