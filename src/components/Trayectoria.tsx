"use client";

import Link from "next/link";
import { useState } from "react";

type Fila = { y: string; obraId: string; titulo: string; detalle: string; rol: string; img?: string; color: string };

export function Trayectoria({ grupos }: { grupos: { dep: string; filas: Fila[] }[] }) {
  const [tab, setTab] = useState(0);
  const actual = grupos[tab] ?? grupos[0];
  return (
    <>
      {grupos.length > 1 ? (
        <div role="tablist" aria-label="Trayectoria por rol" className="tabs">
          {grupos.map((g, i) => (
            <button key={g.dep} type="button" role="tab" className="tab" aria-selected={i === tab} onClick={() => setTab(i)}>
              {g.dep} · {g.filas.length}
            </button>
          ))}
        </div>
      ) : null}
      {/* Todas las filas se renderizan en el HTML para que Google las lea; solo se ocultan visualmente */}
      {grupos.map((g, i) => (
        <ol key={g.dep} className="list" role="tabpanel" hidden={g !== actual} aria-label={g.dep}>
          {g.filas.map((f, j) => (
            <li key={f.obraId + j} className="career-row tray-row">
              <span className="year">{f.y}</span>
              <Link href={`/obra/${f.obraId}`} className="tray-cartel" style={{ background: f.color }} tabIndex={-1} aria-hidden="true">
                {f.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.img} alt="" width={40} height={60} loading="lazy" />
                ) : <span>{f.titulo.trim().charAt(0).toUpperCase()}</span>}
              </Link>
              <span style={{ minWidth: 0 }}>
                <Link href={`/obra/${f.obraId}`} style={{ display: "block", fontWeight: 600, fontSize: 17 }}>{f.titulo}</Link>
                {f.detalle ? <span className="hint">{f.detalle}</span> : null}
              </span>
              <span className="soft" style={{ fontSize: 14, textAlign: "right" }}>{f.rol}</span>
            </li>
          ))}
        </ol>
      ))}
    </>
  );
}
