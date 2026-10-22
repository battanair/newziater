"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { RequireAuth } from "@/components/RequireAuth";
import { PanelNav } from "@/components/PanelNav";
import { Vacio } from "@/components/Vacio";
import { miPersona, misAportaciones, porIds } from "@/lib/client-data";
import { departamento, nombreCompleto, periodo } from "@/lib/format";
import type { Credito, Obra, Persona } from "@/lib/types";

export default function AportacionesPage() {
  return <RequireAuth>{(user) => <Aportaciones user={user} />}</RequireAuth>;
}

type Datos = { obras: Obra[]; personas: Persona[]; creditos: (Credito & { obra?: Obra; persona?: Persona })[] };

function Aportaciones({ user }: { user: User }) {
  const [d, setD] = useState<Datos | null>(null);
  const [personaId, setPersonaId] = useState<string>();

  useEffect(() => {
    (async () => {
      const [a, yo] = await Promise.all([misAportaciones(user.uid), miPersona(user.uid)]);
      setPersonaId(yo?.id);
      const [obras, personas] = await Promise.all([
        porIds<Obra>("obra", a.creditos.map((c) => c.id_obra)),
        porIds<Persona>("persona", a.creditos.map((c) => c.id_persona)),
      ]);
      const o = new Map(obras.map((x) => [x.id, x])), p = new Map(personas.map((x) => [x.id, x]));
      setD({ ...a, creditos: a.creditos.map((c) => ({ ...c, obra: o.get(c.id_obra), persona: p.get(c.id_persona) })) });
    })();
  }, [user.uid]);

  return (
    <>
      <PanelNav personaId={personaId} />
      <main className="wrap section" style={{ maxWidth: 1040 }}>
        <h1 className="h1" style={{ fontSize: 44 }}>Tus aportaciones</h1>
        <p className="soft" style={{ margin: "10px 0 32px" }}>Las obras, fichas y créditos que has añadido a Ziater. Gracias por ayudar a que no se pierda nada de lo que pasa en un escenario.</p>
        {!d ? <p className="muted">Cargando…</p> : (
          <div className="stack" style={{ gap: 44 }}>
            <section>
              <div className="section-head" style={{ marginBottom: 12 }}><h2 className="h2" style={{ fontSize: 28 }}>Obras que has creado · {d.obras.length}</h2><Link href="/panel/obra/nueva" className="btn btn-primary">+ Crear obra</Link></div>
              {d.obras.length ? (
                <ul className="list">
                  {d.obras.map((o) => (
                    <li key={o.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "14px 0" }}>
                      <span style={{ flex: "1 1 240px" }}><Link href={`/obra/${o.id}`} style={{ fontWeight: 600 }}>{o.titulo}</Link><span className="hint" style={{ display: "block" }}>{[periodo(o.anoinicio, o.anofin), o.votos ? `★ ${o.nota?.toLocaleString("es-ES", { maximumFractionDigits: 1 })} · ${o.votos} votos` : "Sin votos todavía"].filter(Boolean).join(" · ")}</span></span>
                      <Link href={`/panel/obra/${o.id}`} className="btn">Editar</Link>
                    </li>
                  ))}
                </ul>
              ) : <Vacio texto="¿Falta alguna obra en Ziater? Crea su ficha y enlaza a su elenco y equipo." />}
            </section>

            <section>
              <h2 className="h2" style={{ fontSize: 28, marginBottom: 12 }}>Créditos que has añadido · {d.creditos.length}</h2>
              {d.creditos.length ? (
                <ul className="list">
                  {d.creditos.map((c) => (
                    <li key={c.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "14px 0" }}>
                      <span style={{ flex: "1 1 260px" }}>
                        {c.persona ? <Link href={`/persona/${c.id_persona}`} style={{ fontWeight: 600 }}>{nombreCompleto(c.persona)}</Link> : <span className="muted">Ficha eliminada</span>}
                        <span className="soft"> en </span>
                        {c.obra ? <Link href={`/obra/${c.id_obra}`} style={{ fontWeight: 600 }}>{c.obra.titulo}</Link> : <span className="muted">obra eliminada</span>}
                        <span className="hint" style={{ display: "block" }}>{[departamento(c), c.titulo && c.titulo.trim() !== c.puesto ? c.titulo : ""].filter(Boolean).join(" · ")}</span>
                      </span>
                      <span className={`chip ${c.estado === "pendiente" ? "" : "chip-ok"}`}>{c.estado === "pendiente" ? "Pendiente de confirmar" : "✓ Confirmado"}</span>
                    </li>
                  ))}
                </ul>
              ) : <Vacio texto="Cuando añadas a alguien al elenco o al equipo de una obra, o te añadas tú, lo verás aquí." />}
            </section>

            <section>
              <h2 className="h2" style={{ fontSize: 28, marginBottom: 12 }}>Fichas que has creado para otras personas · {d.personas.length}</h2>
              {d.personas.length ? (
                <ul className="list">
                  {d.personas.map((p) => (
                    <li key={p.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "14px 0" }}>
                      <Link href={`/persona/${p.id}`} style={{ flex: "1 1 240px", fontWeight: 600 }}>{nombreCompleto(p)}</Link>
                      <span className={`chip ${p.coincide ? "chip-ok" : ""}`}>{p.coincide ? "✓ Ya la ha reclamado" : "Sin reclamar"}</span>
                    </li>
                  ))}
                </ul>
              ) : <Vacio texto="Si añades a una obra a alguien que aún no está en Ziater, se le crea una ficha que podrá reclamar. Aparecerán aquí." />}
              {d.personas.some((p) => !p.coincide) ? <p className="hint" style={{ marginTop: 10 }}>Comparte con ellas el enlace para reclamar su ficha desde <Link href="/panel/vinculos" style={{ textDecoration: "underline" }}>Vínculos</Link>.</p> : null}
            </section>
          </div>
        )}
      </main>
    </>
  );
}
