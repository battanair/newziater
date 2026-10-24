"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { SearchBox } from "./SearchBox";
import { ModoToggle } from "./ModoToggle";
import { Insignia, usePendientes } from "./Pendientes";

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
