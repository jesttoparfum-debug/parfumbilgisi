import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HubPage from "@/components/HubPage";
import { readPage } from "@/components/Pager";
import { getNote, getNotePerfumes, PAGE_SIZE } from "@/lib/data";
import { nf } from "@/lib/format";

export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ sayfa?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const n = await getNote(slug);
  if (!n) return { title: "Nota bulunamadı", robots: { index: false } };
  const page = readPage(sp.sayfa);
  return {
    title: `${n.name} notalı parfümler${page > 1 ? ` (sayfa ${page})` : ""}`,
    description: `İçinde ${n.name} notası bulunan ${nf.format(n.perfume_count)} parfüm.`,
    alternates: { canonical: `/nota/${n.slug}${page > 1 ? `?sayfa=${page}` : ""}` },
    // Çok az parfümde geçen notalar ince içerik sayılır
    robots: n.perfume_count >= 5 ? undefined : { index: false, follow: true },
  };
}

export default async function NotePage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const n = await getNote(slug);
  if (!n) notFound();
  // En yoğun 400 sayfa (9.600 parfüm) gösterilir; daha derini kimse gezmez.
  const maxPage = Math.min(400, Math.max(1, Math.ceil(n.perfume_count / PAGE_SIZE)));
  const page = readPage(sp.sayfa, maxPage);
  return (
    <HubPage
      eyebrow="Nota"
      title={n.name}
      count={n.perfume_count}
      intro={`${nf.format(n.perfume_count)} parfümde ${n.name} notası var. ${n.name} notasının en yoğun hissedildiği parfümler en üstte.`}
      crumbs={[["/notalar", "Notalar"]]}
      items={await getNotePerfumes(n.slug, page)}
      base={`/nota/${n.slug}`}
      page={page}
      maxPage={maxPage}
    />
  );
}
