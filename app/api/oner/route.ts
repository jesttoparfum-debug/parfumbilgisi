import { NextResponse, type NextRequest } from "next/server";
import { suggest } from "@/lib/data";

/*
 * Arama kutusu önerileri. Yalnızca okur; sonuç 1 saat CDN'de cache'lenir,
 * aynı kelimeyi yazan herkes veritabanına tekrar gitmez.
 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").slice(0, 60);
  try {
    const items = await suggest(q);
    return NextResponse.json(
      { items },
      { headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (e) {
    console.error("oneri hatasi", e);
    return NextResponse.json({ items: [] }, { status: 200, headers: { "cache-control": "no-store" } });
  }
}
