import { hueOf, imageUrl, initials } from "@/lib/format";

/*
 * Görsel varsa kendi depomuzdan gösterir.
 * Yoksa tamamen bize ait bir şişe illüstrasyonu çizer:
 *  - Renk koku ailesinden gelir (amber = sıcak altın, ferah = açık mavi, odunsu = toprak...)
 *  - Şişe biçimi parfüme göre değişir (5 farklı silüet), sayfalar tekdüze görünmez.
 */

type Tone = { h: number; s: number; l: number };

// Koku ailesindeki anahtar kelime -> renk tonu (ilk eşleşen kazanır)
const PALETTE: [RegExp, Tone][] = [
  [/amber|kehribar|oryantal|reçine|recine/, { h: 34, s: 62, l: 52 }],
  [/gourmand|gurme|tatlı|tatli|vanil|karamel/, { h: 24, s: 55, l: 54 }],
  [/deri|leather|tütün|tutun|tobacco/, { h: 18, s: 38, l: 38 }],
  [/odun|woody|sedir|oud|sandal/, { h: 28, s: 32, l: 40 }],
  [/baharat|spicy/, { h: 10, s: 55, l: 46 }],
  [/çiçek|cicek|floral|gül|gul|beyaz çiçek/, { h: 338, s: 45, l: 60 }],
  [/meyve|fruity/, { h: 352, s: 58, l: 58 }],
  [/narenciye|citrus|hesperid/, { h: 46, s: 75, l: 52 }],
  [/sucul|aquatic|deniz|marine|ozon/, { h: 196, s: 55, l: 52 }],
  [/ferah|fresh|taze/, { h: 186, s: 42, l: 54 }],
  [/yeşil|yesil|green|aromatik|fougère|fougere/, { h: 128, s: 28, l: 44 }],
  [/chypre|şipr|sipr|yosun/, { h: 82, s: 26, l: 40 }],
  [/pudra|powder|misk|musk/, { h: 300, s: 18, l: 64 }],
];

function toneFor(family: string | null, fallbackKey: string): Tone {
  const f = (family ?? "").toLocaleLowerCase("tr-TR");
  for (const [re, t] of PALETTE) if (re.test(f)) return t;
  return { h: hueOf(fallbackKey), s: 22, l: 52 }; // ailesi bilinmeyen: sakin, düşük doygunluk
}

function shapeOf(key: string) {
  return hueOf(key + "#") % 5;
}

/** 120x160 alanda 5 farklı şişe silüeti */
function Silhouette({ shape }: { shape: number }) {
  switch (shape) {
    case 0: // klasik dikdörtgen
      return (
        <>
          <rect x="49" y="10" width="22" height="20" rx="3" className="b-cap" />
          <rect x="55" y="30" width="10" height="8" className="b-neck" />
          <rect x="24" y="38" width="72" height="110" rx="10" className="b-body" />
          <rect x="32" y="48" width="8" height="88" rx="4" className="b-shine" />
        </>
      );
    case 1: // yuvarlak flakon
      return (
        <>
          <rect x="50" y="14" width="20" height="18" rx="9" className="b-cap" />
          <rect x="55" y="32" width="10" height="10" className="b-neck" />
          <circle cx="60" cy="98" r="50" className="b-body" />
          <ellipse cx="40" cy="86" rx="7" ry="22" className="b-shine" />
        </>
      );
    case 2: // ince uzun
      return (
        <>
          <rect x="52" y="6" width="16" height="26" rx="2" className="b-cap" />
          <rect x="56" y="32" width="8" height="8" className="b-neck" />
          <rect x="36" y="40" width="48" height="112" rx="6" className="b-body" />
          <rect x="42" y="50" width="6" height="92" rx="3" className="b-shine" />
        </>
      );
    case 3: // yamuk (aşağı genişleyen)
      return (
        <>
          <rect x="48" y="12" width="24" height="16" rx="8" className="b-cap" />
          <rect x="55" y="28" width="10" height="10" className="b-neck" />
          <path d="M40 38 H80 L98 146 Q98 152 92 152 H28 Q22 152 22 146 Z" className="b-body" />
          <path d="M44 48 L36 140" className="b-shine-line" />
        </>
      );
    default: // kare, kalın kapak
      return (
        <>
          <rect x="40" y="10" width="40" height="26" rx="4" className="b-cap" />
          <rect x="54" y="36" width="12" height="8" className="b-neck" />
          <rect x="18" y="44" width="84" height="104" rx="16" className="b-body" />
          <rect x="27" y="54" width="9" height="82" rx="4.5" className="b-shine" />
        </>
      );
  }
}

export default function Bottle({
  name,
  brand,
  image,
  family = null,
  slug = "",
  size = "card",
  priority = false,
}: {
  name: string;
  brand: string | null;
  image: string | null;
  family?: string | null;
  slug?: string;
  size?: "card" | "hero";
  priority?: boolean;
}) {
  const alt = `${brand ? brand + " " : ""}${name} parfüm şişesi`;
  const src = imageUrl(image);
  if (src) {
    return (
      <div className={`bottle bottle--${size} bottle--img`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={300}
          height={400}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
        />
      </div>
    );
  }
  const key = slug || `${brand}-${name}`;
  const t = toneFor(family, brand || name);
  const style = { ["--h" as string]: t.h, ["--s" as string]: `${t.s}%`, ["--l" as string]: `${t.l}%` };
  return (
    <div className={`bottle bottle--${size} bottle--art`} style={style} role="img" aria-label={alt}>
      <svg viewBox="0 0 120 160" aria-hidden="true">
        <Silhouette shape={shapeOf(key)} />
        <text x="60" y="104" textAnchor="middle" className="b-mono">
          {initials(brand, name)}
        </text>
      </svg>
      {size === "hero" && family && <span className="bottle__family">{family}</span>}
    </div>
  );
}
