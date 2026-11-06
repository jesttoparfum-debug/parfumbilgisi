import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HubPage from "@/components/HubPage";
import { readPage } from "@/components/Pager";
import { getPerfumer, getPerfumerPerfumes, PAGE_SIZE } from "@/lib/data";
import { nf } from "@/lib/format";

export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ sayfa?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const h = await getPerfumer(slug);
  if (!h) return { title: "Parfümör bulunamadı", robots: { index: false } };
  const page = readPage(sp.sayfa);
  return {
    title: `${h.name} parfümleri${page > 1 ? ` (sayfa ${page})` : ""}`,
    description: `Parfümör ${h.name} imzalı ${nf.format(h.perfume_count)} parfüm ve notaları.`,
    alternates: { canonical: `/parfumor/${h.slug}${page > 1 ? `?sayfa=${page}` : ""}` },
    // Çok az parfümü olanlar ince içerik sayılır
    robots: h.perfume_count >= 3 ? undefined : { index: false, follow: true },
  };
}

export default async function PerfumerPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const h = await getPerfumer(slug);
  if (!h) notFound();
  const maxPage = Math.min(400, Math.max(1, Math.ceil(h.perfume_count / PAGE_SIZE)));
  const page = readPage(sp.sayfa, maxPage);
  return (
    <HubPage
      eyebrow="Parfümör"
      title={h.name}
      count={h.perfume_count}
      intro={`${h.name} imzalı ${nf.format(h.perfume_count)} parfüm. Yeniden eskiye, görselli olanlar önce.`}
      crumbs={[["/parfumorler", "Parfümörler"]]}
      items={await getPerfumerPerfumes(h.slug, page)}
      base={`/parfumor/${h.slug}`}
      page={page}
      maxPage={maxPage}
    />
  );
}
