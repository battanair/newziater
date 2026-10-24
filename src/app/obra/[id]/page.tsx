import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { equipoDeObra, getObra, getProductora, obrasRelacionadas, premiosDeObra } from "@/lib/data";
import { Avatar, JsonLd, ObraCard, Poster } from "@/components/Cards";
import { ObraActions } from "@/components/ObraActions";
import { SugerirCambio } from "@/components/SugerirCambio";
import { EditarFicha } from "@/components/EditarFicha";
import { Anadirme } from "@/components/Anadirme";
import { Galeria } from "@/components/Galeria";
import { Valoracion } from "@/components/Valoracion";
import { fechaCorta, partirFunciones, OG_POR_DEFECTO, fotosDe, T_OG, agruparPorDepartamento, cld, departamento, instagramHandle, instagramUrl, nombreCompleto, obraActiva, periodo, recortar } from "@/lib/format";
import { SITE_URL } from "@/lib/firebase-config";

// Página estática regenerada en segundo plano: rápida para Google y gratis de servir.
export const revalidate = 600;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const obra = await getObra(id);
  if (!obra) return { title: "Obra no encontrada", robots: { index: false } };
  const cuando = periodo(obra.anoinicio, obra.anofin);
  const title = cuando ? `${obra.titulo} (${cuando.split(" ")[0]})` : obra.titulo;
  const description = recortar(obra.sinopsis, 158) || `${obra.titulo}: ficha completa con elenco, equipo artístico y fechas en Ziater.`;
  const image = cld(obra.cartel, T_OG);
  return {
    title,
    description,
    alternates: { canonical: `/obra/${obra.id}` },
    openGraph: { type: "article", siteName: "Ziater", locale: "es_ES", title: obra.titulo, description, url: `/obra/${obra.id}`, images: [{ url: image ?? OG_POR_DEFECTO, width: 1200, height: 630, alt: obra.titulo }] },
    twitter: { card: "summary_large_image", title: obra.titulo, description, images: [image ?? OG_POR_DEFECTO] },
  };
}

function youtubeId(url?: string) {
  const m = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m?.[1];
}

