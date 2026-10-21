"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

const ITEMS = [
  { href: "/panel", label: "Mi ficha" },
  { href: "/panel/obra/nueva", label: "Crear obra" },
  { href: "/panel/vinculos", label: "Vínculos" },
];

export function PanelNav({ pendientes = 0, personaId }: { pendientes?: number; personaId?: string }) {
  const path = usePathname();
  const router = useRouter();
  return (
    <div style={{ borderBottom: "1px solid var(--linea)" }}>
      <div className="wrap" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 22px", padding: "12px 24px" }}>
        <span className="muted" style={{ fontSize: 14 }}>Panel del artista</span>
        <nav aria-label="Panel" className="nav" style={{ flex: 1 }}>
          {ITEMS.map((i) => (
            <Link key={i.href} href={i.href} aria-current={path === i.href ? "page" : undefined}>
              {i.label}
              {i.href === "/panel/vinculos" && pendientes ? <span className="chip chip-foco" style={{ marginLeft: 6, minHeight: 20, padding: "0 7px", fontSize: 12 }}>{pendientes}</span> : null}
            </Link>
          ))}
        </nav>
        {personaId ? <Link href={`/persona/${personaId}`} className="btn">Ver ficha pública</Link> : null}
        <button type="button" className="btn btn-ghost" onClick={async () => { await signOut(auth); router.replace("/"); }}>Cerrar sesión</button>
      </div>
    </div>
  );
}
