"use client";

import { useState } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-client";

export interface Mensaje {
  id: string;
  tipo?: "consulta" | "ficha" | "borrado";
  nombre?: string;
  email?: string;
  mensaje?: string;
  fecha?: string;
  atendido?: boolean;
}

const MOTIVO: Record<string, { l: string; clase: string }> = {
  consulta: { l: "Pregunta o sugerencia", clase: "" },
  ficha: { l: "Corregir o retirar una ficha", clase: "chip-foco" },
  borrado: { l: "Privacidad · borrar datos", clase: "chip-peligro" },
};
const UN_AÑO = 365 * 86400_000;

/** Mensajes del formulario de contacto (colección «fallos»), solo para administración. */
export function MensajesAdmin({ mensajes, recargar }: { mensajes: Mensaje[]; recargar: () => void }) {
  const [ver, setVer] = useState<"pendientes" | "atendidos">("pendientes");
  const [borrando, setBorrando] = useState<string | null>(null);
  const lista = mensajes.filter((m) => (ver === "pendientes" ? !m.atendido : m.atendido));
  const antiguos = mensajes.filter((m) => m.fecha && Date.now() - Date.parse(m.fecha) > UN_AÑO).length;

  async function atendido(m: Mensaje, v: boolean) {
    await updateDoc(doc(db, "fallos", m.id), { atendido: v });
    recargar();
  }
  async function borrar(m: Mensaje) {
    await deleteDoc(doc(db, "fallos", m.id));
    setBorrando(null);
    recargar();
  }

  return (
    <section>
      <div role="group" aria-label="Qué mensajes ver" style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <button type="button" className="chip" aria-pressed={ver === "pendientes"} onClick={() => setVer("pendientes")}>Pendientes · {mensajes.filter((m) => !m.atendido).length}</button>
        <button type="button" className="chip" aria-pressed={ver === "atendidos"} onClick={() => setVer("atendidos")}>Atendidos · {mensajes.filter((m) => m.atendido).length}</button>
      </div>
      {antiguos ? (
        <p className="panel panel-foco" style={{ marginBottom: 16 }}>
          Hay {antiguos} {antiguos === 1 ? "mensaje" : "mensajes"} de hace más de un año. La política de privacidad dice que no se guardan más tiempo: bórralos cuando puedas.
        </p>
      ) : null}
      {!lista.length ? <p className="soft">{ver === "pendientes" ? "No tienes mensajes pendientes." : "Aún no has marcado ningún mensaje como atendido."}</p> : null}
      <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {lista.map((m) => {
          const motivo = MOTIVO[m.tipo ?? "consulta"] ?? MOTIVO.consulta;
          const fecha = m.fecha ? new Date(m.fecha).toLocaleString("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
          const asunto = encodeURIComponent(m.tipo === "borrado" ? "Tu solicitud de privacidad en Ziater" : "Tu mensaje a Ziater");
          return (
            <li key={m.id} className="panel">
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span className={`chip ${motivo.clase}`}>{motivo.l}</span>
                <strong style={{ color: "var(--papel)" }}>{m.nombre || "Sin nombre"}</strong>
                {m.email ? <span className="soft">{m.email}</span> : null}
                <span className="hint" style={{ marginLeft: "auto" }}>{fecha}</span>
              </div>
              <p style={{ margin: "0 0 14px", whiteSpace: "pre-line", color: "var(--texto-2)" }}>{m.mensaje}</p>
              <div className="actions">
                {m.email ? <a className="btn btn-primary" href={`mailto:${m.email}?subject=${asunto}`}>Responder por email</a> : null}
                <button type="button" className="btn" onClick={() => atendido(m, !m.atendido)}>{m.atendido ? "Volver a pendientes" : "Marcar como atendido"}</button>
                {borrando === m.id ? (
                  <>
                    <span className="hint">¿Borrarlo para siempre?</span>
                    <button type="button" className="btn btn-peligro" onClick={() => borrar(m)}>Sí, borrar</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setBorrando(null)}>No</button>
                  </>
                ) : (
                  <button type="button" className="btn btn-ghost" onClick={() => setBorrando(m.id)}>Borrar</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
