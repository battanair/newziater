import type { Metadata } from "next";
import { listObras } from "@/lib/data";
import { ObraCard } from "@/components/Cards";
import { obraActiva } from "@/lib/format";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Obras de teatro, danza y artes escénicas",
  description: "Catálogo de obras de teatro, danza, circo e improvisación: fichas con elenco, equipo artístico, fechas y compañías.",
  alternates: { canonical: "/obras" },
};

export default async function ObrasPage({ searchParams }: { searchParams: Promise<{ genero?: string; estado?: string }> }) {
  const { genero, estado } = await searchParams;
  const todas = await listObras();
  const generos = [...new Set(todas.flatMap((o) => o.categoria ?? []).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
  const obras = todas
    .filter((o) => !genero || o.categoria?.includes(genero))
    .filter((o) => !estado || (estado === "activas" ? obraActiva(o) : !obraActiva(o)));

  const chip = (label: string, params: Record<string, string | undefined>, on: boolean) => {
    const sp = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    return <a key={label} href={`/obras${sp.size ? "?" + sp : ""}`} className={`chip ${on ? "chip-foco" : ""}`} style={{ minHeight: 40, padding: "0 14px", fontSize: 14 }}>{label}</a>;
  };

  return (
    <main className="wrap section">
      <h1 className="h1" style={{ marginBottom: 8 }}>Obras</h1>
      <p className="muted" style={{ marginTop: 0 }}>{obras.length} {obras.length === 1 ? "obra" : "obras"}</p>
      <nav aria-label="Filtros" style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "20px 0 32px" }}>
        {chip("Todas", { genero }, !estado)}
        {chip("En activo", { genero, estado: "activas" }, estado === "activas")}
        {chip("Archivo", { genero, estado: "archivo" }, estado === "archivo")}
        <span style={{ width: 1, background: "var(--linea-2)", margin: "0 6px" }} aria-hidden="true" />
        {generos.map((g) => chip(g, { genero: g === genero ? undefined : g, estado }, g === genero))}
      </nav>
      {obras.length ? (
        <div className="grid-posters">{obras.map((o) => <ObraCard key={o.id} obra={o} />)}</div>
      ) : (
        <p className="soft">No hay obras con esos filtros.</p>
      )}
    </main>
  );
}
