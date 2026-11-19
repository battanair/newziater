"use client";

import { usePathname } from "next/navigation";
import { COOKIE_IDIOMA, ruta, sinIdioma, type Idioma } from "@/lib/i18n";
import { useIdioma, useT } from "./Idioma";

/** ES · EN: lleva a la misma página en el otro idioma y lo recuerda para la próxima visita. */
export function SelectorIdioma({ compacto }: { compacto?: boolean }) {
  const lang = useIdioma();
  const t = useT();
  const path = sinIdioma(usePathname() || "/");
  const ir = (l: Idioma) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    try { document.cookie = `${COOKIE_IDIOMA}=${l}; path=/; max-age=31536000; samesite=lax; secure`; } catch {}
    e.currentTarget.href = ruta(l, path) + window.location.search + window.location.hash;
  };
  // Compacto (cabecera en móvil): un solo botón con el otro idioma
  if (compacto) {
    const otro: Idioma = lang === "es" ? "en" : "es";
    return (
      <a href={ruta(otro, path)} hrefLang={otro} lang={otro} onClick={ir(otro)} className="btn btn-ghost idioma-otro" aria-label={otro === "es" ? "Ver en español" : "View in English"} title={otro === "es" ? "Español" : "English"}>
        {otro.toUpperCase()}
      </a>
    );
  }
  return (
    <nav aria-label={t("Idioma")} className="idiomas">
      {(["es", "en"] as const).map((l) => (
        <a key={l} href={ruta(l, path)} hrefLang={l} lang={l} onClick={ir(l)} aria-current={l === lang ? "true" : undefined}
          aria-label={l === "es" ? "Español" : "English"}>
          {l.toUpperCase()}
        </a>
      ))}
    </nav>
  );
}
