"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { SearchBox } from "./SearchBox";
import { ModoToggle } from "./ModoToggle";
import { Insignia, usePendientes } from "./Pendientes";
import { useEsAdmin } from "./EsAdmin";

const LINKS = [
  { href: "/obras", label: "Obras" },
  { href: "/personas", label: "Artistas" },
  { href: "/companias", label: "Compañías" },
];

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="Ziater, inicio">
      <span className="logo-dot" aria-hidden="true" />
      ZIATER
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { total } = usePendientes();
  const esAdmin = useEsAdmin();
  return (
    <header className="header">
      <div className="wrap header-in">
        <Logo />
        <div className="header-search">
          <SearchBox />
        </div>
        <nav aria-label="Principal" className="nav">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={pathname.startsWith(l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="actions">
          <ModoToggle />
          {esAdmin ? (
            <Link href="/panel/admin" className="btn btn-admin" aria-label="Administración" title="Administración">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg>
              <span className="solo-escritorio">Admin</span>
            </Link>
          ) : null}
          {loading ? null : user ? (
            <Link href="/panel" className="btn btn-primary solo-escritorio" aria-label="Mi espacio">
              {user.photoURL ? (
                <Image src={user.photoURL} alt="" width={26} height={26} style={{ borderRadius: "50%" }} />
              ) : null}
              Mi espacio
              <Insignia n={total} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Entrar</Link>
              <Link href="/signup" className="btn btn-primary solo-escritorio">Registrarse</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
