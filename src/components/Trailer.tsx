"use client";

import { useState } from "react";

/**
 * Tráiler de YouTube que no se carga hasta que la persona lo pide: así no se conecta
 * con YouTube (Google) ni guarda nada en el navegador solo por visitar la ficha.
 */
export function Trailer({ id, titulo }: { id: string; titulo: string }) {
  const [cargar, setCargar] = useState(false);
  return (
    <div style={{ position: "relative", aspectRatio: "16/9", borderRadius: 12, overflow: "hidden", marginBottom: 12, background: "var(--butaca)", border: "1px solid var(--linea)" }}>
      {cargar ? (
        <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`} title={`Tráiler de ${titulo}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
      ) : (
        <button type="button" onClick={() => setCargar(true)} className="trailer-portada" aria-label={`Ver el tráiler de ${titulo} (se cargará YouTube)`}>
          {/* Miniatura del vídeo: es solo una imagen, YouTube no se carga hasta pulsar */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" referrerPolicy="no-referrer" className="trailer-mini" />
          <span className="trailer-play" aria-hidden="true">▶</span>
          <span className="trailer-aviso">Al reproducirlo se cargará YouTube</span>
        </button>
      )}
    </div>
  );
}
