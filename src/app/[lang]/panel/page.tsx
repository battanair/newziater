"use client";


import Link, { useT } from "@/components/Idioma";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { RequireAuth } from "@/components/RequireAuth";
import { PanelNav } from "@/components/PanelNav";
import { Poster } from "@/components/Cards";
import { Vacio } from "@/components/Vacio";
import { MisSolicitudes } from "@/components/MisSolicitudes";
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
  creditos: number;
  obrasCreadas: number;
}

function Resumen({ user }: { user: User }) {
  const t = useT();
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
      const misCreditos = persona ? await creditosDe("id_persona", persona.id) : [];
      const pendientes = misCreditos.filter((c) => c.estado === "pendiente" && c.creado_por !== user.uid).length;
      setD({
        u,
        persona,
        nNotas,
        ultimas: ultimas3.filter((n) => porId.has(n.obra)).map((n) => ({ ...n, obra_: porId.get(n.obra)! })),
        quiero: quieroIds.map((id) => porId.get(id)).filter((o): o is Obra => Boolean(o)),
        aport: aport.obras.length + aport.personas.length + aport.creditos.length,
        pendientes,
        creditos: misCreditos.filter((c) => c.estado !== "pendiente").length,
        obrasCreadas: aport.obras.length,
      });
    })().catch(() => setError(true));
  }, [user.uid]);

  if (error) return <><PanelNav /><main className="wrap section"><p className="error">{t("No se pudo cargar tu espacio. Recarga la página.")}</p></main></>;
  if (!d) return <><PanelNav /><main className="wrap section"><p className="muted">{t("Cargando tu espacio…")}</p></main></>;

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
        <h1 className="h1" style={{ fontSize: 48 }}>{nombre ? t("Hola, {nombre}", { nombre: nombre }) : t("Tu espacio")}</h1>
        <p className="soft" style={{ margin: "10px 0 28px" }}>{t("Tus notas, tus listas y todo lo que has aportado a Ziater.")}</p>

        {d.persona ? <PasosArtista d={d} /> : null}

        <div className="cifras">
          {cifras.map((c) => (
            <Link key={c.href} href={c.href} className="panel" style={{ display: "block" }}>
              <span className="cifra">{c.n}</span>
              <span className="muted" style={{ fontSize: 14 }}>{t(c.l)}</span>
            </Link>
          ))}
        </div>

        <div className="row" style={{ marginTop: 40 }}>
          <div className="main-col stack" style={{ gap: 40 }}>
            <section>
              <div className="section-head" style={{ marginBottom: 16 }}><h2 className="h2" style={{ fontSize: 28 }}>{t("Tus últimas notas")}</h2><Link href="/panel/listas/notas" style={{ color: "var(--foco)", fontWeight: 600 }}>{t("Ver todas →")}</Link></div>
              {d.ultimas.length ? (
                <div className="grid-posters">
                  {d.ultimas.map((n) => (
                    <Link key={n.obra} href={`/obra/${n.obra}`} className="card" style={{ display: "block" }}>
                      <Poster obra={n.obra_} />
                      <span className="card-title">{n.obra_.titulo}</span>
                      <span className="card-sub"><span style={{ color: "var(--foco)" }}>★</span>{" "}{t("Tu nota: {nota}", { nota: n.nota })}</span>
                    </Link>
                  ))}
                </div>
              ) : <Vacio texto="Aún no has puntuado ninguna obra. Entra en la ficha de una obra que hayas visto y ponle nota del 1 al 10." enlace={{ href: "/obras", l: "Explorar obras" }} />}
            </section>
            <section>
              <div className="section-head" style={{ marginBottom: 16 }}><h2 className="h2" style={{ fontSize: 28 }}>{t("Quieres verlas")}</h2><Link href="/panel/listas/quiero-ver" style={{ color: "var(--foco)", fontWeight: 600 }}>{t("Ver la lista →")}</Link></div>
              {d.quiero.length ? (
                <div className="grid-posters">{d.quiero.map((o) => <Link key={o.id} href={`/obra/${o.id}`} className="card" style={{ display: "block" }}><Poster obra={o} /><span className="card-title">{o.titulo}</span></Link>)}</div>
              ) : <Vacio texto="Pulsa «Quiero verla» en cualquier obra para guardarla aquí." enlace={{ href: "/obras?orden=valoradas", l: "Ver las mejor valoradas" }} />}
            </section>
          </div>

          <aside className="side-col">
            <MisSolicitudes uid={user.uid} />
            {d.persona ? (
              <div className="panel">
                <h2 className="eyebrow">{t("Tu ficha de artista")}</h2>
                <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 18 }}>{nombreCompleto(d.persona)}</p>
                <p className="hint" style={{ marginTop: 0 }}>{(d.persona.roles ?? []).join(" · ") || t("Añade tus roles para salir mejor en las búsquedas")}</p>
                <div className="actions" style={{ marginTop: 14 }}>
                  <Link href="/panel/ficha" className="btn btn-primary">{t("Editar mi ficha")}</Link>
                  {d.pendientes ? <Link href="/panel/vinculos" className="btn">{(d.pendientes === 1 ? t("1 crédito por confirmar") : t("{n} créditos por confirmar", { n: d.pendientes }))}</Link> : null}
                </div>
              </div>
            ) : (
              <div className="panel panel-foco">
                <h2 className="eyebrow">{t("¿Trabajas en las artes escénicas?")}</h2>
                <p className="soft" style={{ marginTop: 0 }}>{t("Crea tu ficha de artista o reclama la que ya exista con tu trayectoria. Es gratis.")}</p>
                <Link href="/panel/bienvenida" className="btn btn-primary" style={{ width: "100%" }}>{t("Crear o reclamar mi ficha")}</Link>
              </div>
            )}
            <div className="panel">
              <h2 className="eyebrow">{t("¿Falta una obra?")}</h2>
              <p className="soft" style={{ marginTop: 0 }}>{t("Crea su ficha y enlaza a su elenco y equipo. Cada aportación ayuda a que nada de lo que pasa en un escenario se pierda.")}</p>
              <Link href="/panel/obra/nueva" className="btn" style={{ width: "100%" }}>{t("+ Crear una obra")}</Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

