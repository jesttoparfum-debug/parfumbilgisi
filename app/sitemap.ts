import type { MetadataRoute } from "next";
import { getAllBrandSlugs, getFamilies, getSitemapSlugs, getTopNotes, sitemapCount } from "@/lib/data";
import { SITE } from "@/lib/format";

// /sitemap/0.xml  -> ana sayfalar, markalar, notalar, aileler
// /sitemap/1.xml+ -> parfümler (Google sınırı 50.000; 40.000'lik parçalar)
export const revalidate = 86400;

export async function generateSitemaps() {
  return Array.from({ length: await sitemapCount() }, (_, id) => ({ id }));
}

export default async function sitemap({ id }: { id: number | Promise<number> }): Promise<MetadataRoute.Sitemap> {
  const n = Number(await id);
  const u = (p: string) => ({ url: `${SITE.url}${p}` });

  if (n === 0) {
    const [brands, notes, families] = await Promise.all([getAllBrandSlugs(), getTopNotes(5000, 5), getFamilies()]);
    return [
      { url: SITE.url, priority: 1 },
      u("/markalar"),
      u("/notalar"),
      ...families.map((f) => u(`/aile/${f.slug}`)),
      ...notes.map((x) => u(`/nota/${x.slug}`)),
      ...brands.map((b) => u(`/marka/${b}`)),
    ];
  }
  const slugs = await getSitemapSlugs(n - 1);
  return slugs.map((s) => u(`/parfum/${s}`));
}
