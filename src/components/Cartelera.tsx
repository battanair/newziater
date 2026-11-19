import { idioma, tServidor } from "@/lib/idioma-servidor";
import { ruta } from "@/lib/i18n";
import Image from "next/image";
import Link from "@/components/Idioma";
import type { FuncionCartel } from "@/lib/data";
import { colorCartel, diaCartelera, enlaceSeguro } from "@/lib/format";
import { SITE_URL } from "@/lib/firebase-config";
import { JsonLd } from "./Cards";

/** Funciones agrupadas por día: «Hoy», «Mañana», «Viernes 20 de noviembre»… */
export function DiasCartelera({ funciones, hoy, conCiudad }: { funciones: FuncionCartel[]; hoy: string; conCiudad?: boolean }) {
  const t = tServidor();
  const lang = idioma();
  const dias = new Map<string, FuncionCartel[]>();
  for (const f of funciones) dias.set(f.fecha, [...(dias.get(f.fecha) ?? []), f]);
  return (
    <div className="stack" style={{ gap: 28 }}>
      {[...dias.entries()].map(([dia, fs]) => (
        <section key={dia} aria-label={diaCartelera(dia, hoy, lang)}>
          <h3 className="cartel-dia">{diaCartelera(dia, hoy, lang)}</h3>
          <ul className="list">
            {fs.map((f, i) => {
              const entradas = enlaceSeguro(f.entradas);
              return (
                <li key={i} className="cartel-fila">
                  <Link href={`/obra/${f.obra.id}`} className="cartel-mini" style={{ background: colorCartel(f.obra.id) }} aria-hidden="true" tabIndex={-1}>
                    {f.obra.cartel ? <Image src={f.obra.cartel} alt="" width={68} height={102} /> : null}
                  </Link>
                  <span style={{ minWidth: 0 }}>
                    <Link href={`/obra/${f.obra.id}`} className="cartel-tit">{f.obra.titulo}</Link>
                    <span className="hint" style={{ display: "block" }}>
                      {[f.hora ? t("{hora} h", { hora: f.hora }) : "", f.sala, conCiudad ? f.ciudad : ""].filter(Boolean).join(" · ")}
                      {f.sala_id ? <> · <Link href={`/sala/${f.sala_id}`} style={{ textDecoration: "underline" }}>{t("ver sala")}</Link></> : null}
                    </span>
                    {f.obra.categoria?.length ? <span className="chip" style={{ marginTop: 6 }}>{t(f.obra.categoria[0])}</span> : null}
                  </span>
                  {entradas ? <a href={entradas} className="btn btn-primary" target="_blank" rel="noopener noreferrer nofollow">{t("Entradas")}</a> : <span />}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Chips de ciudades con el número de funciones. */
export function CiudadesCartelera({ ciudades, actual, max = 40 }: { ciudades: { slug: string; nombre: string; n: number }[]; actual?: string; max?: number }) {
  const t = tServidor();
  if (!ciudades.length) return null;
  return (
    <nav aria-label={t("Ciudades")} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <Link href="/cartelera" className={`chip ${!actual ? "chip-foco" : ""}`} style={{ minHeight: 40, padding: "0 14px", fontSize: 14 }}>{t("Todas")}</Link>
      {ciudades.slice(0, max).map((c) => (
        <Link key={c.slug} href={`/cartelera/${c.slug}`} aria-current={c.slug === actual ? "page" : undefined} className={`chip ${c.slug === actual ? "chip-foco" : ""}`} style={{ minHeight: 40, padding: "0 14px", fontSize: 14 }}>
          {c.nombre} <span style={{ opacity: 0.7 }}>{c.n}</span>
        </Link>
      ))}
    </nav>
  );
}

/** Datos estructurados: cada función como evento, para que Google las muestre. */
export function EventosCartelera({ funciones }: { funciones: FuncionCartel[] }) {
  const lang = idioma();
  if (!funciones.length) return null;
  return (
    <JsonLd data={{
      "@context": "https://schema.org", "@type": "ItemList",
      itemListElement: funciones.slice(0, 50).map((f, i) => ({
        "@type": "ListItem", position: i + 1,
        item: {
          "@type": "TheaterEvent", name: f.obra.titulo, url: `${SITE_URL}${ruta(lang, `/obra/${f.obra.id}`)}`,
          startDate: f.hora ? `${f.fecha}T${f.hora}` : f.fecha, eventStatus: "https://schema.org/EventScheduled",
          location: { "@type": "Place", name: f.sala || f.ciudad || "—", address: { "@type": "PostalAddress", addressLocality: f.ciudad || undefined } },
          offers: enlaceSeguro(f.entradas) ? { "@type": "Offer", url: enlaceSeguro(f.entradas) } : undefined,
        },
      })),
    }} />
  );
}
