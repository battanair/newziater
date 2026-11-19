"use client";

import Link, { useT } from "@/components/Idioma";

/** Estado vacío de una lista: explica qué aparecerá y cómo empezar. Los textos se traducen aquí. */
export function Vacio({ texto, enlace }: { texto: string; enlace?: { href: string; l: string } }) {
  const t = useT();
  return (
    <div className="panel" style={{ borderStyle: "dashed", background: "transparent", textAlign: "center" }}>
      <p className="soft" style={{ margin: 0 }}>{t(texto)}</p>
      {enlace ? <Link href={enlace.href} className="btn" style={{ marginTop: 14 }}>{t(enlace.l)}</Link> : null}
    </div>
  );
}