export default async function ObraPage({ params }: Props) {
  const { id } = await params;
  const obra = await getObra(id);
  if (!obra) notFound();

  const [equipo, premios, productora, relacionadas] = await Promise.all([
    equipoDeObra(obra.id),
    premiosDeObra(obra.id),
    obra.id_productora ? getProductora(obra.id_productora) : Promise.resolve(null),
    obrasRelacionadas({ id: obra.id, categoria: obra.categoria }),
  ]);

  const elenco = equipo.filter((c) => departamento(c) === "Interpretación");
  const tecnico = agruparPorDepartamento(equipo.filter((c) => departamento(c) !== "Interpretación"));
  const cuando = periodo(obra.anoinicio, obra.anofin);
  const generos = (obra.categoria ?? []).filter(Boolean);
  const ig = instagramUrl(obra.instagram);
  const yt = youtubeId(obra.trailer);
  const fotos = fotosDe(obra);
  const { proximas, pasadas } = partirFunciones(obra.funciones);
  const url = `${SITE_URL}/obra/${obra.id}`;

  return (
    <main>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "@id": url,
            url,
            name: obra.titulo,
            description: obra.sinopsis,
            image: obra.cartel,
            genre: generos.length ? generos : undefined,
            dateCreated: obra.anoinicio ? String(obra.anoinicio) : undefined,
            inLanguage: obra.idioma ?? "es",
            producer: productora ? { "@type": "Organization", name: productora.nombre_prod, url: `${SITE_URL}/compania/${productora.id}` } : undefined,
            director: equipo.filter((c) => /direcci/i.test(c.puesto ?? "")).map((c) => ({ "@type": "Person", name: nombreCompleto(c.persona), url: `${SITE_URL}/persona/${c.persona.id}` })),
            actor: elenco.map((c) => ({ "@type": "Person", name: nombreCompleto(c.persona), url: `${SITE_URL}/persona/${c.persona.id}` })),
            contributor: equipo.filter((c) => departamento(c) !== "Interpretación" && !/direcci/i.test(c.puesto ?? "")).map((c) => ({ "@type": "Person", name: nombreCompleto(c.persona), url: `${SITE_URL}/persona/${c.persona.id}` })),
            award: premios.map((p) => p.galardon_obra),
            sameAs: ig ? [ig] : undefined,
            aggregateRating: obra.votos && obra.votos > 0 ? { "@type": "AggregateRating", ratingValue: obra.nota, bestRating: 10, worstRating: 1, ratingCount: obra.votos } : undefined,
          },
          // Cada función próxima como evento: Google puede mostrarlas en la búsqueda
          ...proximas.slice(0, 10).map((fn) => ({
            "@context": "https://schema.org",
            "@type": "TheaterEvent",
            name: obra.titulo,
            url,
            startDate: fn.hora ? `${fn.fecha}T${fn.hora}` : fn.fecha,
            eventStatus: "https://schema.org/EventScheduled",
            eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
            image: obra.cartel ? [obra.cartel] : undefined,
            description: obra.sinopsis?.slice(0, 300),
            location: { "@type": "Place", name: fn.sala, address: { "@type": "PostalAddress", addressLocality: fn.ciudad || undefined, addressCountry: "ES" } },
            offers: fn.entradas ? { "@type": "Offer", url: fn.entradas, availability: "https://schema.org/InStock" } : undefined,
            performer: elenco.slice(0, 6).map((c) => ({ "@type": "Person", name: nombreCompleto(c.persona) })),
            organizer: productora ? { "@type": "Organization", name: productora.nombre_prod, url: `${SITE_URL}/compania/${productora.id}` } : undefined,
          })),
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Obras", item: `${SITE_URL}/obras` },
              { "@type": "ListItem", position: 2, name: obra.titulo, item: url },
            ],
          },
        ]}
      />

      <section className="hero-ficha">
        <div className="wrap hero-ficha-in">
          <div className="hero-media">
            <Poster obra={obra} sizes="(max-width: 640px) 260px, 320px" priority />
          </div>
          <div className="hero-text">
            <div className="hero-cab">
            <nav aria-label="Ruta" className="breadcrumb">
              <Link href="/obras">Obras</Link>
              {generos[0] ? <> / <Link href={`/obras?genero=${encodeURIComponent(generos[0])}`}>{generos[0]}</Link></> : null}
            </nav>
            <div className="chips" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {proximas.length ? <span className="chip chip-foco chip-dot">En cartel · {fechaCorta(proximas[0].fecha)}</span> : obraActiva(obra) ? <span className="chip chip-foco chip-dot">En activo</span> : <span className="chip">Finalizada</span>}
              {generos.map((g) => <span key={g} className="chip">{g}</span>)}
            </div>
            <h1 className="h1">{obra.titulo}</h1>
            {cuando || productora ? (
              <p style={{ margin: "12px 0 0", fontSize: 18 }} className="soft">
                {cuando}
                {productora ? <> · <Link href={`/compania/${productora.id}`} style={{ color: "var(--foco)" }}>{productora.nombre_prod}</Link></> : null}
              </p>
            ) : null}
            </div>
            <Valoracion obraId={obra.id} votos={obra.votos} nota={obra.nota} />
            <div className="actions">
              <EditarFicha dueno={obra.creacion} href={`/panel/obra/${obra.id}`} texto="Editar obra" />
              <ObraActions obraId={obra.id} />
            </div>
            {obra.sinopsis ? (
              <>
                <h2 className="eyebrow" style={{ margin: "36px 0 10px" }}>Sinopsis</h2>
                <p className="lead" style={{ margin: 0, maxWidth: 680, whiteSpace: "pre-line" }}>{obra.sinopsis}</p>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <div className="wrap row section">
        <div className="main-col">
          {proximas.length || pasadas.length ? (
            <section id="donde-verla" style={{ marginBottom: 56 }}>
              <h2 className="h2" style={{ marginBottom: 16 }}>Dónde verla</h2>
              {proximas.length ? (
                <ul className="list">
                  {proximas.map((fn, i) => (
                    <li key={i} className="funcion">
                      <span className="funcion-fecha"><strong>{fechaCorta(fn.fecha)}</strong>{fn.hora ? <span className="hint">{fn.hora} h</span> : null}</span>
                      <span style={{ minWidth: 0 }}><strong style={{ display: "block" }}>{fn.sala}</strong>{fn.ciudad ? <span className="hint">{fn.ciudad}</span> : null}</span>
                      {fn.entradas ? <a href={fn.entradas} className="btn btn-primary" target="_blank" rel="noopener noreferrer nofollow">Entradas</a> : <span />}
                    </li>
                  ))}
                </ul>
              ) : <p className="muted" style={{ margin: 0 }}>No hay funciones próximas anunciadas.</p>}
              {pasadas.length ? (
                <details style={{ marginTop: 14 }}>
                  <summary className="hint" style={{ cursor: "pointer" }}>Funciones pasadas ({pasadas.length})</summary>
                  <ul className="list" style={{ marginTop: 8 }}>
                    {pasadas.map((fn, i) => <li key={i} className="hint" style={{ padding: "8px 0" }}>{fechaCorta(fn.fecha)} · {fn.sala}{fn.ciudad ? ` (${fn.ciudad})` : ""}</li>)}
                  </ul>
                </details>
              ) : null}
            </section>
          ) : null}
          <section id="elenco">
            <h2 className="h2" style={{ marginBottom: 20 }}>Elenco</h2>
            {elenco.length ? (
              <div className="scroller">
                {elenco.map((c) => (
                  <Link key={c.id} href={`/persona/${c.persona.id}`} className="card">
                    <Avatar persona={c.persona} />
                    <span className="card-title" style={{ textAlign: "center" }}>{nombreCompleto(c.persona)}</span>
                    {c.titulo ? <span className="card-sub" style={{ textAlign: "center" }}>{c.titulo}</span> : null}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="muted">Aún no hay intérpretes en esta ficha. <Anadirme obraId={obra.id} titulo={obra.titulo} duenoObra={obra.creacion} anoinicio={obra.anoinicio} anofin={obra.anofin} /></p>
            )}
          </section>

          <section id="equipo" style={{ marginTop: 56 }}>
            <h2 className="h2" style={{ marginBottom: 8 }}>Equipo artístico y técnico</h2>
            <p className="muted" style={{ marginTop: 0, marginBottom: 20 }}>¿Trabajaste en esta obra? <Anadirme obraId={obra.id} titulo={obra.titulo} duenoObra={obra.creacion} anoinicio={obra.anoinicio} anofin={obra.anofin} texto="Añade tu crédito" /></p>
            {tecnico.length ? (
              <ul className="list">
                {tecnico.map((g) => (
                  <li key={g.dep} className="credit-row">
                    <span className="dep">{g.dep}</span>
                    <span>
                      {g.items.map((c, i) => (
                        <span key={c.id}>
                          {i ? ", " : ""}
                          <Link href={`/persona/${c.persona.id}`} style={{ fontWeight: 500 }}>{nombreCompleto(c.persona)}</Link>
                          {c.titulo && c.titulo.trim() !== g.dep ? <span className="muted"> ({c.titulo.trim()})</span> : null}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {yt || fotos.length ? (
            <section id="galeria" style={{ marginTop: 56 }}>
              <h2 className="h2" style={{ marginBottom: 20 }}>Galería</h2>
              {yt ? (
                <div style={{ position: "relative", aspectRatio: "16/9", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
                  <iframe src={`https://www.youtube-nocookie.com/embed/${yt}`} title={`Tráiler de ${obra.titulo}`} loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
                </div>
              ) : null}
              <Galeria fotos={fotos} titulo={obra.titulo} />
            </section>
          ) : null}
        </div>

        <aside className="side-col">
          <div className="panel">
            <h2 className="eyebrow">Ficha técnica</h2>
            <dl className="dl">
              {cuando ? <><dt>Años</dt><dd>{cuando}</dd></> : null}
              {productora ? <><dt>Compañía</dt><dd><Link href={`/compania/${productora.id}`}>{productora.nombre_prod}</Link></dd></> : null}
              {obra.duracion ? <><dt>Duración</dt><dd>{obra.duracion} min</dd></> : null}
              {obra.edad ? <><dt>Edad</dt><dd>{obra.edad}</dd></> : null}
              {obra.idioma ? <><dt>Idioma</dt><dd>{obra.idioma}</dd></> : null}
              {ig ? <><dt>Redes</dt><dd><a href={ig} target="_blank" rel="noopener noreferrer nofollow" style={{ color: "var(--foco)" }}>{instagramHandle(obra.instagram)}</a></dd></> : null}
            </dl>
          </div>
          {premios.length ? (
            <div className="panel">
              <h2 className="eyebrow">Premios</h2>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }} className="stack">
                {premios.map((p) => <li key={p.id}><strong>{p.galardon_obra}</strong>{p.anio_premobr && String(p.anio_premobr) !== "NaN" ? <span className="muted"> · {String(p.anio_premobr)}</span> : null}</li>)}
              </ul>
            </div>
          ) : null}
          <div className="panel stack" style={{ gap: 10 }}>
            <h2 className="eyebrow" style={{ marginBottom: 0 }}>¿Algo no cuadra?</h2>
            <p className="hint" style={{ margin: 0 }}>Propón una corrección y le llegará a quien gestiona esta ficha.</p>
            <SugerirCambio tipo="obra" refId={obra.id} nombre={obra.titulo} className="btn" />
            <Link href={`/panel/obra/${obra.id}`} className="hint" style={{ textAlign: "center" }}>¿Es tu obra o formas parte de ella? Gestionar ficha</Link>
          </div>
        </aside>
      </div>

      {relacionadas.length ? (
        <section className="wrap section">
          <h2 className="h2" style={{ marginBottom: 20 }}>Si te gustó…</h2>
          <div className="grid-posters">{relacionadas.map((o) => <ObraCard key={o.id} obra={o} />)}</div>
        </section>
      ) : null}
    </main>
  );
}
