"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { cld } from "@/lib/format";

/**
 * Galería de una obra: cuadrícula de miniaturas y, al pulsar, visor a pantalla
 * completa con flechas (también teclado: ← → y Esc) y deslizamiento en móvil.
 */
export function Galeria({ fotos, titulo }: { fotos: string[]; titulo: string }) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const [inicioX, setInicioX] = useState<number | null>(null);

  const mover = useCallback((d: number) => setAbierta((i) => (i === null ? i : (i + d + fotos.length) % fotos.length)), [fotos.length]);

  useEffect(() => {
    if (abierta === null) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierta(null);
      if (e.key === "ArrowRight") mover(1);
      if (e.key === "ArrowLeft") mover(-1);
    };
    document.addEventListener("keydown", tecla);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", tecla); document.body.style.overflow = overflow; };
  }, [abierta, mover]);

  if (!fotos.length) return null;

  return (
    <>
      <div className="galeria">
        {fotos.map((f, i) => (
          <button key={f} type="button" className="galeria-item" onClick={() => setAbierta(i)} aria-label={`Ver foto ${i + 1} de ${fotos.length} de ${titulo}`}>
            <Image src={cld(f, "c_fill,g_auto,w_800,h_600,f_auto,q_auto") ?? f} alt={`${titulo}, foto ${i + 1}`} fill sizes="(max-width: 640px) 50vw, 300px" />
          </button>
        ))}
      </div>

      {abierta !== null ? (
        <div
          className="visor"
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ${abierta + 1} de ${fotos.length} de ${titulo}`}
          onClick={(e) => { if (e.target === e.currentTarget) setAbierta(null); }}
          onTouchStart={(e) => setInicioX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (inicioX === null) return;
            const d = e.changedTouches[0].clientX - inicioX;
            if (Math.abs(d) > 50) mover(d < 0 ? 1 : -1);
            setInicioX(null);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cld(fotos[abierta], "c_limit,w_2000,h_2000,f_auto,q_auto") ?? fotos[abierta]} alt={`${titulo}, foto ${abierta + 1}`} className="visor-img" />
          <button type="button" className="visor-btn visor-cerrar" onClick={() => setAbierta(null)} aria-label="Cerrar" autoFocus>×</button>
          {fotos.length > 1 ? (
            <>
              <button type="button" className="visor-btn visor-ant" onClick={() => mover(-1)} aria-label="Foto anterior">‹</button>
              <button type="button" className="visor-btn visor-sig" onClick={() => mover(1)} aria-label="Foto siguiente">›</button>
              <span className="visor-cont">{abierta + 1} / {fotos.length}</span>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
