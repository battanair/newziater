"use client";

import { useEffect, useId, useRef, useState } from "react";

/** Botón «?» con una explicación corta. Se cierra con Esc o pulsando fuera. */
export function Ayuda({ children, etiqueta = "Más información" }: { children: React.ReactNode; etiqueta?: string }) {
  const [abierta, setAbierta] = useState(false);
  const id = useId();
  const caja = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!abierta) return;
    const fuera = (e: MouseEvent) => { if (!caja.current?.contains(e.target as Node)) setAbierta(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierta(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fuera); document.removeEventListener("keydown", esc); };
  }, [abierta]);

  return (
    <span className="ayuda" ref={caja}>
      <button type="button" className="ayuda-btn" aria-label={etiqueta} aria-expanded={abierta} aria-controls={id} onClick={() => setAbierta((x) => !x)}>?</button>
      {abierta ? <span id={id} role="tooltip" className="ayuda-pop">{children}</span> : null}
    </span>
  );
}
