"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { RequireAuth } from "@/components/RequireAuth";
import { PanelNav } from "@/components/PanelNav";
import { Poster } from "@/components/Cards";
import { Vacio } from "@/components/Vacio";
import { contarMisNotas, creditosDe, miPersona, miUsuario, misAportaciones, misNotas, porIds, type MiNota } from "@/lib/client-data";
import { nombreCompleto } from "@/lib/format";
import type { Obra, Persona, UserDoc } from "@/lib/types";

export default function MiEspacioPage() {
  return <RequireAuth>{(user) => <Resumen user={user} />}</RequireAuth>;
}

interface Datos {
  u: UserDoc;
  persona: Persona | null;
  nNotas: number;
  ultimas: (MiNota & { obra_: Obra })[];
  quiero: Obra[];
  aport: number;
  pendientes: number;
}

function Resumen({ user }: { user: User }) {
  const [d, setD] = useState<Datos | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      const [u, persona, nNotas, { notas }, aport] = await Promise.all([
        miUsuario(user.uid),
        miPersona(user.uid),
        contarMisNotas(user.uid).catch(() => 0),
        misNotas(user.uid).catch(() => ({ notas: [] as MiNota[] })),
        misAportaciones(user.uid),
      ]);
      const ultimas3 = notas.slice(0, 4);
      const quieroIds = [...(u.favoritos_obra ?? [])].reverse().slice(0, 4);
      const obras = await porIds<Obra>("obra", [...ultimas3.map((n) => n.obra), ...quieroIds]);
      const porId = new Map(obras.map((o) => [o.id, o]));
      const pendientes = persona ? (await creditosDe("id_persona", persona.id)).filter((c) => c.estado === "pendiente" && c.creado_por !== user.uid).length : 0;
      setD({
        u,
        persona,
        nNotas,
        ultimas: ultimas3.filter((n) => porId.has(n.obra)).map((n) => ({ ...n, obra_: porId.get(n.obra)! })),
        quiero: quieroIds.map((id) => porId.get(id)).filter((o): o is Obra => Boolean(o)),
        aport: aport.obras.length + aport.personas.length + aport.creditos.length,
        pendientes,
      });
    })().catch(() => setError(true));
  }, [user.uid]);

  if (error) return <><PanelNav /><main className="wrap section"><p className="error">No se pudo cargar tu espacio. Recarga la página.</p></main></>;
  if (!d) return <><PanelNav /><main className="wrap section"><p className="muted">Cargando tu espacio…</p></main></>;

  const nombre = d.u.Nombre || user.displayName?.split(" ")[0] || "";
  const cifras = [
    { n: d.nNotas, l: d.nNotas === 1 ? "obra puntuada" : "obras puntuadas", href: "/panel/listas/notas" },
    { n: d.u.vistas?.length ?? 0, l: "vistas", href: "/panel/listas/vistas" },
    { n: d.u.favoritos_obra?.length ?? 0, l: "por ver", href: "/panel/listas/quiero-ver" },
    { n: d.u.favoritos_persona?.length ?? 0, l: (d.u.favoritos_persona?.length ?? 0) === 1 ? "artista seguido" : "artistas seguidos", href: "/panel/listas/artistas" },
    { n: d.aport, l: d.aport === 1 ? "aportación" : "aportaciones", href: "/panel/aportaciones" },
  ];

  return (
    <>
      <PanelNav personaId={d.persona?.id} pendientes={d.pendientes} />
      <main className="wrap section">
        <h1 className="h1" style={{ fontSize: 48 }}>{nombre ? `Hola, ${nombre}` : "Tu espacio"}</h1>
        <p className="soft" style={{ margin: "10px 0 28px" }}>Tus notas, tus listas y todo lo que has aportado a Ziater.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {cifras.map((c) => (
            <Link key={c.href} href={c.href} className="panel" style={{ display: "block" }}>
              <span className="serif" style={{ display: "block", fontSize: 40, fontWeight: 600, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{c.n}</span>
              <span className="muted" style={{ fontSize: 14 }}>{c.l}</span>
            </Link>
          ))}
        </div>

        <div className="row" style={{ marginTop: 40 }}>
          <div className="main-col stack" style={{ gap: 40 }}>
            <section>
              <div className="section-head" style={{ marginBottom: 16 }}><h2 className="h2" style={{ fontSize: 28 }}>Tus últimas notas</h2><Link href="/panel/listas/notas" style={{ color: "var(--foco)", fontWeight: 600 }}>Ver todas →</Link></div>
              {d.ultimas.length ? (
                <div className="grid-posters">
                  {d.ultimas.map((n) => (
                    <Link key={n.obra} href={`/obra/${n.obra}`} className="card" style={{ display: "block" }}>
                      <Poster obra={n.obra_} />
                      <span className="card-title">{n.obra_.titulo}</span>
                      <span className="card-sub"><span style={{ color: "var(--foco)" }}>★</span> Tu nota: {n.nota}</span>
                    </Link>
                  ))}
                </div>
              ) : <Vacio texto="Aún no has puntuado ninguna obra. Entra en la ficha de una obra que hayas visto y ponle nota del 1 al 10." enlace={{ href: "/obras", l: "Explorar obras" }} />}
            </section>
            <section>
              <div className="section-head" style={{ marginBottom: 16 }}><h2 className="h2" style={{ fontSize: 28 }}>Quieres verlas</h2><Link href="/panel/listas/quiero-ver" style={{ color: "var(--foco)", fontWeight: 600 }}>Ver la lista →</Link></div>
              {d.quiero.length ? (
                <div className="grid-posters">{d.quiero.map((o) => <Link key={o.id} href={`/obra/${o.id}`} className="card" style={{ display: "block" }}><Poster obra={o} /><span className="card-title">{o.titulo}</span></Link>)}</div>
              ) : <Vacio texto="Pulsa «Quiero verla» en cualquier obra para guardarla aquí." enlace={{ href: "/obras?orden=valoradas", l: "Ver las mejor valoradas" }} />}
            </section>
          </div>

          <aside className="side-col">
            {d.persona ? (
              <div className="panel">
                <h2 className="eyebrow">Tu ficha de artista</h2>
                <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 18 }}>{nombreCompleto(d.persona)}</p>
                <p className="hint" style={{ marginTop: 0 }}>{(d.persona.roles ?? []).join(" · ") || "Añade tus roles para salir mejor en las búsquedas"}</p>
                <div className="actions" style={{ marginTop: 14 }}>
                  <Link href="/panel/ficha" className="btn btn-primary">Editar mi ficha</Link>
                  {d.pendientes ? <Link href="/panel/vinculos" className="btn">{d.pendientes} {d.pendientes === 1 ? "crédito" : "créditos"} por confirmar</Link> : null}
                </div>
              </div>
            ) : (
              <div className="panel panel-foco">
                <h2 className="eyebrow">¿Trabajas en las artes escénicas?</h2>
                <p className="soft" style={{ marginTop: 0 }}>Crea tu ficha de artista o reclama la que ya exista con tu trayectoria. Es gratis.</p>
                <Link href="/panel/bienvenida" className="btn btn-primary" style={{ width: "100%" }}>Crear o reclamar mi ficha</Link>
              </div>
            )}
            <div className="panel">
              <h2 className="eyebrow">¿Falta una obra?</h2>
              <p className="soft" style={{ marginTop: 0 }}>Crea su ficha y enlaza a su elenco y equipo. Cada aportación ayuda a que nada de lo que pasa en un escenario se pierda.</p>
              <Link href="/panel/obra/nueva" className="btn" style={{ width: "100%" }}>+ Crear una obra</Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
