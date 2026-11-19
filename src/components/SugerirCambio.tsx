"use client";

import { useEffect, useState } from "react";
import { useRouter, useT, usePathname } from "@/components/Idioma";
import { useAuth } from "./AuthProvider";
import { CAMPOS_SUGERENCIA, enviarSugerencia, type TipoFicha } from "@/lib/colaboracion";

/**
 * «Sugerir un cambio»: cualquiera con cuenta propone una corrección y le llega
 * a quien gestiona la ficha (en su bandeja de Vínculos), o a administración si
 * la ficha no tiene dueño.
 */
export function SugerirCambio({ tipo, refId, nombre, className = "btn" }: { tipo: TipoFicha; refId: string; nombre: string; className?: string }) {
  const t = useT();
  const { user } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [campo, setCampo] = useState<string>(CAMPOS_SUGERENCIA[0]);
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");

  useEffect(() => {
    if (!abierto) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [abierto]);

  function abrir() {
    if (!user) return router.push(`/login?next=${encodeURIComponent(path)}`);
    setEstado("idle");
    setTexto("");
    setAbierto(true);
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (texto.trim().length < 3) return;
    setEstado("enviando");
    try {
      await enviarSugerencia(tipo, refId, campo, texto);
      setEstado("ok");
    } catch {
      setEstado("error");
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={abrir}>{t("Sugerir un cambio")}</button>
      {abierto ? (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="sug-titulo" onClick={(e) => { if (e.target === e.currentTarget) setAbierto(false); }}>
          <div className="modal-caja">
            {estado === "ok" ? (
              <div className="stack" style={{ gap: 14 }}>
                <h2 id="sug-titulo" className="h2">{t("¡Gracias!")}</h2>
                <p className="soft" style={{ margin: 0 }}>{t("Tu sugerencia ha llegado a quien gestiona la ficha de «{nombre}». Si no tiene dueño, la revisará el equipo de Ziater.", { nombre: nombre })}</p>
                <button type="button" className="btn btn-primary" onClick={() => setAbierto(false)}>{t("Cerrar")}</button>
              </div>
            ) : (
              <form className="stack" style={{ gap: 16 }} onSubmit={enviar}>
                <div>
                  <h2 id="sug-titulo" className="h2">{t("Sugerir un cambio")}</h2>
                  <p className="soft" style={{ margin: "6px 0 0" }}>{t("en «{nombre}»", { nombre: nombre })}</p>
                </div>
                <div className="field">
                  <label className="label" htmlFor="sug-campo">{t("¿Qué hay que cambiar?")}</label>
                  <select id="sug-campo" className="select" value={campo} onChange={(e) => setCampo(e.target.value)}>
                    {CAMPOS_SUGERENCIA.map((c) => <option key={c} value={c}>{t(c)}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="sug-texto">{t("Cuéntalo")}</label>
                  <textarea id="sug-texto" className="textarea" rows={5} maxLength={2000} required value={texto} onChange={(e) => setTexto(e.target.value)}
                    placeholder={t("Por ejemplo: el estreno fue en 2019, no en 2020. Lo dice el programa de mano del Teatro…")} />
                  <span className="hint">{t("Si puedes, di de dónde sale el dato. Quien gestiona la ficha verá tu nombre.")}</span>
                </div>
                {estado === "error" ? <p className="error" role="alert" style={{ margin: 0 }}>{t("No se pudo enviar. Inténtalo de nuevo.")}</p> : null}
                <div className="actions" style={{ justifyContent: "flex-end" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setAbierto(false)}>{t("Cancelar")}</button>
                  <button type="submit" className="btn btn-primary" disabled={estado === "enviando" || texto.trim().length < 3}>{estado === "enviando" ? t("Enviando…") : t("Enviar sugerencia")}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
