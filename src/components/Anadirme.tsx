"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authFetch, useAuth } from "./AuthProvider";
import { useToast } from "./Toast";
import { anadirCredito, creditosDe, miPersona } from "@/lib/client-data";
import { DEPARTAMENTOS } from "@/lib/format";
import type { Persona } from "@/lib/types";

/**
 * «¿Formaste parte? Añádete» sin salir de la obra: eliges tu papel y queda
 * enlazado a tu ficha. Si la obra es tuya se confirma al momento; si no,
 * le llega a quien la gestiona para que lo confirme (en Vínculos).
 */
export function Anadirme({ obraId, titulo, duenoObra, anoinicio, anofin, texto = "¿Formaste parte? Añádete" }: {
  obraId: string; titulo: string; duenoObra?: string; anoinicio?: string | number; anofin?: string | number; texto?: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const avisar = useToast();
  const [abierto, setAbierto] = useState(false);
  const [yo, setYo] = useState<Persona | null | undefined>(undefined);
  const [yaEstoy, setYaEstoy] = useState(false);
  const [dep, setDep] = useState("Interpretación");
  const [cargo, setCargo] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "error">("idle");

  useEffect(() => {
    if (!abierto || !user) return;
    (async () => {
      const p = await miPersona(user.uid);
      setYo(p);
      if (p) setYaEstoy((await creditosDe("id_persona", p.id)).some((c) => c.id_obra === obraId));
    })();
  }, [abierto, user, obraId]);
  useEffect(() => {
    if (!abierto) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [abierto]);

  function abrir() {
    if (!user) return router.push(`/login?next=${encodeURIComponent(path)}`);
    setEstado("idle");
    setAbierto(true);
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || !yo) return;
    setEstado("enviando");
    const confirmado = duenoObra === user.uid;
    try {
      const fin = String(anofin ?? "");
      await anadirCredito({ id_obra: obraId, id_persona: yo.id, puesto: dep, titulo: cargo.trim() || dep, fecha_inicio: String(anoinicio ?? ""), fecha_fin: fin === "0" ? "" : fin }, confirmado);
      setAbierto(false);
      if (confirmado) {
        await authFetch("/api/revalidar", { obras: [obraId], personas: [yo.id] }).catch(() => {});
        avisar("Añadido. Ya apareces en la obra y en tu trayectoria.");
        router.refresh();
      } else {
        avisar("Enviado. Aparecerás en la obra cuando quien la gestiona lo confirme.");
      }
    } catch {
      setEstado("error");
    }
  }

  return (
    <>
      <button type="button" className="enlace" onClick={abrir}>{texto}</button>
      {abierto ? (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="anadirme-titulo" onClick={(e) => { if (e.target === e.currentTarget) setAbierto(false); }}>
          <div className="modal-caja">
            <h2 id="anadirme-titulo" className="h2">Añádete a «{titulo}»</h2>
            {yo === undefined ? <p className="muted">Un momento…</p> : !yo ? (
              <div className="stack" style={{ gap: 14, marginTop: 12 }}>
                <p className="soft" style={{ margin: 0 }}>Para aparecer en el elenco o el equipo necesitas una ficha de artista. Crearla lleva un minuto (o reclama la tuya si ya existe).</p>
                <div className="actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setAbierto(false)}>Ahora no</button>
                  <Link href="/panel/bienvenida" className="btn btn-primary">Crear o reclamar mi ficha</Link>
                </div>
              </div>
            ) : yaEstoy ? (
              <div className="stack" style={{ gap: 14, marginTop: 12 }}>
                <p className="soft" style={{ margin: 0 }}>Ya estás en esta obra. Si el papel no es correcto, puedes cambiarlo desde tu ficha.</p>
                <div className="actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setAbierto(false)}>Cerrar</button>
                  <Link href="/panel/ficha" className="btn btn-primary">Ir a mi ficha</Link>
                </div>
              </div>
            ) : (
              <form className="stack" style={{ gap: 16, marginTop: 12 }} onSubmit={enviar}>
                <div className="field">
                  <label className="label" htmlFor="an-dep">¿Qué hiciste?</label>
                  <select id="an-dep" className="select" value={dep} onChange={(e) => setDep(e.target.value)}>
                    {DEPARTAMENTOS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="an-cargo">{dep === "Interpretación" ? "Personaje" : "Cargo (opcional)"}</label>
                  <input id="an-cargo" className="input" maxLength={150} value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder={dep === "Interpretación" ? "Por ejemplo: Arancha" : "Por ejemplo: Ayudante de dirección"} />
                </div>
                <p className="hint" style={{ margin: 0 }}>
                  {duenoObra === user?.uid ? "Es tu obra: aparecerás al momento." : "Le pediremos a quien gestiona la obra que lo confirme. Mientras tanto saldrá como pendiente en tu panel."}
                </p>
                {estado === "error" ? <p className="error" role="alert" style={{ margin: 0 }}>No se pudo guardar. Inténtalo de nuevo.</p> : null}
                <div className="actions" style={{ justifyContent: "flex-end" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setAbierto(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={estado === "enviando"}>{estado === "enviando" ? "Guardando…" : "Añadirme"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
