import type { MetadataRoute } from "next";
import { sitemapCount } from "@/lib/data";
import { SITE } from "@/lib/format";

export const revalidate = 86400;

// Veri toplama ve yapay zekâ eğitim botlarına tüm site kapalı
const YASAK_BOTLAR = [
  "GPTBot", "ChatGPT-User", "OAI-SearchBot", "CCBot", "ClaudeBot", "Claude-Web", "anthropic-ai",
  "Google-Extended", "Applebot-Extended", "Bytespider", "PerplexityBot", "Amazonbot",
  "meta-externalagent", "FacebookBot", "omgili", "Diffbot", "cohere-ai", "AI2Bot", "YouBot",
  "ImagesiftBot", "Timpibot", "DataForSeoBot", "MJ12bot", "SemrushBot", "AhrefsBot", "DotBot",
  "BLEXBot", "PetalBot", "serpstatbot", "Barkrowler", "MegaIndex", "Seekport",
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const n = await sitemapCount();
  return {
    rules: [
      // Arama motorları: her şey açık (arama ve bulucu sonuçları hariç, onlar zaten noindex)
      { userAgent: "*", allow: "/", disallow: ["/ara", "/bul?", "/yonetim"] },
      { userAgent: YASAK_BOTLAR, disallow: "/" },
    ],
    sitemap: Array.from({ length: n }, (_, i) => `${SITE.url}/sitemap/${i}.xml`),
    host: SITE.url,
  };
}
