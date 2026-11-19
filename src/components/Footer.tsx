import { tServidor } from "@/lib/idioma-servidor";
import Link from "@/components/Idioma";
import { EnlaceCookies } from "./BannerCookies";
import { SelectorIdioma } from "./SelectorIdioma";

export function Footer() {
  const t = tServidor();
  return (
    <footer className="footer">
      <div className="wrap footer-in">
        <span className="serif" style={{ fontSize: 20, color: "var(--papel)", fontWeight: 700, letterSpacing: ".04em" }}>{t("ZIATER")}</span>
        <nav aria-label={t("Pie")} style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
          <Link href="/cartelera">{t("Cartelera")}</Link>
          <Link href="/obras">{t("Obras")}</Link>
          <Link href="/personas">{t("Artistas")}</Link>
          <Link href="/companias">{t("Compañías")}</Link>
          <Link href="/salas">{t("Salas")}</Link>
          <Link href="/colaboradores">{t("Colaboradores")}</Link>
          <Link href="/contacto">{t("Contacto")}</Link>
          <Link href="/politica-de-privacidad">{t("Privacidad")}</Link>
          <Link href="/politica-de-cookies">{t("Cookies")}</Link>
          <Link href="/terminos-de-uso">{t("Términos")}</Link>
          <Link href="/aviso-legal">{t("Aviso legal")}</Link>
          <EnlaceCookies />
          <a href="https://www.instagram.com/ziater_/" rel="noopener noreferrer" target="_blank">{t("Instagram")}</a>
        </nav>
        <Link href="/panel/sala/nueva" className="btn btn-sala">{t("¿Tienes una sala? Dala de alta")}</Link>
        <SelectorIdioma />
        <span>{t("© {getFullYear} Ziater", { getFullYear: new Date().getFullYear() })}</span>
      </div>
    </footer>
  );
}
