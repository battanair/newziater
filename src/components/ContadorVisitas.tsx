"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { doc, increment, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { hoyES } from "@/lib/format";

/** Sección de la web para el resumen de visitas. */
function seccionDe(path: string) {
  if (path === "/") return "inicio";
  if (path.startsWith("/obra/")) return "obra";
  if (path.startsWith("/persona/")) return "persona";
  if (path.startsWith("/compania/")) return "compania";
  if (/^\/(obras|personas|companias|colaboradores)/.test(path)) return "listados";
  if (path.startsWith("/buscar")) return "busqueda";
  return "otras";
}

/**
 * Contador de visitas propio y anónimo: suma 1 al día y a la sección visitada
 * (y 1 visitante la primera vez que un navegador entra cada día). No guarda
 * quién eres ni usa cookies. No cuenta el panel privado, robots ni al administrador.
 */
export function ContadorVisitas() {
  const path = usePathname();
  useEffect(() => {
    if (!path || /^\/(panel|login|signup|reclamar)/.test(path)) return;
    if (typeof navigator !== "undefined" && navigator.webdriver) return;
    let noContar = false, nuevoHoy = false;
    const dia = hoyES();
    try {
      noContar = localStorage.getItem("ziater-no-contar") === "1";
      nuevoHoy = localStorage.getItem("ziater-visto") !== dia;
      if (!noContar && nuevoHoy) localStorage.setItem("ziater-visto", dia);
    } catch { /* sin almacenamiento: se cuenta la visita pero no el visitante */ }
    if (noContar) return;
    const t = setTimeout(() => {
      setDoc(doc(db, "estadisticas", dia), { total: increment(1), [seccionDe(path)]: increment(1), ...(nuevoHoy ? { visitantes: increment(1) } : {}) }, { merge: true }).catch(() => {});
    }, 1200); // solo si se queda en la página un momento
    return () => clearTimeout(t);
  }, [path]);
  return null;
}
