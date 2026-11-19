"use client";


import { useT } from "@/components/Idioma";
import Link, { useT } from "@/components/Idioma";
import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, query, updateDoc, where, writeBatch } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase-client";
import { RequireAuth } from "@/components/RequireAuth";
import { authFetch } from "@/components/AuthProvider";
import { leer } from "@/lib/client-data";
import { nombreCompleto } from "@/lib/format";
import type { Obra, Persona } from "@/lib/types";
import { ResumenAdmin } from "@/components/ResumenAdmin";
import { MensajesAdmin, type Mensaje } from "@/components/MensajesAdmin";
import { EMAIL_ADMIN } from "@/components/EsAdmin";
import { aprobarSolicitudEntidad, rechazarSolicitudEntidad, solicitudesEntidad, type SolicitudEntidad, aprobarSolicitudObra, rechazarSolicitudObra, resolverSugerencia, solicitudesObra, sugerenciasPendientes, type SolicitudObra, type Sugerencia } from "@/lib/colaboracion";

type Reclamacion = { id: string; id_persona: string; uid: string; metodo: string; contacto: string; persona?: Persona | null; yaTiene?: Persona[] };

export default function AdminPage() {
  return <RequireAuth>{(user) => <Admin user={user} />}</RequireAuth>;
}

