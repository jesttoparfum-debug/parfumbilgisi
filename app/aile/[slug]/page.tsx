import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HubPage from "@/components/HubPage";
import { readPage } from "@/components/Pager";
import { getFamily, getFamilyPerfumes, PAGE_SIZE } from "@/lib/data";
import { nf } from "@/lib/format";

export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ sayfa?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const f = await getFamily(slug);
  if (!f) return { title: "Koku ailesi bulunamadı", robots: { index: false } };
  const page = readPage(sp.sayfa);
  return {
    title: `${f.name} parfümler${page > 1 ? ` (sayfa ${page})` : ""}`,
    description: `${f.name} koku ailesindeki ${nf.format(f.perfume_count)} parfüm.`,
    alternates: { canonical: `/aile/${f.slug}${page > 1 ? `?sayfa=${page}` : ""}` },
  };
}

export default async function FamilyPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const f = await getFamily(slug);
  if (!f) notFound();
  const maxPage = Math.max(1, Math.ceil(f.perfume_count / PAGE_SIZE));
  const page = readPage(sp.sayfa, Math.min(maxPage, 400));
  return (
    <HubPage
      eyebrow="Koku ailesi"
      title={f.name}
      count={f.perfume_count}
      crumbs={[["/notalar", "Notalar ve aileler"]]}
      items={await getFamilyPerfumes(f.slug, page)}
      base={`/aile/${f.slug}`}
      page={page}
      maxPage={Math.min(maxPage, 400)}
    />
  );
}
