"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { EVENTO_CONSENTIMIENTO, abrirBannerCookies, guardarConsentimiento, leerConsentimiento } from "@/lib/consentimiento";

/**
 * Banner de cookies. Ziater no usa cookies publicitarias; solo pide permiso para
 * las estadísticas anónimas (Vercel Analytics y la marca de visitante del contador
 * propio). «Rechazar» y «Aceptar» tienen el mismo peso y el mismo tamaño.
 */
export function BannerCookies() {
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
        <section className="banner-cookies" role="region" aria-label="Preferencias de cookies">
          <p style={{ margin: 0 }}>
            <strong style={{ color: "var(--papel)" }}>Sin cookies publicitarias.</strong> Solo usamos lo imprescindible para que la web funcione. Si nos dejas, también contamos tu visita de forma anónima para saber qué secciones se usan más.{" "}
            <Link href="/politica-de-cookies">Más información</Link>
          </p>
          <div className="banner-cookies-botones">
            <button type="button" className="btn" onClick={() => guardarConsentimiento("no")}>Rechazar</button>
            <button type="button" className="btn" onClick={() => guardarConsentimiento("si")}>Aceptar</button>
          </div>
        </section>
      ) : null}
    </>
  );
}

/** Enlace del pie para cambiar la elección en cualquier momento. */
export function EnlaceCookies() {
  return <button type="button" className="enlace-pie" onClick={abrirBannerCookies}>Configurar cookies</button>;
}
