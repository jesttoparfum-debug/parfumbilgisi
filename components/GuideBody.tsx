import Link from "next/link";
import { Fragment } from "react";
import { headingId, type Block } from "@/lib/guides";

/** [yazı](/adres) bağlantılarını ve **kalın** metni güvenle çevirir (HTML kabul etmez). */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        const link = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          const href = link[2];
          if (href.startsWith("/")) return <Link key={i} href={href}>{link[1]}</Link>;
          return (
            <a key={i} href={href} rel="noopener nofollow" target="_blank">
              {link[1]}
            </a>
          );
        }
        const bold = p.match(/^\*\*([^*]+)\*\*$/);
        if (bold) return <strong key={i}>{bold[1]}</strong>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

export { Inline };

export default function GuideBody({ body }: { body: Block[] }) {
  return (
    <div className="article__body">
      {body.map((b, i) => {
        switch (b.t) {
          case "h2":
            return <h2 key={i} id={headingId(b.x)}>{b.x}</h2>;
          case "h3":
            return <h3 key={i}>{b.x}</h3>;
          case "p":
            return <p key={i}><Inline text={b.x} /></p>;
          case "ul":
            return <ul key={i}>{b.x.map((x, j) => <li key={j}><Inline text={x} /></li>)}</ul>;
          case "ol":
            return <ol key={i}>{b.x.map((x, j) => <li key={j}><Inline text={x} /></li>)}</ol>;
          case "note":
            return <aside key={i} className="article__note"><Inline text={b.x} /></aside>;
          case "table":
            return (
              <div key={i} className="article__table" role="region" aria-label={b.caption ?? "Tablo"} tabIndex={0}>
                <table>
                  {b.caption && <caption>{b.caption}</caption>}
                  <thead>
                    <tr>{b.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) => (k === 0 ? <th key={k} scope="row">{c}</th> : <td key={k}>{c}</td>))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}
