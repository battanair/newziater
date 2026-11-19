"use client";

import { numero } from "@/lib/i18n";


import Link, { useT, useIdioma } from "@/components/Idioma";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { RequireAuth } from "@/components/RequireAuth";
import { PanelNav } from "@/components/PanelNav";
import { Vacio } from "@/components/Vacio";
import { miPersona, misAportaciones, miUsuario, porIds } from "@/lib/client-data";
import { guardarColaborador, miColaborador } from "@/lib/colaboracion";
import { Ayuda } from "@/components/Ayuda";
import { departamento, nombreCompleto, periodo } from "@/lib/format";
import type { Credito, Obra, Persona } from "@/lib/types";

export default function AportacionesPage() {
  return <RequireAuth>{(user) => <Aportaciones user={user} />}</RequireAuth>;
}

type Datos = { obras: Obra[]; personas: Persona[]; creditos: (Credito & { obra?: Obra; persona?: Persona })[] };

function Aportaciones({ user }: { user: User }) {
  const t = useT();
  const lang = useIdioma();
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
        <h1 className="h1" style={{ fontSize: 44 }}>{t("Tus aportaciones")}</h1>
        <p className="soft" style={{ margin: "10px 0 24px" }}>{t("Las obras, fichas y créditos que has añadido a Ziater. Gracias por ayudar a que no se pierda nada de lo que pasa en un escenario.")}</p>
        <PerfilColaborador user={user} personaId={personaId} />
        {!d ? <p className="muted">{t("Cargando…")}</p> : (
          <div className="stack" style={{ gap: 44 }}>
            <section>
              <div className="section-head" style={{ marginBottom: 12 }}><h2 className="h2" style={{ fontSize: 28 }}>{t("Obras que has creado · {length}", { length: d.obras.length })}</h2><Link href="/panel/obra/nueva" className="btn btn-primary">{t("+ Crear obra")}</Link></div>
              {d.obras.length ? (
                <ul className="list">
                  {d.obras.map((o) => (
                    <li key={o.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "14px 0" }}>
                      <span style={{ flex: "1 1 240px" }}><Link href={`/obra/${o.id}`} style={{ fontWeight: 600 }}>{o.titulo}</Link><span className="hint" style={{ display: "block" }}>{[periodo(o.anoinicio, o.anofin, lang), o.votos ? t("★ {nota} · {votos} votos", { nota: numero(lang, o.nota ?? 0), votos: o.votos }) : t("Sin votos todavía")].filter(Boolean).join(" · ")}</span></span>
                      <Link href={`/panel/obra/${o.id}`} className="btn">{t("Editar")}</Link>
                    </li>
                  ))}
                </ul>
              ) : <Vacio texto="¿Falta alguna obra en Ziater? Crea su ficha y enlaza a su elenco y equipo." />}
            </section>

            <section>
              <h2 className="h2" style={{ fontSize: 28, marginBottom: 12 }}>{t("Créditos que has añadido · {length}", { length: d.creditos.length })}</h2>
              {d.creditos.length ? (
                <ul className="list">
                  {d.creditos.map((c) => (
                    <li key={c.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "14px 0" }}>
                      <span style={{ flex: "1 1 260px" }}>
                        {c.persona ? <Link href={`/persona/${c.id_persona}`} style={{ fontWeight: 600 }}>{nombreCompleto(c.persona)}</Link> : <span className="muted">{t("Ficha eliminada")}</span>}
                        <span className="soft">{" "}{t("en")}{" "}</span>
                        {c.obra ? <Link href={`/obra/${c.id_obra}`} style={{ fontWeight: 600 }}>{c.obra.titulo}</Link> : <span className="muted">{t("obra eliminada")}</span>}
                        <span className="hint" style={{ display: "block" }}>{[departamento(c), c.titulo && c.titulo.trim() !== c.puesto ? c.titulo : ""].filter(Boolean).join(" · ")}</span>
                      </span>
                      <span className={`chip ${c.estado === "pendiente" ? "" : "chip-ok"}`}>{c.estado === "pendiente" ? t("Pendiente de confirmar") : t("✓ Confirmado")}{c.estado === "pendiente" ? <Ayuda etiqueta={t("Qué significa pendiente")}>{t("Falta que lo confirme la otra parte: la persona acreditada (si la has añadido tú) o quien gestiona la obra (si te has añadido tú). Hasta entonces no aparece públicamente.")}</Ayuda> : null}</span>
                    </li>
                  ))}
                </ul>
              ) : <Vacio texto="Cuando añadas a alguien al elenco o al equipo de una obra, o te añadas tú, lo verás aquí." />}
            </section>

            <section>
              <h2 className="h2" style={{ fontSize: 28, marginBottom: 12 }}>{t("Fichas que has creado para otras personas · {length}", { length: d.personas.length })}</h2>
              {d.personas.length ? (
                <ul className="list">
                  {d.personas.map((p) => (
                    <li key={p.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "14px 0" }}>
                      <Link href={`/persona/${p.id}`} style={{ flex: "1 1 240px", fontWeight: 600 }}>{nombreCompleto(p)}</Link>
                      <span className={`chip ${p.coincide ? "chip-ok" : ""}`}>{p.coincide ? t("✓ Ya la ha reclamado") : t("Sin reclamar")}</span>
                    </li>
                  ))}
                </ul>
              ) : <Vacio texto="Si añades a una obra a alguien que aún no está en Ziater, se le crea una ficha que podrá reclamar. Aparecerán aquí." />}
              {d.personas.some((p) => !p.coincide) ? <p className="hint" style={{ marginTop: 10 }}>{t("Comparte con ellas el enlace para reclamar su ficha desde")}{" "}<Link href="/panel/vinculos" style={{ textDecoration: "underline" }}>{t("Vínculos")}</Link>.</p> : null}
            </section>
          </div>
        )}
      </main>
    </>
  );
}

