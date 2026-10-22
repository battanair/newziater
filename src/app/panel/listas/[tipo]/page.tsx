"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import type { DocumentSnapshot } from "firebase/firestore";
import type { User } from "firebase/auth";
import { RequireAuth } from "@/components/RequireAuth";
import { PanelNav } from "@/components/PanelNav";
import { Avatar, Poster } from "@/components/Cards";
import { Vacio } from "@/components/Vacio";
import { miPersona, miUsuario, misNotas, porIds, quitarDeLista, type ListaUsuario, type MiNota } from "@/lib/client-data";
import { T_MINI, cld, colorCartel, nombreCompleto, periodo } from "@/lib/format";
import type { Obra, Persona } from "@/lib/types";

const TIPOS = {
  notas: { l: "Mis notas", vacio: "Aún no has puntuado ninguna obra. Entra en la ficha de una obra que hayas visto y ponle nota del 1 al 10." },
  vistas: { l: "Vistas", vacio: "Marca «La he visto» en las obras que hayas visto (o ponles nota) y aparecerán aquí." },
  "quiero-ver": { l: "Quiero ver", vacio: "Pulsa «Quiero verla» en cualquier obra para guardarla aquí." },
  artistas: { l: "Artistas que sigo", vacio: "Pulsa «Seguir» en la ficha de un artista para tenerlo a mano." },
} as const;
type Tipo = keyof typeof TIPOS;
const CAMPO: Record<Exclude<Tipo, "notas">, ListaUsuario> = { vistas: "vistas", "quiero-ver": "favoritos_obra", artistas: "favoritos_persona" };
const POR_PAGINA = 24;

