import type { MetadataRoute } from "next";
import { sitemapCount } from "@/lib/data";
import { SITE } from "@/lib/format";

export const revalidate = 86400;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const n = await sitemapCount();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/ara"] }],
    sitemap: Array.from({ length: n }, (_, i) => `${SITE.url}/sitemap/${i}.xml`),
    host: SITE.url,
  };
}
