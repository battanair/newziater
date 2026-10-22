import Link from "next/link";

/** Estado vacío de una lista: explica qué aparecerá y cómo empezar. */
export function Vacio({ texto, enlace }: { texto: string; enlace?: { href: string; l: string } }) {
  return (
    <div className="panel" style={{ borderStyle: "dashed", background: "transparent", textAlign: "center" }}>
      <p className="soft" style={{ margin: 0 }}>{texto}</p>
      {enlace ? <Link href={enlace.href} className="btn" style={{ marginTop: 14 }}>{enlace.l}</Link> : null}
    </div>
  );
}
