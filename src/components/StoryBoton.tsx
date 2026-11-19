"use client";


import { useIdioma, useT } from "@/components/Idioma";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { miPersona } from "@/lib/client-data";

/**
 * «Compartir en stories»: genera una imagen vertical de la obra para Instagram,
 * WhatsApp o TikTok. Si la persona con sesión está en el elenco o el equipo,
 * puede elegir «Estoy en el elenco»; si no, «Te recomiendo».
 */
export function StoryBoton({ obraId, titulo, personasEnObra }: { obraId: string; titulo: string; personasEnObra: string[] }) {
  const t = useT();
  const lang = useIdioma();
  const { user } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [miFicha, setMiFicha] = useState<string | null>(null);
  const [tipo, setTipo] = useState<"recomiendo" | "elenco">("recomiendo");
  const [cargando, setCargando] = useState(true);
  const [msg, setMsg] = useState("");
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!user || !abierto) return;
    miPersona(user.uid).then((p) => {
      if (p && personasEnObra.includes(p.id)) { setMiFicha(p.id); setTipo("elenco"); }
    }).catch(() => {});
  }, [user, abierto, personasEnObra]);

  useEffect(() => {
    if (abierto) dialogo.current?.showModal();
    else dialogo.current?.close();
  }, [abierto]);

  const src = `/api/story?obra=${obraId}&tipo=${tipo}${tipo === "elenco" && miFicha ? `&persona=${miFicha}` : ""}${lang === "en" ? "&lang=en" : ""}`;
  const nombreArchivo = `ziater-${titulo.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.png`;

  async function compartir() {
    setMsg("");
    try {
      const blob = await (await fetch(src)).blob();
      const archivo = new File([blob], nombreArchivo, { type: "image/png" });
      if (navigator.canShare?.({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: titulo, text: t("{titulo} en Ziater: {url}", { titulo, url: location.href }) });
      } else {
        descargar(blob);
        setMsg(t("Imagen descargada. Súbela a tus stories desde la galería."));
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setMsg(t("No se pudo compartir. Prueba con «Descargar»."));
    }
  }
  async function descargar(blob?: Blob) {
    const b = blob ?? (await (await fetch(src)).blob());
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = nombreArchivo;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  return (
    <>
      <button type="button" className="btn" onClick={() => { setAbierto(true); setCargando(true); }}>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>{t("Compartir en stories")}</button>
      <dialog ref={dialogo} className="dialogo-story" aria-labelledby="story-titulo" onClose={() => setAbierto(false)} onClick={(e) => { if (e.target === dialogo.current) setAbierto(false); }}>
        {abierto ? (
          <div className="stack" style={{ gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <h2 id="story-titulo" className="h3" style={{ margin: 0 }}>{t("Compartir en stories")}</h2>
              <button type="button" className="btn btn-ghost" aria-label={t("Cerrar")} onClick={() => setAbierto(false)}>✕</button>
            </div>
            {miFicha ? (
              <div role="group" aria-label={t("Tipo de imagen")} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button type="button" className="chip" aria-pressed={tipo === "elenco"} onClick={() => { setTipo("elenco"); setCargando(true); }}>{t("Estoy en el elenco")}</button>
                <button type="button" className="chip" aria-pressed={tipo === "recomiendo"} onClick={() => { setTipo("recomiendo"); setCargando(true); }}>{t("Te recomiendo")}</button>
              </div>
            ) : null}
            <div className="story-vista" aria-busy={cargando}>
              {cargando ? <span className="hint story-cargando">{t("Preparando la imagen…")}</span> : null}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={src} src={src} alt={t("Imagen para stories de {titulo}", { titulo: titulo })} onLoad={() => setCargando(false)} onError={() => { setCargando(false); setMsg(t("No se pudo generar la imagen. Inténtalo de nuevo.")); }} />
            </div>
            <div className="actions" style={{ justifyContent: "center" }}>
              <button type="button" className="btn btn-primary" onClick={compartir} disabled={cargando}>{t("Compartir")}</button>
              <button type="button" className="btn" onClick={() => descargar()} disabled={cargando}>{t("Descargar")}</button>
            </div>
            {msg ? <p className="hint" role="status" style={{ textAlign: "center", margin: 0 }}>{msg}</p> : <p className="hint" style={{ textAlign: "center", margin: 0 }}>{t("En el móvil, «Compartir» te deja enviarla directamente a Instagram o WhatsApp.")}</p>}
          </div>
        ) : null}
      </dialog>
    </>
  );
}
