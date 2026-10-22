"use client";

import { useEffect, useState } from "react";

type Modo = "oscuro" | "claro";
export const CLAVE_MODO = "ziater-modo";

/** Se inyecta en <head> para aplicar el modo guardado antes de pintar y evitar el destello. */
export const SCRIPT_MODO = `try{if(localStorage.getItem("${CLAVE_MODO}")==="claro")document.documentElement.dataset.modo="claro"}catch(e){}`;

function aplicar(m: Modo) {
  if (m === "claro") document.documentElement.dataset.modo = "claro";
  else delete document.documentElement.dataset.modo;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", m === "claro" ? "#f6f2ea" : "#131210");
}

const Sol = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" />
  </svg>
);
const Luna = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z" />
  </svg>
);

/** Botón para cambiar entre fondo oscuro (por defecto) y claro. Recuerda la elección. */
export function ModoToggle() {
  const [modo, setModo] = useState<Modo>("oscuro");
  useEffect(() => {
    setModo(document.documentElement.dataset.modo === "claro" ? "claro" : "oscuro");
  }, []);

  function cambiar() {
    const m: Modo = modo === "claro" ? "oscuro" : "claro";
    setModo(m);
    aplicar(m);
    try { localStorage.setItem(CLAVE_MODO, m); } catch { /* navegación privada: solo dura esta visita */ }
  }

  const texto = `Cambiar a modo ${modo === "claro" ? "oscuro" : "claro"}`;
  return (
    <button type="button" className="btn modo" onClick={cambiar} aria-label={texto} title={texto}>
      {modo === "claro" ? <Luna /> : <Sol />}
    </button>
  );
}
