"use client";

import Link, { useT } from "@/components/Idioma";
import { SearchBox } from "@/components/SearchBox";

// De cliente para saber el idioma (la página 404 no recibe params)
export default function NotFound() {
  const t = useT();
  return (
    <main className="wrap section" style={{ minHeight: "60vh" }}>
      <title>{`${t("Página no encontrada")} | Ziater`}</title>
      <meta name="robots" content="noindex" />
      <p className="eyebrow">{t("Error 404")}</p>
      <h1 className="h1" style={{ margin: "12px 0 16px" }}>{t("Esta función no está en cartel.")}</h1>
      <p className="soft" style={{ marginBottom: 28 }}>{t("La página que buscas no existe o ha cambiado de dirección.")}</p>
      <div style={{ maxWidth: 640, marginBottom: 24 }}><SearchBox hero /></div>
      <Link href="/" className="btn">{t("Volver al inicio")}</Link>
    </main>
  );
}
