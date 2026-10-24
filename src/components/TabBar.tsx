"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Insignia, usePendientes } from "./Pendientes";

const Icono = ({ d }: { d: React.ReactNode }) => (
  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const ITEMS = [
  { href: "/", label: "Inicio", activo: (p: string) => p === "/", icono: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
  { href: "/obras", label: "Obras", activo: (p: string) => p.startsWith("/obra"), icono: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6" /></> },
  { href: "/personas", label: "Artistas", activo: (p: string) => p.startsWith("/persona"), icono: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></> },
  { href: "/companias", label: "Compañías", activo: (p: string) => p.startsWith("/compania"), icono: <><circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" /><path d="M2.5 20c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M13 15.6c1-.7 1.9-1 3-1 2.5 0 4.7 1.5 5.5 4.5" /></> },
  { href: "/panel", label: "Mi espacio", activo: (p: string) => p.startsWith("/panel") || p === "/login" || p === "/signup" || p.startsWith("/reclamar"), icono: <path d="M12 3.5 14.6 9l5.9.6-4.4 4 1.3 5.9L12 16.5l-5.4 3 1.3-5.9-4.4-4L9.4 9z" /> },
];

/** Navegación inferior en móvil, como en una app. En escritorio se oculta por CSS. */
export function TabBar() {
  const path = usePathname();
  const { total } = usePendientes();
  return (
    <nav className="tabbar" aria-label="Navegación">
      {ITEMS.map((i) => (
        <Link key={i.href} href={i.href} aria-current={i.activo(path) ? "page" : undefined}>
          <span style={{ position: "relative", display: "inline-flex" }}>
            <Icono d={i.icono} />
            {i.href === "/panel" ? <span className="insignia-tab"><Insignia n={total} /></span> : null}
          </span>
          <span>{i.label}</span>
        </Link>
      ))}
    </nav>
  );
}
