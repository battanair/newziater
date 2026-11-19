"use client";

import Link, { useT } from "@/components/Idioma";
import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { EVENTO_CONSENTIMIENTO, abrirBannerCookies, guardarConsentimiento, leerConsentimiento } from "@/lib/consentimiento";

/**
 * Banner de cookies. Ziater no usa cookies publicitarias; solo pide permiso para
 * las estadísticas anónimas (Vercel Analytics y la marca de visitante del contador
 * propio). «Rechazar» y «Aceptar» tienen el mismo peso y el mismo tamaño.
 */
export function BannerCookies() {
  const t = useT();
  const [estado, setEstado] = useState<"si" | "no" | null | "cargando">("cargando");
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const v = leerConsentimiento();
    setEstado(v);
    setAbierto(v === null);
    const f = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d === "abrir") setAbierto(true);
      else { setEstado(d); setAbierto(false); }
    };
    window.addEventListener(EVENTO_CONSENTIMIENTO, f);
    return () => window.removeEventListener(EVENTO_CONSENTIMIENTO, f);
  }, []);

  return (
    <>
      {estado === "si" ? <Analytics /> : null}
      {abierto ? (
        <section className="banner-cookies" role="region" aria-label={t("Preferencias de cookies")}>
          <p style={{ margin: 0 }}>
            <strong style={{ color: "var(--papel)" }}>{t("Sin cookies publicitarias.")}</strong>{" "}{t("Solo usamos lo imprescindible para que la web funcione. Si nos dejas, también contamos tu visita de forma anónima para saber qué secciones se usan más.")}{" "}
            <Link href="/politica-de-cookies">{t("Más información")}</Link>
          </p>
          <div className="banner-cookies-botones">
            <button type="button" className="btn" onClick={() => guardarConsentimiento("no")}>{t("Rechazar")}</button>
            <button type="button" className="btn" onClick={() => guardarConsentimiento("si")}>{t("Aceptar")}</button>
          </div>
        </section>
      ) : null}
    </>
  );
}

/** Enlace del pie para cambiar la elección en cualquier momento. */
export function EnlaceCookies() {
  const t = useT();
  return <button type="button" className="enlace-pie" onClick={abrirBannerCookies}>{t("Configurar cookies")}</button>;
}
