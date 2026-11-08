// Consentimiento de estadísticas (cookies/almacenamiento no imprescindibles).
// Se guarda en el propio navegador. "si" | "no" | null (aún no ha elegido).
const CLAVE = "ziater-consentimiento-v1";
export const EVENTO_CONSENTIMIENTO = "ziater-consentimiento";

export function leerConsentimiento(): "si" | "no" | null {
  try {
    const v = localStorage.getItem(CLAVE);
    return v === "si" || v === "no" ? v : null;
  } catch {
    return null;
  }
}

export function guardarConsentimiento(v: "si" | "no") {
  try {
    localStorage.setItem(CLAVE, v);
    if (v === "no") localStorage.removeItem("ziater-visto"); // se borra la marca del contador si la había
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENTO_CONSENTIMIENTO, { detail: v }));
}

/** Vuelve a mostrar el banner (enlace «Configurar cookies» del pie). */
export function abrirBannerCookies() {
  window.dispatchEvent(new CustomEvent(EVENTO_CONSENTIMIENTO, { detail: "abrir" }));
}

/** Versión vigente de los términos y la política de privacidad (fecha de la última actualización). */
export const VERSION_TERMINOS = "2026-11-08";
/** Edad mínima para tener cuenta (LOPDGDD, art. 7). */
export const EDAD_MINIMA = 14;
