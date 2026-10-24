import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-in">
        <span className="serif" style={{ fontSize: 20, color: "var(--papel)", fontWeight: 700, letterSpacing: ".04em" }}>ZIATER</span>
        <nav aria-label="Pie" style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
          <Link href="/obras">Obras</Link>
          <Link href="/personas">Artistas</Link>
          <Link href="/colaboradores">Colaboradores</Link>
          <Link href="/contacto">Contacto</Link>
          <Link href="/politica-de-privacidad">Privacidad</Link>
          <Link href="/politica-de-cookies">Cookies</Link>
          <a href="https://www.instagram.com/ziater_/" rel="noopener noreferrer" target="_blank">Instagram</a>
        </nav>
        <span>© {new Date().getFullYear()} Ziater</span>
      </div>
    </footer>
  );
}
