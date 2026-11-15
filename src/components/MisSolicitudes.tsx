"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { misSolicitudes, type MiSolicitud } from "@/lib/colaboracion";

const RUTA: Record<MiSolicitud["tipo"], string> = { persona: "persona", obra: "obra", sala: "sala", compania: "compania" };
const QUE: Record<MiSolicitud["tipo"], string> = { persona: "Ficha de artista", obra: "Obra", sala: "Sala", compania: "Compañía" };
const ESTADO: Record<MiSolicitud["estado"], { t: string; c: string }> = {
  pendiente: { t: "En revisión", c: "chip" },
  aprobada: { t: "Aprobada", c: "chip chip-ok" },
  rechazada: { t: "No aprobada", c: "chip" },
};

/** Estado de lo que el usuario ha pedido gestionar. Solo aparece si ha pedido algo. */
export function MisSolicitudes({ uid }: { uid: string }) {
  const [lista, setLista] = useState<MiSolicitud[]>([]);
  useEffect(() => { misSolicitudes(uid).then(setLista).catch(() => {}); }, [uid]);
  if (!lista.length) return null;
  return (
    <div className="panel">
      <h2 className="eyebrow">Tus solicitudes</h2>
      <ul className="list" style={{ margin: 0 }}>
        {lista.slice(0, 6).map((s) => (
          <li key={s.id} style={{ padding: "10px 0", display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ minWidth: 0 }}>
              <Link href={`/${RUTA[s.tipo]}/${s.ref}`} style={{ fontWeight: 600, display: "block" }}>{s.nombre}</Link>
              <span className="hint">{QUE[s.tipo]}</span>
            </span>
            <span className={ESTADO[s.estado]?.c ?? "chip"} style={{ flex: "none" }}>{ESTADO[s.estado]?.t ?? s.estado}</span>
          </li>
        ))}
      </ul>
      {lista.some((s) => s.estado === "rechazada") ? <p className="hint" style={{ margin: "8px 0 0" }}>¿Crees que es un error? <Link href="/contacto" style={{ textDecoration: "underline" }}>Escríbenos</Link>.</p> : null}
      {lista.some((s) => s.estado === "pendiente") ? <p className="hint" style={{ margin: "8px 0 0" }}>Solemos revisarlas en uno o dos días. El estado se actualiza aquí.</p> : null}
    </div>
  );
}
