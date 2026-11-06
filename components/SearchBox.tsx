"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Item = {
  type: "brand" | "perfume";
  href: string;
  title: string;
  sub: string;
  image: string | null;
};

/**
 * Yazdıkça öneri gösteren arama kutusu.
 * JavaScript çalışmasa bile bir <input name="q"> olarak form ile arama yapar.
 */
export default function SearchBox({ defaultValue = "", placeholder }: { defaultValue?: string; placeholder: string }) {
  const router = useRouter();
  const listId = useId();
  const [value, setValue] = useState(defaultValue);
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const cache = useRef(new Map<string, Item[]>());

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setItems([]);
      return;
    }
    const hit = cache.current.get(q.toLowerCase());
    if (hit) {
      setItems(hit);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/oner?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (!r.ok) return;
        const j = (await r.json()) as { items: Item[] };
        cache.current.set(q.toLowerCase(), j.items);
        setItems(j.items);
        setActive(-1);
      } catch {
        /* iptal edildi veya ağ hatası: öneri göstermeden devam */
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [value]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const show = open && items.length > 0;

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === "Enter" && show && active >= 0) {
      e.preventDefault();
      setOpen(false);
      router.push(items[active].href);
    }
  }

  return (
    <div className="sbox" ref={box}>
      <label htmlFor="q" className="sr-only">
        Parfüm veya marka ara
      </label>
      <input
        id="q"
        name="q"
        type="search"
        value={value}
        maxLength={80}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
      />
      {show && (
        <ul className="sbox__list" id={listId} role="listbox">
          {items.map((it, i) => (
            <li
              key={it.href}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? "is-active" : undefined}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setOpen(false);
                router.push(it.href);
              }}
            >
              <span className="sbox__thumb" aria-hidden="true">
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.image} alt="" loading="lazy" width={36} height={36} />
                ) : (
                  <span>{it.type === "brand" ? "★" : "◌"}</span>
                )}
              </span>
              <span className="sbox__txt">
                <span className="sbox__title" lang="en">{it.title}</span>
                <span className="sbox__sub" lang={it.type === "brand" ? "tr" : "en"}>{it.sub}</span>
              </span>
            </li>
          ))}
          <li className="sbox__all" role="presentation">
            <button type="submit">“{value.trim()}” için tüm sonuçları gör →</button>
          </li>
        </ul>
      )}
    </div>
  );
}
