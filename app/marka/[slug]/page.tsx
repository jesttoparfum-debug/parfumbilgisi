import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HubPage from "@/components/HubPage";
import { readPage } from "@/components/Pager";
import { getBrand, getBrandPerfumes, PAGE_SIZE } from "@/lib/data";
import { nf } from "@/lib/format";

export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ sayfa?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const b = await getBrand(slug);
  if (!b) return { title: "Marka bulunamadı", robots: { index: false } };
  const page = readPage(sp.sayfa);
  const path = `/marka/${b.brand_slug}${page > 1 ? `?sayfa=${page}` : ""}`;
  return {
    title: `${b.brand} parfümleri${page > 1 ? ` (sayfa ${page})` : ""}`,
    description: `${b.brand} markasının ${nf.format(b.perfume_count)} parfümü: notaları, akorları ve koku aileleri.`,
    alternates: { canonical: path },
  };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const b = await getBrand(slug);
  if (!b) notFound();
  // Toplu çekmeyi zorlaştırmak için en fazla 200 sayfa
  const maxPage = Math.min(200, Math.max(1, Math.ceil(b.perfume_count / PAGE_SIZE)));
  const page = readPage(sp.sayfa, maxPage);
  return (
    <HubPage
      eyebrow="Marka"
      title={b.brand}
      count={b.perfume_count}
      crumbs={[["/markalar", "Markalar"]]}
      items={await getBrandPerfumes(b.brand_slug, page)}
      base={`/marka/${b.brand_slug}`}
      page={page}
      maxPage={maxPage}
    />
  );
}
