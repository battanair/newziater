import type { Metadata } from "next";
import Link from "next/link";
import { indiceBusqueda } from "@/lib/data";
import { SearchBox } from "@/components/SearchBox";

export const metadata: Metadata = { title: "Buscar", robots: { index: false, follow: true } };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const LABEL = { obra: "Obra", persona: "Artista", productora: "Compañía" } as const;
const href = (t: keyof typeof LABEL, id: string) => (t === "obra" ? `/obra/${id}` : t === "persona" ? `/persona/${id}` : `/compania/${id}`);

export default async function BuscarPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = norm(q.slice(0, 100).trim());
  const items = term ? (await indiceBusqueda()).filter((i) => norm(i.n).includes(term)) : [];
  return (
    <main className="wrap section">
      <h1 className="h1" style={{ marginBottom: 24 }}>Buscar</h1>
      <div style={{ maxWidth: 640, marginBottom: 32 }}><SearchBox hero autoFocus /></div>
      {term ? <p className="muted">{items.length} resultados para «{q}»</p> : null}
      <ul className="list">
        {items.map((i) => (
          <li key={i.t + i.id}>
            <Link href={href(i.t, i.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0" }}>
              {i.img ? <img src={i.img} alt="" className={`thumb ${i.t !== "obra" ? "thumb-round" : ""}`} loading="lazy" /> : <span className={`thumb ${i.t !== "obra" ? "thumb-round" : ""}`} />}
              <span style={{ flex: 1 }}><strong style={{ display: "block" }}>{i.n}</strong>{i.s ? <span className="hint">{i.s}</span> : null}</span>
              <span className="chip">{LABEL[i.t]}</span>
            </Link>
          </li>
        ))}
      </ul>
      {term && !items.length ? (
        <p className="soft">No hay resultados. <Link href="/panel/obra/nueva" style={{ color: "var(--foco)" }}>¿Falta una obra? Créala</Link></p>
      ) : null}
    </main>
  );
}
