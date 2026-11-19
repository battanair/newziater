"use client";

import Link, { useT, usePathname } from "@/components/Idioma";
import Image from "next/image";
import { SelectorIdioma } from "./SelectorIdioma";
import { useAuth } from "./AuthProvider";
import { SearchBox } from "./SearchBox";
import { ModoToggle } from "./ModoToggle";
import { Insignia, usePendientes } from "./Pendientes";
import { useEsAdmin, useMensajesPendientes } from "./EsAdmin";

const LINKS = [
  { href: "/obras", label: "Obras" },
  { href: "/personas", label: "Artistas" },
  { href: "/companias", label: "Compañías" },
];

export function Logo() {
  const t = useT();
  return (
    <Link href="/" className="logo" aria-label={t("Ziater, inicio")}>
      <span className="logo-dot" aria-hidden="true" />{t("ZIATER")}</Link>
  );
}

export function Header() {
  const t = useT();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { total } = usePendientes();
  const esAdmin = useEsAdmin();
  const mensajesNuevos = useMensajesPendientes(esAdmin);
  return (
    <header className="header">
      <div className="wrap header-in">
        <Logo />
        <div className="header-search">
          <SearchBox />
        </div>
        <nav aria-label={t("Principal")} className="nav">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={pathname.startsWith(l.href) ? "page" : undefined}>
              {t(l.label)}
            </Link>
          ))}
        </nav>
        <div className="actions">
          <span className="solo-escritorio"><SelectorIdioma /></span>
          <span className="solo-movil"><SelectorIdioma compacto /></span>
          <ModoToggle />
          {esAdmin ? (
            <Link href="/panel/admin" className="btn btn-admin" aria-label={mensajesNuevos ? t("Administración: {n} mensajes sin atender", { n: mensajesNuevos }) : t("Administración")} title={t("Administración")} style={{ position: "relative" }}>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg>
              <span className="solo-escritorio">{t("Admin")}</span>
              <Insignia n={mensajesNuevos} />
            </Link>
          ) : null}
          {loading ? null : user ? (
            <Link href="/panel" className="btn btn-primary solo-escritorio" aria-label={t("Mi espacio")}>
              {user.photoURL ? (
                <Image src={user.photoURL} alt="" width={26} height={26} style={{ borderRadius: "50%" }} />
              ) : null}{t("Mi espacio")}<Insignia n={total} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">{t("Entrar")}</Link>
              <Link href="/signup" className="btn btn-primary solo-escritorio">{t("Registrarse")}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
