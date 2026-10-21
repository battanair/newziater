"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchItem } from "@/lib/types";

let cache: Promise<SearchItem[]> | null = null;
export function loadIndex(): Promise<SearchItem[]> {
  cache ??= fetch("/api/buscar").then((r) => (r.ok ? r.json() : [])).catch(() => []);
  return cache;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export function filterIndex(items: SearchItem[], q: string, max = 8) {
  const nq = norm(q.trim());
  if (!nq) return [];
  return items
    .map((i) => ({ i, pos: norm(i.n).indexOf(nq) }))
    .filter((x) => x.pos >= 0)
    .sort((a, b) => a.pos - b.pos || a.i.n.length - b.i.n.length)
    .slice(0, max)
    .map((x) => x.i);
}

export const hrefFor = (i: SearchItem) => (i.t === "obra" ? `/obra/${i.id}` : i.t === "persona" ? `/persona/${i.id}` : `/compania/${i.id}`);
const GROUP: Record<SearchItem["t"], string> = { obra: "Obras", persona: "Artistas", productora: "Compañías" };

export function SearchBox({ hero = false, autoFocus = false }: { hero?: boolean; autoFocus?: boolean }) {
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !items.length) loadIndex().then(setItems);
  }, [open, items.length]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const results = useMemo(() => filterIndex(items, q), [items, q]);

  function go(i?: SearchItem) {
    setOpen(false);
    if (i) router.push(hrefFor(i));
    else if (q.trim()) router.push(`/buscar?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div ref={box} style={{ position: "relative" }}>
      <form role="search" onSubmit={(e) => { e.preventDefault(); go(results[active]); }}>
        <label className={`search ${hero ? "search-hero" : ""}`}>
          <svg aria-hidden="true" width={hero ? 22 : 18} height={hero ? 22 : 18} viewBox="0 0 24 24" fill="none" stroke={hero ? "#5A5248" : "#A89F92"} strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <span className="sr-only">Buscar en Ziater</span>
          <input
            type="search"
            role="combobox"
            aria-expanded={open && results.length > 0}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            autoFocus={autoFocus}
            maxLength={100}
            placeholder={hero ? "Busca una obra, un artista o una compañía…" : "Obras, artistas, compañías…"}
            value={q}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === "Escape") setOpen(false);
            }}
          />
          {hero ? <button type="submit" className="btn btn-light" style={{ background: "var(--sala)", color: "var(--papel)", borderColor: "var(--sala)" }}>Buscar</button> : null}
        </label>
      </form>
      {open && results.length > 0 ? (
        <div id={`${id}-list`} role="listbox" className="suggest" style={{ position: "absolute", left: 0, right: 0, zIndex: 30 }}>
          {results.map((r, idx) => (
            <div key={r.t + r.id}>
              {idx === 0 || results[idx - 1].t !== r.t ? <div className="suggest-group">{GROUP[r.t]}</div> : null}
              <button type="button" role="option" aria-selected={idx === active} className="suggest-item" onMouseEnter={() => setActive(idx)} onClick={() => go(r)}>
                {r.img ? <img src={r.img} alt="" className={`thumb ${r.t !== "obra" ? "thumb-round" : ""}`} loading="lazy" /> : <span className={`thumb ${r.t !== "obra" ? "thumb-round" : ""}`} />}
                <span>
                  <span style={{ display: "block", fontWeight: 600 }}>{r.n}</span>
                  {r.s ? <span className="hint">{r.s}</span> : null}
                </span>
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