export default function ListaPage({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = use(params);
  if (!(tipo in TIPOS)) notFound();
  return <RequireAuth>{(user) => <Lista tipo={tipo as Tipo} user={user} />}</RequireAuth>;
}

function Lista({ tipo, user }: { tipo: Tipo; user: User }) {
  const [personaId, setPersonaId] = useState<string>();
  // Notas: paginadas en Firestore. Listas: ids guardados en la cuenta, cargados de 24 en 24.
  const [ids, setIds] = useState<string[] | null>(null);
  const [visibles, setVisibles] = useState(POR_PAGINA);
  const [obras, setObras] = useState<Map<string, Obra>>(new Map());
  const [personas, setPersonas] = useState<Map<string, Persona>>(new Map());
  const [notas, setNotas] = useState<MiNota[]>([]);
  const [cursor, setCursor] = useState<DocumentSnapshot | undefined>();
  const [cargando, setCargando] = useState(true);

  useEffect(() => { miPersona(user.uid).then((p) => setPersonaId(p?.id)); }, [user.uid]);

  const cargarNotas = useCallback(async (despues?: DocumentSnapshot) => {
    setCargando(true);
    const r = await misNotas(user.uid, despues);
    const os = await porIds<Obra>("obra", r.notas.map((n) => n.obra));
    setObras((m) => new Map([...m, ...os.map((o) => [o.id, o] as const)]));
    setNotas((n) => (despues ? [...n, ...r.notas] : r.notas));
    setCursor(r.ultimo);
    setCargando(false);
  }, [user.uid]);

  useEffect(() => {
    setCargando(true); setVisibles(POR_PAGINA); setNotas([]); setIds(null);
    if (tipo === "notas") { cargarNotas(); return; }
    miUsuario(user.uid).then((u) => setIds([...(u[CAMPO[tipo]] ?? [])].reverse())); // lo último añadido, primero
  }, [tipo, user.uid, cargarNotas]);

  // Carga solo las fichas de la página visible
  useEffect(() => {
    if (!ids || tipo === "notas") return;
    const pagina = ids.slice(0, visibles);
    (async () => {
      if (tipo === "artistas") {
        const faltan = pagina.filter((id) => !personas.has(id));
        if (faltan.length) { const ps = await porIds<Persona>("persona", faltan); setPersonas((m) => new Map([...m, ...ps.map((p) => [p.id, p] as const)])); }
      } else {
        const faltan = pagina.filter((id) => !obras.has(id));
        if (faltan.length) { const os = await porIds<Obra>("obra", faltan); setObras((m) => new Map([...m, ...os.map((o) => [o.id, o] as const)])); }
      }
      setCargando(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, visibles, tipo]);

  async function quitar(id: string) {
    if (tipo === "notas") return;
    setIds((xs) => xs?.filter((x) => x !== id) ?? null);
    await quitarDeLista(user.uid, CAMPO[tipo], id).catch(() => {});
  }

  const total = tipo === "notas" ? notas.length : ids?.length ?? 0;
  const pagina = ids?.slice(0, visibles) ?? [];

  return (
    <>
      <PanelNav personaId={personaId} />
      <main className="wrap section">
        <h1 className="h1" style={{ fontSize: 44, marginBottom: 20 }}>Mis listas</h1>
        <nav aria-label="Listas" className="tabs" style={{ marginBottom: 28 }}>
          {(Object.keys(TIPOS) as Tipo[]).map((t) => (
            <Link key={t} href={`/panel/listas/${t}`} className="tab" aria-selected={t === tipo} style={{ display: "inline-flex", alignItems: "center" }}>{TIPOS[t].l}</Link>
          ))}
        </nav>

        {cargando && !total ? <p className="muted">Cargando…</p> : null}
        {!cargando && !total ? <Vacio texto={TIPOS[tipo].vacio} enlace={tipo === "artistas" ? { href: "/personas", l: "Ver artistas" } : { href: "/obras?orden=valoradas", l: "Explorar obras" }} /> : null}

        {tipo === "notas" && notas.length ? (
          <ul className="list">
            {notas.map((n) => {
              const o = obras.get(n.obra);
              if (!o) return null;
              return (
                <li key={n.obra} className="career" style={{ gridTemplateColumns: "56px minmax(0,1fr) auto" }}>
                  {cld(o.cartel, T_MINI) ? <img src={cld(o.cartel, T_MINI)} alt="" className="thumb" style={{ width: 48, height: 72 }} loading="lazy" /> : <span className="thumb" style={{ width: 48, height: 72, background: colorCartel(o.id) }} />}
                  <span>
                    <Link href={`/obra/${o.id}`} style={{ fontWeight: 600, fontSize: 17 }}>{o.titulo}</Link>
                    <span className="hint" style={{ display: "block" }}>{[periodo(o.anoinicio, o.anofin), o.votos ? `Media del público: ${o.nota?.toLocaleString("es-ES", { maximumFractionDigits: 1 })}` : ""].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span style={{ textAlign: "right" }}>
                    <span className="serif" style={{ fontSize: 30, fontWeight: 600 }}><span style={{ color: "var(--foco)", fontSize: 20 }} aria-hidden="true">★ </span>{n.nota}</span>
                    <Link href={`/obra/${o.id}`} className="hint" style={{ display: "block" }}>Cambiar nota</Link>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}

        {tipo !== "notas" && tipo !== "artistas" && pagina.length ? (
          <div className="grid-posters">
            {pagina.map((id) => {
              const o = obras.get(id);
              if (!o) return null;
              return (
                <div key={id}>
                  <Link href={`/obra/${o.id}`} className="card" style={{ display: "block" }}><Poster obra={o} /><span className="card-title">{o.titulo}</span></Link>
                  <button type="button" className="btn btn-ghost" style={{ paddingLeft: 0 }} onClick={() => quitar(id)}>Quitar de la lista</button>
                </div>
              );
            })}
          </div>
        ) : null}

        {tipo === "artistas" && pagina.length ? (
          <div className="grid-people">
            {pagina.map((id) => {
              const p = personas.get(id);
              if (!p) return null;
              return (
                <div key={id} style={{ textAlign: "center" }}>
                  <Link href={`/persona/${p.id}`} className="card" style={{ display: "block" }}><Avatar persona={p} /><span className="card-title">{nombreCompleto(p)}</span></Link>
                  <button type="button" className="btn btn-ghost" onClick={() => quitar(id)}>Dejar de seguir</button>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="actions" style={{ justifyContent: "center", marginTop: 32 }}>
          {tipo === "notas" && cursor ? <button type="button" className="btn btn-primary" disabled={cargando} onClick={() => cargarNotas(cursor)}>Ver más</button> : null}
          {tipo !== "notas" && ids && ids.length > visibles ? <button type="button" className="btn btn-primary" onClick={() => setVisibles((v) => v + POR_PAGINA)}>Ver más</button> : null}
        </div>
      </main>
    </>
  );
}
