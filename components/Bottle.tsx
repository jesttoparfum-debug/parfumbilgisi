import { hueOf, imageUrl, initials } from "@/lib/format";

/**
 * Görsel varsa kendi depomuzdan (Supabase Storage) gösterir;
 * yoksa markaya özgü renkli bir şişe çizimi çizer. Başka sitelere bağlantı yok.
 */
export default function Bottle({
  name,
  brand,
  image,
  size = "card",
  priority = false,
}: {
  name: string;
  brand: string | null;
  image: string | null;
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
  const h = hueOf(brand || name);
  return (
    <div className={`bottle bottle--${size}`} style={{ ["--h" as string]: h }} role="img" aria-label={alt}>
      <svg viewBox="0 0 120 160" aria-hidden="true">
        <rect x="48" y="8" width="24" height="18" rx="3" className="b-cap" />
        <rect x="54" y="26" width="12" height="10" className="b-neck" />
        <rect x="20" y="36" width="80" height="112" rx="14" className="b-body" />
        <rect x="28" y="44" width="10" height="92" rx="5" className="b-shine" />
        <text x="60" y="100" textAnchor="middle" className="b-mono">
          {initials(brand, name)}
        </text>
      </svg>
    </div>
  );
}