/** Activar el perfil público de colaborador: aparece en /colaboradores y en su ficha de artista. */
function PerfilColaborador({ user, personaId }: { user: User; personaId?: string }) {
  const t = useT();
  const [publico, setPublico] = useState<boolean | null>(null);
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState<"idle" | "saving" | "ok" | "error">("idle");

  useEffect(() => {
    (async () => {
      const [c, u] = await Promise.all([miColaborador(user.uid), miUsuario(user.uid).catch(() => null)]);
      setPublico(c?.publico ?? false);
      setNombre(c?.nombre || [u?.Nombre, u?.Apellidos].filter(Boolean).join(" ") || user.displayName || "");
    })();
  }, [user]);

  async function guardar(nuevo: boolean) {
    if (nuevo && !nombre.trim()) return setEstado("error");
    setEstado("saving");
    try {
      await guardarColaborador(user.uid, { nombre, publico: nuevo, persona_id: personaId });
      setPublico(nuevo);
      setEstado("ok");
    } catch {
      setEstado("error");
    }
  }

  if (publico === null) return null;
  return (
    <section className="panel" style={{ marginBottom: 36, display: "flex", flexWrap: "wrap", gap: "14px 24px", alignItems: "center" }}>
      <div style={{ flex: "1 1 340px" }}>
        <h2 className="eyebrow" style={{ marginBottom: 6 }}>{t("Perfil de colaborador")}</h2>
        <p className="soft" style={{ margin: 0 }}>
          {publico
            ? <>{t("Apareces en el")}{" "}<Link href="/colaboradores" style={{ textDecoration: "underline" }}>{t("ranking de colaboradores")}</Link>{personaId ? t(" y en tu ficha de artista como") : t(" como")}{" "}<strong>{nombre}</strong>.</>
            : personaId ? t("Si quieres, tu nombre y tus aportaciones pueden aparecer en el ranking de colaboradores y en tu ficha de artista.") : t("Si quieres, tu nombre y tus aportaciones pueden aparecer en el ranking de colaboradores.")}
        </p>
        {!publico ? (
          <div className="field" style={{ marginTop: 12, maxWidth: 360 }}>
            <label className="label" htmlFor="nombre-colab">{t("Nombre que se mostrará")}</label>
            <input id="nombre-colab" className="input" maxLength={100} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
        ) : null}
        {estado === "error" ? <p className="error" role="alert" style={{ margin: "8px 0 0" }}>{nombre.trim() ? t("No se pudo guardar.") : t("Escribe el nombre que quieres mostrar.")}</p> : null}
      </div>
      <button type="button" className={publico ? "btn" : "btn btn-primary"} disabled={estado === "saving"} onClick={() => guardar(!publico)}>
        {estado === "saving" ? t("Guardando…") : publico ? t("Dejar de aparecer") : t("Aparecer en el ranking")}
      </button>
    </section>
  );
}
