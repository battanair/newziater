"use client";

import { useEffect, useState } from "react";
import { versiones, type Version } from "@/lib/colaboracion";

const NOMBRES: Record<string, string> = {
  titulo: "título", sinopsis: "sinopsis", anoinicio: "año de estreno", anofin: "año de fin", cartel: "cartel", instagram: "Instagram",
  trailer: "tráiler", categoria: "géneros", idioma: "idioma", duracion: "duración", fotos_obra: "galería", fotosObra: "galería",
  Nombre: "nombre", Apellidos: "apellidos", biografia: "biografía", foto: "retrato", ciudad: "ciudad", roles: "roles", destacadas: "obras destacadas",
};

/**
 * Versiones anteriores de una obra o ficha. «Recuperar» vuelca esa versión en
 * el formulario; al guardar, la actual pasa a su vez al historial.
 */
export function Historial({ tipo, refId, onRecuperar, recarga = 0 }: { tipo: "obra" | "persona"; refId: string; onRecuperar: (antes: Record<string, unknown>) => void; recarga?: number }) {
  const [lista, setLista] = useState<Version[] | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [recuperada, setRecuperada] = useState("");

  useEffect(() => { versiones(tipo, refId).then(setLista).catch(() => setLista([])); }, [tipo, refId, recarga]);

  if (!lista?.length) return null;
  const fecha = (v: Version) => (v.fecha ? new Date(v.fecha.seconds * 1000).toLocaleString("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "ahora");

  return (
    <section className="panel" style={{ marginTop: 8 }}>
      <button type="button" className="btn btn-ghost" style={{ width: "100%", justifyContent: "space-between", padding: 0, minHeight: 32 }} aria-expanded={abierto} onClick={() => setAbierto((x) => !x)}>
        <span className="eyebrow" style={{ margin: 0 }}>Historial de cambios · {lista.length}</span>
        <span aria-hidden="true">{abierto ? "−" : "+"}</span>
      </button>
      {abierto ? (
        <>
          <p className="hint" style={{ margin: "10px 0 6px" }}>Si has borrado o cambiado algo por error, recupera cómo estaba. Se carga en el formulario y no se guarda hasta que pulses Guardar o Publicar.</p>
          <ul className="list">
            {lista.map((v) => (
              <li key={v.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "12px 0" }}>
                <span style={{ flex: "1 1 220px" }}>
                  <strong style={{ display: "block", fontSize: 15 }}>Antes del cambio del {fecha(v)}</strong>
                  <span className="hint">Cambió: {[...new Set((v.cambios ?? []).map((c) => NOMBRES[c] ?? c))].join(", ")}</span>
                </span>
                <button type="button" className="btn" onClick={() => { onRecuperar(v.antes); setRecuperada(v.id); }}>{recuperada === v.id ? "✓ Cargada en el formulario" : "Recuperar esta versión"}</button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
