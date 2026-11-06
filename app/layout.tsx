import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import { SITE } from "@/lib/format";
import "./globals.css";

const display = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--f-display", display: "swap" });
const body = Inter({ subsets: ["latin", "latin-ext"], variable: "--f-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  icons: {
    icon: [
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
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

/** Açık temada koyu yazılı, koyu temada (telefon + koyu mod) krem yazılı logo. */
function Logo({ small = false }: { small?: boolean }) {
  return (
    <picture>
      <source
        srcSet="/logo-dark.png"
        media="(prefers-color-scheme: dark) and (hover: none) and (pointer: coarse)"
      />
      <img
        src="/logo-light.png"
        alt="Parfüm Bilgisi"
        width={small ? 138 : 103}
        height={small ? 56 : 42}
        className={small ? "logo__img logo__img--lg" : "logo__img"}
      />
    </picture>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${display.variable} ${body.variable}`}>
      <body>
        <a href="#icerik" className="skip">İçeriğe geç</a>
        <header className="top">
          <div className="wrap top__in">
            <Link href="/" className="logo" aria-label="Parfüm Bilgisi ana sayfa">
              <Logo />
            </Link>
            <nav className="top__nav">
              <Link href="/notalar">Notalar</Link>
              <Link href="/markalar">Markalar</Link>
              <Link href="/ara" className="top__search">Ara</Link>
            </nav>
          </div>
        </header>
        <main id="icerik">{children}</main>
        <footer className="foot">
          <div className="wrap foot__grid">
            <div className="foot__brand">
              <Link href="/" className="logo" aria-label="Parfüm Bilgisi ana sayfa"><Logo small /></Link>
              <p>Sevdiğin kokunun notalarını, akorlarını ve ailesini keşfet. Reklamsız, hızlı, sade.</p>
            </div>
            <nav aria-label="Keşfet">
              <h2 className="foot__h">Keşfet</h2>
              <Link href="/bul">Koku Bulucu</Link>
              <Link href="/notalar">Notalar</Link>
              <Link href="/markalar">Markalar</Link>
              <Link href="/ara">Ara</Link>
            </nav>
            <nav aria-label="Bilgi">
              <h2 className="foot__h">Bilgi</h2>
              <Link href="/kullanim-kosullari">Kullanım Koşulları</Link>
              <a href="mailto:parfumbilgisi@gmail.com">İletişim</a>
            </nav>
          </div>
          <div className="wrap">
            <p className="foot__legal">© {new Date().getFullYear()} Parfüm Bilgisi. Verilerin otomatik toplanması ve yeniden kullanımı yasaktır. Marka adları sahiplerine aittir.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
