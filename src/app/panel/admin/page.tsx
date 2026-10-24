"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, query, updateDoc, where, writeBatch } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase-client";
import { RequireAuth } from "@/components/RequireAuth";
import { authFetch } from "@/components/AuthProvider";
import { leer } from "@/lib/client-data";
import { nombreCompleto } from "@/lib/format";
import type { Obra, Persona } from "@/lib/types";
import { aprobarSolicitudObra, rechazarSolicitudObra, resolverSugerencia, solicitudesObra, sugerenciasPendientes, type SolicitudObra, type Sugerencia } from "@/lib/colaboracion";

type Reclamacion = { id: string; id_persona: string; uid: string; metodo: string; contacto: string; persona?: Persona | null };

export default function AdminPage() {
  return <RequireAuth>{(user) => <Admin user={user} />}</RequireAuth>;
}

// Solo para administradores (custom claim admin=true, ver scripts/set-admin.mjs).
// Las reglas de Firestore impiden que cualquier otra persona lea o apruebe nada aquí.
function Admin({ user }: { user: User }) {
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null);
  const [lista, setLista] = useState<Reclamacion[]>([]);
  const [obras, setObras] = useState<(SolicitudObra & { obraDoc?: Obra | null })[]>([]);
  const [sugs, setSugs] = useState<Sugerencia[]>([]);
  const [tab, setTab] = useState<"fichas" | "obras" | "sugerencias">("fichas");

  const cargar = useCallback(async () => {
    const t = await user.getIdTokenResult(true);
    if (t.claims.admin !== true) return setEsAdmin(false);
    setEsAdmin(true);
    const q = await getDocs(query(collection(db, "reclamaciones"), where("estado", "==", "pendiente")));
    const rs = q.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Reclamacion, "id">) }));
    setLista(await Promise.all(rs.map(async (r) => ({ ...r, persona: await leer<Persona>("persona", r.id_persona) }))));
    const so = await solicitudesObra();
    setObras(await Promise.all(so.map(async (x) => ({ ...x, obraDoc: await leer<Obra>("obra", x.obra) }))));
    setSugs(await sugerenciasPendientes(null));
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

  if (esAdmin === null) return <main className="wrap section"><p className="muted">Comprobando permisos…</p></main>;
  if (!esAdmin) return <main className="wrap section"><p>Esta sección es solo para el equipo de Ziater.</p></main>;

  async function aprobarObra(x: SolicitudObra) {
    await aprobarSolicitudObra(x);
    await authFetch("/api/revalidar", { obras: [x.obra] }).catch(() => {});
    cargar();
  }
  const tabs = [
    { k: "fichas" as const, l: "Fichas de artista", n: lista.length },
    { k: "obras" as const, l: "Gestionar obras", n: obras.length },
    { k: "sugerencias" as const, l: "Sugerencias", n: sugs.length },
  ];

  return (
    <main className="wrap section" style={{ maxWidth: 1000 }}>
      <h1 className="h1" style={{ fontSize: 44, marginBottom: 24 }}>Administración</h1>
      <div role="tablist" aria-label="Tipo de solicitud" className="tabs" style={{ marginBottom: 24 }}>
        {tabs.map((t) => <button key={t.k} type="button" role="tab" className="tab" aria-selected={tab === t.k} onClick={() => setTab(t.k)}>{t.l} <span style={{ opacity: .7 }}>{t.n}</span></button>)}
      </div>

      {tab === "obras" ? (
        <div className="stack">
          {!obras.length ? <p className="soft">Nadie ha pedido gestionar una obra.</p> : null}
          {obras.map((x) => (
            <div key={x.id} className="panel" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
              <div style={{ flex: "1 1 360px" }}>
                <Link href={`/obra/${x.obra}`} target="_blank" style={{ fontWeight: 600, fontSize: 18 }}>{x.obraDoc?.titulo ?? x.obra}</Link>
                <div className="hint">{x.nombre || x.uid} la pide por {x.via === "reparto" ? "tener un crédito confirmado en la obra" : "ser dueño de su compañía"}.</div>
                {x.motivo ? <p className="soft" style={{ margin: "8px 0 0", whiteSpace: "pre-line" }}>{x.motivo}</p> : null}
                <div className="hint">Dueño actual: {x.obraDoc?.creacion || "ninguno"} · Solicitante: {x.uid}</div>
              </div>
              <div className="actions">
                <button type="button" className="btn btn-ghost" onClick={async () => { await rechazarSolicitudObra(x.id); cargar(); }}>Rechazar</button>
                <button type="button" className="btn btn-primary" onClick={() => aprobarObra(x)}>Pasarle la obra</button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "sugerencias" ? (
        <div className="stack">
          {!sugs.length ? <p className="soft">No hay sugerencias pendientes.</p> : null}
          {sugs.map((sg) => (
            <div key={sg.id} className="panel" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
              <div style={{ flex: "1 1 360px" }}>
                <Link href={`/${sg.tipo === "productora" ? "compania" : sg.tipo}/${sg.ref}`} target="_blank" style={{ fontWeight: 600, fontSize: 18 }}>{sg.titulo_ficha}</Link>
                <div style={{ display: "flex", gap: 8, margin: "6px 0" }}><span className="chip">{sg.campo}</span>{!sg.dueno ? <span className="chip chip-foco">Sin dueño: te toca a ti</span> : <span className="chip">Tiene dueño</span>}</div>
                <p className="soft" style={{ margin: 0, whiteSpace: "pre-line" }}>{sg.texto}</p>
                <div className="hint">De {sg.autor_nombre || sg.autor}</div>
              </div>
              <div className="actions">
                <button type="button" className="btn btn-ghost" onClick={async () => { await resolverSugerencia(sg.id, "descartada"); cargar(); }}>Descartar</button>
                <button type="button" className="btn btn-primary" onClick={async () => { await resolverSugerencia(sg.id, "aplicada"); cargar(); }}>Hecho</button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "fichas" && !lista.length ? <p className="soft">No hay solicitudes pendientes.</p> : null}
      <div className="stack" hidden={tab !== "fichas"}>
        {lista.map((r) => (
          <div key={r.id} className="panel" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
            <div style={{ flex: "1 1 320px" }}>
              <Link href={`/persona/${r.id_persona}`} target="_blank" style={{ fontWeight: 600, fontSize: 18 }}>{r.persona ? nombreCompleto(r.persona) : r.id_persona}</Link>
              <div className="hint">Verificación por {r.metodo}: {r.contacto}</div>
              <div className="hint">Usuario: {r.uid}</div>
            </div>
            <div className="actions">
              <button type="button" className="btn btn-ghost" onClick={() => rechazar(r)}>Rechazar</button>
              <button type="button" className="btn btn-primary" onClick={() => aprobar(r)}>Aprobar</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