/** Pasos para que quien es artista complete su ficha y añada obras. Desaparece cuando lo tiene todo. */
function PasosArtista({ d }: { d: Datos }) {
  const t = useT();
  const p = d.persona!;
  const pasos = [
    { ok: Boolean(p.foto), l: "Añade tu retrato", d: "Las fichas con foto se visitan mucho más.", href: "/panel/ficha" },
    { ok: (p.biografia ?? "").length > 80, l: "Escribe tu biografía", d: "Unas líneas sobre quién eres y qué haces.", href: "/panel/ficha" },
    { ok: (p.roles ?? []).length > 0, l: "Elige tus roles", d: "Interpretación, dirección, dramaturgia… Así te encuentran en las búsquedas.", href: "/panel/ficha" },
    { ok: d.creditos >= 3, l: "Añade al menos 3 obras", d: d.creditos ? t("Llevas {n}. Añade las obras en las que has trabajado.", { n: d.creditos }) : "Añade las obras en las que has trabajado: tu trayectoria es tu CV.", href: "/panel/ficha#creditos" },
    { ok: d.obrasCreadas > 0, l: "Sube una obra que falte en Ziater", d: "Con su cartel, elenco y fechas. Tus compañeros quedarán enlazados.", href: "/panel/obra/nueva" },
    { ok: Boolean(p.instagram), l: "Añade tu Instagram", d: "Para que puedan seguirte desde tu ficha.", href: "/panel/ficha" },
    ...(d.pendientes ? [{ ok: false, l: "Confirma tus créditos pendientes", d: d.pendientes === 1 ? t("1 crédito por confirmar") : t("{n} créditos por confirmar", { n: d.pendientes }), href: "/panel/vinculos" }] : []),
  ];
  const hechos = pasos.filter((x) => x.ok).length;
  const pct = Math.round((hechos / pasos.length) * 100);
  const siguiente = pasos.find((x) => !x.ok);

  if (!siguiente) {
    return (
      <div className="panel panel-foco" style={{ marginBottom: 28, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between" }}>
        <span><strong style={{ display: "block" }}>{t("¡Tu ficha está completa!")}</strong><span className="hint">{t("Compártela como si fuera tu CV: en tu bio de Instagram, en tus stories o al escribir a una sala.")}</span></span>
        <Link href={`/persona/${p.id}`} className="btn btn-primary">{t("Ver mi ficha pública")}</Link>
      </div>
    );
  }

  return (
    <section className="panel panel-foco" style={{ marginBottom: 28 }} aria-labelledby="pasos-tit">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <h2 id="pasos-tit" className="h3" style={{ margin: 0 }}>{t("Tus próximos pasos")}</h2>
        <span className="hint">{t("{hechos} de {total} hechos", { hechos, total: pasos.length })}</span>
      </div>
      <div className="progress" style={{ margin: "12px 0 6px" }} aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
      <ol className="pasos">
        {pasos.map((x) => (
          <li key={x.l} className={x.ok ? "paso hecho" : x === siguiente ? "paso siguiente" : "paso"}>
            <span className="paso-marca" aria-hidden="true">{x.ok ? "✓" : ""}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: "block" }}>{t(x.l)}{x.ok ? <span className="sr-only">{" "}{t("(hecho)")}</span> : null}</strong>
              {!x.ok ? <span className="hint">{t(x.d)}</span> : null}
            </span>
            {!x.ok ? <Link href={x.href} className={x === siguiente ? "btn btn-primary" : "btn"}>{x === siguiente ? t("Empezar") : t("Ir")}</Link> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
