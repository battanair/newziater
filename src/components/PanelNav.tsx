"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Navegación del espacio personal. La tiene cualquier usuario con sesión;
// «Ficha de artista» y «Vínculos» sirven a quien trabaja en las artes escénicas.
const ITEMS = [
  { href: "/panel", label: "Resumen", activo: (p: string) => p === "/panel" },
  { href: "/panel/listas/notas", label: "Mis listas", activo: (p: string) => p.startsWith("/panel/listas") },
  { href: "/panel/aportaciones", label: "Aportaciones", activo: (p: string) => p.startsWith("/panel/aportaciones") },
  { href: "/panel/ficha", label: "Ficha de artista", activo: (p: string) => p.startsWith("/panel/ficha") || p.startsWith("/panel/bienvenida") },
  { href: "/panel/vinculos", label: "Vínculos", activo: (p: string) => p.startsWith("/panel/vinculos") },
  { href: "/panel/cuenta", label: "Cuenta", activo: (p: string) => p.startsWith("/panel/cuenta") },
];

export function PanelNav({ pendientes = 0, personaId }: { pendientes?: number; personaId?: string }) {
  const path = usePathname();
  return (
    <div className="panel-nav">
      <div className="wrap panel-nav-in">
        <span className="muted" style={{ fontSize: 14 }}>Mi espacio</span>
        <nav aria-label="Mi espacio" className="nav" style={{ flex: 1 }}>
          {ITEMS.map((i) => (
            <Link key={i.href} href={i.href} aria-current={i.activo(path) ? "page" : undefined}>
              {i.label}
              {i.href === "/panel/vinculos" && pendientes ? <span className="chip chip-foco" style={{ marginLeft: 6, minHeight: 20, padding: "0 7px", fontSize: 12 }}>{pendientes}</span> : null}
            </Link>
          ))}
        </nav>
        {personaId ? <Link href={`/persona/${personaId}`} className="btn">Ver mi ficha pública</Link> : null}
        <Link href="/panel/obra/nueva" className="btn btn-primary">+ Crear obra</Link>
      </div>
    </div>
  );
}
