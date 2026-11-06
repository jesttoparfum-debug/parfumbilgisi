import Link from "next/link";

export default function Pager({
  base,
  page,
  hasNext,
  params = {},
}: {
  base: string;
  page: number;
  hasNext: boolean;
  params?: Record<string, string>;
}) {
  if (page <= 1 && !hasNext) return null;
  const href = (n: number) => {
    const sp = new URLSearchParams(params);
    if (n > 1) sp.set("sayfa", String(n));
    const s = sp.toString();
    return s ? `${base}?${s}` : base;
  };
  return (
    <nav className="pager" aria-label="Sayfalar">
      {page > 1 ? <Link href={href(page - 1)} rel="prev">← Önceki</Link> : <span />}
      <span className="pager__n">Sayfa {page}</span>
      {hasNext ? <Link href={href(page + 1)} rel="next">Sonraki →</Link> : <span />}
    </nav>
  );
}

export function readPage(v: string | string[] | undefined, max = 500) {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n >= 1 && n <= max ? n : 1;
}