// Solo para administradores (custom claim admin=true, ver scripts/set-admin.mjs).
// Las reglas de Firestore impiden que cualquier otra persona lea o apruebe nada aquí.
function Admin({ user }: { user: User }) {
  const t = useT();
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null);
  const [lista, setLista] = useState<Reclamacion[]>([]);
  const [obras, setObras] = useState<(SolicitudObra & { obraDoc?: Obra | null })[]>([]);
  const [sugs, setSugs] = useState<Sugerencia[]>([]);
  const [entidades, setEntidades] = useState<(SolicitudEntidad & { fichaNombre?: string; dueno?: string })[]>([]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [tab, setTab] = useState<"resumen" | "mensajes" | "fichas" | "obras" | "sugerencias">("resumen");

  const cargar = useCallback(async () => {
    const tok = await user.getIdTokenResult(true);
    if (tok.claims.admin !== true || user.email !== EMAIL_ADMIN || !user.emailVerified) return setEsAdmin(false);
    setEsAdmin(true);
    const q = await getDocs(query(collection(db, "reclamaciones"), where("estado", "==", "pendiente")));
    const rs = q.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Reclamacion, "id">) }));
    setLista(await Promise.all(rs.map(async (r) => {
      // ¿Ya gestiona otra ficha? Entonces puede ser un duplicado que hay que unir
      const ya = await getDocs(query(collection(db, "persona"), where("coincide", "==", r.uid))).then((s) => s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Persona, "id">) }))).catch(() => [] as Persona[]);
      return { ...r, persona: await leer<Persona>("persona", r.id_persona), yaTiene: ya.filter((p) => p.id !== r.id_persona) };
    })));
    const se = await solicitudesEntidad();
    setEntidades(await Promise.all(se.map(async (x) => {
      const d = await leer<{ nombre?: string; nombre_prod?: string; creacion?: string }>(x.tipo === "sala" ? "salas" : "productoras", x.ref).catch(() => null);
      return { ...x, fichaNombre: d?.nombre ?? d?.nombre_prod ?? x.ref, dueno: d?.creacion ?? "" };
    })));
    const so = await solicitudesObra();
    setObras(await Promise.all(so.map(async (x) => ({ ...x, obraDoc: await leer<Obra>("obra", x.obra) }))));
    setSugs(await sugerenciasPendientes(null));
    const ms = await getDocs(collection(db, "fallos")).catch(() => null);
    setMensajes((ms?.docs ?? []).map((d) => ({ id: d.id, ...(d.data() as Omit<Mensaje, "id">) })).sort((a, b) => String(b.fecha ?? "").localeCompare(String(a.fecha ?? ""))));
  }, [user]);

  useEffect(() => { cargar(); }, [cargar]);

  async function aprobar(r: Reclamacion) {
    const b = writeBatch(db);
    b.update(doc(db, "persona", r.id_persona), { coincide: r.uid, verificado: true });
    b.update(doc(db, "reclamaciones", r.id), { estado: "aprobada" });
    await b.commit();
    await authFetch("/api/revalidar", { personas: [r.id_persona] }).catch(() => {});
    cargar();
  }
  async function rechazar(r: Reclamacion) {
    await updateDoc(doc(db, "reclamaciones", r.id), { estado: "rechazada" });
    cargar();
  }

  if (esAdmin === null) return <main className="wrap section"><p className="muted">{t("Comprobando permisos…")}</p></main>;
  if (!esAdmin) return <main className="wrap section"><h1 className="h2">{t("Página no disponible")}</h1><p className="soft">{t("Esta sección es privada.")}</p></main>;

  async function aprobarObra(x: SolicitudObra) {
    await aprobarSolicitudObra(x);
    await authFetch("/api/revalidar", { obras: [x.obra] }).catch(() => {});
    cargar();
  }
  const tabs = [
    { k: "resumen" as const, l: "Resumen", n: null },
    { k: "mensajes" as const, l: "Mensajes", n: mensajes.filter((m) => !m.atendido).length },
    { k: "fichas" as const, l: "Fichas, salas y compañías", n: lista.length + entidades.length },
    { k: "obras" as const, l: "Gestionar obras", n: obras.length },
    { k: "sugerencias" as const, l: "Sugerencias", n: sugs.length },
  ];

  return (
    <main className="wrap section" style={{ maxWidth: 1100 }}>
      <h1 className="h1" style={{ fontSize: 44, marginBottom: 24 }}>{t("Administración")}</h1>
      <div role="tablist" aria-label={t("Tipo de solicitud")} className="tabs" style={{ marginBottom: 24 }}>
        {tabs.map((tb) => <button key={tb.k} type="button" role="tab" className="tab" aria-selected={tab === tb.k} onClick={() => setTab(tb.k)}>{t(tb.l)} {tb.n !== null ? <span style={{ opacity: .7 }}>{tb.n}</span> : null}</button>)}
      </div>

      {tab === "resumen" ? <ResumenAdmin pendientes={{ mensajes: mensajes.filter((m) => !m.atendido).length, fichas: lista.length + entidades.length, obras: obras.length, sugerencias: sugs.length }} /> : null}
      {tab === "mensajes" ? <MensajesAdmin mensajes={mensajes} recargar={cargar} /> : null}

      {tab === "obras" ? (
        <div className="stack">
          {!obras.length ? <p className="soft">{t("Nadie ha pedido gestionar una obra.")}</p> : null}
          {obras.map((x) => (
            <div key={x.id} className="panel" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
              <div style={{ flex: "1 1 360px" }}>
                <Link href={`/obra/${x.obra}`} target="_blank" style={{ fontWeight: 600, fontSize: 18 }}>{x.obraDoc?.titulo ?? x.obra}</Link>
                <div className="hint">{(x.via === "reparto" ? t("{v} la pide por tener un crédito confirmado en la obra.", { v: x.nombre || x.uid }) : t("{v} la pide por ser dueño de su compañía.", { v: x.nombre || x.uid }))}</div>
                {x.motivo ? <p className="soft" style={{ margin: "8px 0 0", whiteSpace: "pre-line" }}>{x.motivo}</p> : null}
                <div className="hint">{t("Dueño actual: {v} · Solicitante: {uid}", { v: x.obraDoc?.creacion || "ninguno", uid: x.uid })}</div>
              </div>
              <div className="actions">
                <button type="button" className="btn btn-ghost" onClick={async () => { await rechazarSolicitudObra(x.id); cargar(); }}>{t("Rechazar")}</button>
                <button type="button" className="btn btn-primary" onClick={() => aprobarObra(x)}>{t("Pasarle la obra")}</button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "sugerencias" ? (
        <div className="stack">
          {!sugs.length ? <p className="soft">{t("No hay sugerencias pendientes.")}</p> : null}
          {sugs.map((sg) => (
            <div key={sg.id} className="panel" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
              <div style={{ flex: "1 1 360px" }}>
                <Link href={`/${sg.tipo === "productora" ? "compania" : sg.tipo}/${sg.ref}`} target="_blank" style={{ fontWeight: 600, fontSize: 18 }}>{sg.titulo_ficha}</Link>
                <div style={{ display: "flex", gap: 8, margin: "6px 0" }}><span className="chip">{sg.campo}</span>{!sg.dueno ? <span className="chip chip-foco">{t("Sin dueño: te toca a ti")}</span> : <span className="chip">{t("Tiene dueño")}</span>}</div>
                <p className="soft" style={{ margin: 0, whiteSpace: "pre-line" }}>{sg.texto}</p>
                <div className="hint">{t("De {v}", { v: sg.autor_nombre || sg.autor })}</div>
              </div>
              <div className="actions">
                <button type="button" className="btn btn-ghost" onClick={async () => { await resolverSugerencia(sg.id, "descartada"); cargar(); }}>{t("Descartar")}</button>
                <button type="button" className="btn btn-primary" onClick={async () => { await resolverSugerencia(sg.id, "aplicada"); cargar(); }}>{t("Hecho")}</button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "fichas" && !lista.length && !entidades.length ? <p className="soft">{t("No hay solicitudes pendientes.")}</p> : null}
      {tab === "fichas" && entidades.length ? (
        <div className="stack" style={{ marginBottom: 16 }}>
          {entidades.map((x) => (
            <div key={x.id} className="panel" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
              <div style={{ flex: "1 1 360px" }}>
                <span className="chip" style={{ marginBottom: 6 }}>{x.tipo === "sala" ? t("Sala") : t("Compañía")}</span>
                <Link href={`/${x.tipo}/${x.ref}`} target="_blank" style={{ fontWeight: 600, fontSize: 18, display: "block" }}>{x.fichaNombre}</Link>
                <div className="hint">{t("{nombre} · {cargo} · confirmar en: {contacto}", { nombre: x.nombre, cargo: x.cargo, contacto: x.contacto })}</div>
                {x.motivo ? <p className="soft" style={{ margin: "8px 0 0", whiteSpace: "pre-line" }}>{x.motivo}</p> : null}
                <div className="hint">{t("Dueño actual: {v} · Solicitante: {uid}", { v: x.dueno || "ninguno", uid: x.uid })}</div>
              </div>
              <div className="actions">
                <button type="button" className="btn btn-ghost" onClick={async () => { await rechazarSolicitudEntidad(x.id); cargar(); }}>{t("Rechazar")}</button>
                <button type="button" className="btn btn-primary" onClick={async () => { await aprobarSolicitudEntidad(x); await authFetch("/api/revalidar", x.tipo === "sala" ? { salas: [x.ref] } : {}).catch(() => {}); cargar(); }}>{t("Pasarle la ficha")}</button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="stack" hidden={tab !== "fichas"}>
        {lista.map((r) => (
          <div key={r.id} className="panel" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
            <div style={{ flex: "1 1 320px" }}>
              <Link href={`/persona/${r.id_persona}`} target="_blank" style={{ fontWeight: 600, fontSize: 18 }}>{r.persona ? nombreCompleto(r.persona) : r.id_persona}</Link>
              <div className="hint">{t("Verificación por {metodo}: {contacto}", { metodo: r.metodo, contacto: r.contacto })}</div>
              <div className="hint">{t("Usuario: {uid}", { uid: r.uid })}</div>
              {r.yaTiene?.length ? <div className="hint" style={{ color: "var(--foco)" }}>{t("Ojo: ya gestiona {join}. Puede ser un duplicado: habría que unir las fichas.", { join: r.yaTiene.map((p) => nombreCompleto(p)).join(", ") })}</div> : null}
            </div>
            <div className="actions">
              <button type="button" className="btn btn-ghost" onClick={() => rechazar(r)}>{t("Rechazar")}</button>
              <button type="button" className="btn btn-primary" onClick={() => aprobar(r)}>{t("Aprobar")}</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
