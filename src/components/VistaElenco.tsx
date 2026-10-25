"use client";

import { useState } from "react";

type Vista = "actual" | "original" | "todos";

/**
 * Botones «Actual / Original / Todos» para obras cuyo elenco o equipo ha cambiado.
 * Todas las personas van en el HTML (para Google); los botones solo deciden cuáles
 * se ven, mediante data-vista y las clases .fuera-actual / .fuera-original.
 */
export function VistaElenco({ activa, total, children }: { activa: boolean; total: number; children: React.ReactNode }) {
  const [vista, setVista] = useState<Vista>("actual");
  const opciones: [Vista, string][] = [["actual", activa ? "Actual" : "Último"], ["original", "Original"], ["todos", `Todos · ${total}`]];
  return (
    <div data-vista={vista} className="con-vista">
      <div role="group" aria-label="Qué elenco ver" className="vista-elenco" style={{ marginBottom: 20 }}>
        {opciones.map(([v, l]) => (
          <button key={v} type="button" className="chip" aria-pressed={vista === v} onClick={() => setVista(v)}>{l}</button>
        ))}
      </div>
      {children}
    </div>
  );
}
