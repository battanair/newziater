import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSala, obrasEnSala } from "@/lib/data";
import { JsonLd, ObraCard } from "@/components/Cards";
import { ShareButton } from "@/components/ObraActions";
import { EditarFicha } from "@/components/EditarFicha";
import { SugerirCambio } from "@/components/SugerirCambio";
import { OG_POR_DEFECTO, T_CARTEL, T_OG, cld, colorCartel, fechaCorta, hoyES, instagramUrl, recortar } from "@/lib/format";
import { SITE_URL } from "@/lib/firebase-config";

export const revalidate = 600;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const s = await getSala(id);
  if (!s) return { title: "Sala no encontrada", robots: { index: false } };
  const title = s.ciudad ? `${s.nombre} (${s.ciudad})` : s.nombre;
  const description = recortar(s.descripcion, 158) || `${s.nombre}${s.ciudad ? `, ${s.ciudad}` : ""}: cartelera y obras representadas en la sala, en Ziater.`;
  const image = cld(s.foto, T_OG);
  return {
    title,
    description,
    alternates: { canonical: `/sala/${s.id}` },
    openGraph: { type: "website", siteName: "Ziater", locale: "es_ES", title, description, url: `/sala/${s.id}`, images: [{ url: image ?? OG_POR_DEFECTO, width: 1200, height: 630, alt: s.nombre }] },
    twitter: { card: "summary_large_image", title, description, images: [image ?? OG_POR_DEFECTO] },
  };
}

const webUrl = (w?: string) => (w && /^https?:\/\//.test(w) ? w : w ? `https://${w}` : undefined);

export default async function SalaPage({ params }: Props) {
  const { id } = await params;
  const s = await getSala(id);
  if (!s) notFound();
  const obras = await obrasEnSala(s.id);
  const hoy = hoyES();

  // Cartelera: funciones de hoy en adelante en esta sala
  const cartel = obras
    .flatMap((o) => (o.funciones ?? []).filter((f) => f.sala_id === s.id && f.fecha >= hoy).map((f) => ({ ...f, obra: o })))
    .sort((a, b) => (a.fecha + (a.hora ?? "")).localeCompare(b.fecha + (b.hora ?? "")));
  const enCartel = new Set(cartel.map((c) => c.obra.id));
  const pasadas = obras.filter((o) => !enCartel.has(o.id)).sort((a, b) => String(b.ultima ?? "").localeCompare(String(a.ultima ?? "")));

  const ig = instagramUrl(s.instagram);
  const web = webUrl(s.web);
  const mapa = s.direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.nombre}, ${s.direccion}, ${s.ciudad ?? ""}`)}` : undefined;
  const url = `${SITE_URL}/sala/${s.id}`;
  const foto = cld(s.foto, T_CARTEL);

  return (
    <main>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "PerformingArtsTheater", "@id": url, url, name: s.nombre, description: s.descripcion, image: s.foto || undefined,
        address: { "@type": "PostalAddress", streetAddress: s.direccion || undefined, addressLocality: s.ciudad || undefined, addressCountry: "ES" },
        maximumAttendeeCapacity: s.aforo || undefined, sameAs: [ig, web].filter(Boolean),
        event: cartel.slice(0, 20).map((c) => ({ "@type": "TheaterEvent", name: c.obra.titulo, startDate: c.hora ? `${c.fecha}T${c.hora}` : c.fecha, url: `${SITE_URL}/obra/${c.obra.id}`, location: { "@type": "PerformingArtsTheater", name: s.nombre, address: s.ciudad } })),
      }} />
      <section className="hero-ficha">
        <div className="wrap hero-ficha-in">
          <div className="hero-media" style={{ maxWidth: 240 }}>
            <div className="poster" style={{ background: colorCartel(s.id) }}>
              {foto ? <Image src={foto} alt={`Foto de ${s.nombre}`} fill sizes="240px" priority /> : <span className="poster-title">{s.nombre}</span>}
            </div>
          </div>
          <div className="hero-text">
            <div className="hero-cab">
              <p className="eyebrow" style={{ marginBottom: 12 }}>Sala{s.ciudad ? ` · ${s.ciudad}` : ""}</p>
              <h1 className="h1">{s.nombre}</h1>
            </div>
            <p className="soft" style={{ margin: "0 0 12px" }}>
              {[s.direccion, s.aforo ? `${s.aforo.toLocaleString("es-ES")} butacas` : ""].filter(Boolean).join(" · ")}
            </p>
            {s.descripcion ? <p className="lead" style={{ maxWidth: 700, whiteSpace: "pre-line" }}>{s.descripcion}</p> : null}
            <div className="actions">
              <EditarFicha dueno={s.creacion} href={`/panel/sala/${s.id}`} texto="Editar sala" />
              {web ? <a href={web} className="btn" target="_blank" rel="noopener noreferrer nofollow">Web</a> : null}
              {ig ? <a href={ig} className="btn" target="_blank" rel="noopener noreferrer nofollow">Instagram</a> : null}
              {mapa ? <a href={mapa} className="btn" target="_blank" rel="noopener noreferrer nofollow">Cómo llegar</a> : null}
              <ShareButton />
              <SugerirCambio tipo="sala" refId={s.id} nombre={s.nombre} className="btn btn-ghost" />
            </div>
          </div>
        </div>
      </section>

      <section className="wrap section">
        <h2 className="h2" style={{ marginBottom: 16 }}>En cartel</h2>
        {cartel.length ? (
          <ul className="list">
            {cartel.slice(0, 60).map((c, i) => (
              <li key={i} className="funcion">
                <span className="funcion-fecha"><strong>{fechaCorta(c.fecha)}</strong>{c.hora ? <span className="hint">{c.hora} h</span> : null}</span>
                <span style={{ minWidth: 0 }}><Link href={`/obra/${c.obra.id}`} style={{ fontWeight: 600 }}>{c.obra.titulo}</Link></span>
                {c.entradas ? <a href={c.entradas} className="btn btn-primary" target="_blank" rel="noopener noreferrer nofollow">Entradas</a> : <span />}
              </li>
            ))}
          </ul>
        ) : <p className="muted">No hay funciones anunciadas en Ziater. Las compañías pueden enlazar esta sala al añadir las funciones de su obra.</p>}
      </section>

      {pasadas.length ? (
        <section className="wrap section" style={{ paddingTop: 0 }}>
          <h2 className="h2" style={{ marginBottom: 20 }}>Han pasado por aquí</h2>
          <div className="grid-posters">{pasadas.map((o) => <ObraCard key={o.id} obra={o} />)}</div>
        </section>
      ) : null}
    </main>
  );
}
