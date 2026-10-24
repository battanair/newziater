import type { Metadata } from "next";
import Link from "next/link";
import { rankingColaboradores } from "@/lib/data";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Colaboradores",
  description: "Las personas que construyen Ziater: quienes más obras, fichas y créditos han aportado a la base de datos de las artes escénicas.",
  alternates: { canonical: "/colaboradores" },
};

export default async function ColaboradoresPage() {
  const lista = await rankingColaboradores();
  return (
    <main className="wrap section" style={{ maxWidth: 900 }}>
      <p className="eyebrow" style={{ marginBottom: 12 }}>Gracias</p>
      <h1 className="h1">Quienes construyen Ziater</h1>
      <p className="lead" style={{ margin: "16px 0 32px" }}>
        Ziater existe porque mucha gente se toma el tiempo de crear fichas, enlazar elencos y corregir datos. Estas son las personas que más han aportado.
      </p>

      {lista.length ? (
        <ol className="list" style={{ counterReset: "puesto" }}>
          {lista.map((a, i) => (
            <li key={a.uid} style={{ display: "grid", gridTemplateColumns: "44px minmax(0, 1fr) auto", gap: 16, alignItems: "center", padding: "16px 0" }}>
              <span className="serif" style={{ fontSize: 26, fontWeight: 600, color: i < 3 ? "var(--foco)" : "var(--texto-3)", textAlign: "center" }}>{i + 1}</span>
              <span style={{ minWidth: 0 }}>
                {a.persona_id ? <Link href={`/persona/${a.persona_id}`} style={{ fontWeight: 600, fontSize: 18 }}>{a.nombre}</Link> : <strong style={{ fontSize: 18 }}>{a.nombre}</strong>}
                <span className="hint" style={{ display: "block" }}>
                  {[a.obras && `${a.obras} ${a.obras === 1 ? "obra" : "obras"}`, a.fichas && `${a.fichas} ${a.fichas === 1 ? "ficha" : "fichas"}`, a.creditos && `${a.creditos} ${a.creditos === 1 ? "crédito" : "créditos"}`].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="chip chip-foco" title="Una obra cuenta 3 puntos; una ficha o un crédito, 1">{a.total} pts</span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="panel" style={{ textAlign: "center" }}>
          <p className="soft" style={{ marginTop: 0 }}>Todavía nadie ha activado su perfil de colaborador.</p>
        </div>
      )}

      <div className="panel" style={{ marginTop: 40 }}>
        <h2 className="eyebrow">¿Quieres aparecer?</h2>
        <p className="soft" style={{ margin: "0 0 14px" }}>Solo salen quienes lo activan. Hazlo desde «Tus aportaciones»: tu nombre aparecerá aquí y en tu ficha de artista, si tienes.</p>
        <Link href="/panel/aportaciones" className="btn btn-primary">Ir a Tus aportaciones</Link>
      </div>
    </main>
  );
}
