"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type Opciones = { deshacer?: () => void | Promise<void>; error?: boolean };
type Aviso = { id: number; texto: string } & Opciones;

const Ctx = createContext<(texto: string, opciones?: Opciones) => void>(() => {});

/** Avisos breves abajo de la pantalla («Guardado», «Quitada de tu lista · Deshacer»). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const n = useRef(0);

  const quitar = useCallback((id: number) => setAvisos((l) => l.filter((a) => a.id !== id)), []);
  const avisar = useCallback((texto: string, opciones: Opciones = {}) => {
    const id = (n.current = (n.current ?? 0) + 1);
    setAvisos((l) => [...l.slice(-2), { id, texto, ...opciones }]);
    setTimeout(() => quitar(id), opciones.deshacer ? 7000 : 3500);
  }, [quitar]);

  return (
    <Ctx.Provider value={avisar}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className={`toast ${a.error ? "toast-error" : ""}`}>
            <span>{a.texto}</span>
            {a.deshacer ? (
              <button type="button" className="toast-btn" onClick={async () => { quitar(a.id); await a.deshacer?.(); }}>Deshacer</button>
            ) : null}
            <button type="button" className="toast-cerrar" aria-label="Cerrar aviso" onClick={() => quitar(a.id)}>×</button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
