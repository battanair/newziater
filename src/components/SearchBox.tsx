"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchItem } from "@/lib/types";

// Búsqueda contra el servidor (no se descarga ningún índice): espera 200 ms
// tras teclear y reutiliza respuestas ya vistas.
const memoria = new Map<string, Promise<SearchItem[]>>();
export function buscarRemoto(q: string, tipos?: SearchItem["t"][]): Promise<SearchItem[]> {
  const term = q.trim().slice(0, 80);
  if (term.length < 2) return Promise.resolve([]);
  const key = `${tipos?.join(",") ?? ""}|${term.toLowerCase()}`;
  if (!memoria.has(key)) {
    const params = new URLSearchParams({ q: term, ...(tipos ? { t: tipos.join(",") } : {}) });
    memoria.set(key, fetch(`/api/buscar?${params}`).then((r) => (r.ok ? r.json() : [])).catch(() => []));
  }
  return memoria.get(key)!;
}

export function useBusqueda(q: string, tipos?: SearchItem["t"][]) {
  const [items, setItems] = useState<SearchItem[]>([]);
  const [cargando, setCargando] = useState(false);
  const tiposKey = tipos?.join(",");
  useEffect(() => {
    let vivo = true;
    if (q.trim().length < 2) { setItems([]); return; }
    setCargando(true);
    const t = setTimeout(() => {
      buscarRemoto(q, tiposKey ? (tiposKey.split(",") as SearchItem["t"][]) : undefined).then((r) => { if (vivo) { setItems(r); setCargando(false); } });
    }, 200);
    return () => { vivo = false; clearTimeout(t); };
  }, [q, tiposKey]);
  return { items, cargando };
}

export const hrefFor = (i: SearchItem) => (i.t === "obra" ? `/obra/${i.id}` : i.t === "persona" ? `/persona/${i.id}` : i.t === "sala" ? `/sala/${i.id}` : `/compania/${i.id}`);
const GROUP: Record<SearchItem["t"], string> = { obra: "Obras", persona: "Artistas", productora: "Compañías", sala: "Salas" };

export function SearchBox({ hero = false, autoFocus = false }: { hero?: boolean; autoFocus?: boolean }) {
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const { items: results } = useBusqueda(q);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function go(i?: SearchItem) {
    setOpen(false);
    if (i) router.push(hrefFor(i));
    else if (q.trim()) router.push(`/buscar?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div ref={box} style={{ position: "relative" }}>
      <form role="search" onSubmit={(e) => { e.preventDefault(); go(results[active]); }}>
        <label className={`search ${hero ? "search-hero" : ""}`}>
          <svg aria-hidden="true" width={hero ? 22 : 18} height={hero ? 22 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <span className="sr-only">Buscar en Ziater</span>
          <input
            type="search"
            role="combobox"
            aria-expanded={open && results.length > 0}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            autoFocus={autoFocus}
            maxLength={80}
            placeholder={hero ? "Busca obras, artistas o compañías…" : "Obras, artistas, compañías…"}
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
