import { idiomaDePagina } from "@/lib/idioma-servidor";
import { LOCALE, OG_LOCALE, alternos, idiomaDe, ruta, traductor } from "@/lib/i18n";
import type { Metadata } from "next";
import Link from "@/components/Idioma";
import Image from "next/image";
import { notFound } from "next/navigation";
import { equipoDeObra, getObra, getProductora, obrasRelacionadas, premiosDeObra } from "@/lib/data";
import { Avatar, JsonLd, ObraCard, Poster } from "@/components/Cards";
import { ObraActions } from "@/components/ObraActions";
import { SugerirCambio } from "@/components/SugerirCambio";
import { EditarFicha } from "@/components/EditarFicha";
import { Anadirme } from "@/components/Anadirme";
import { Galeria } from "@/components/Galeria";
import { VistaElenco } from "@/components/VistaElenco";
import { contactoDistribucion } from "@/lib/ficha-tecnica";
import { Trailer } from "@/components/Trailer";
import { StoryBoton } from "@/components/StoryBoton";
import { Valoracion } from "@/components/Valoracion";
import { fechaCorta, partirFunciones, OG_POR_DEFECTO, fotosDe, T_OG, agruparPorDepartamento, cld, departamento, instagramHandle, enlaceSeguro, instagramUrl, nombreCompleto, obraActiva, periodo, recortar, tramo } from "@/lib/format";
import { SITE_URL } from "@/lib/firebase-config";

// Página estática regenerada en segundo plano: rápida para Google y gratis de servir.
export const revalidate = 600;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ id: string; lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, lang: l } = await params;
  const lang = idiomaDe(l);
  const t = traductor(lang);
  const obra = await getObra(id);
  if (!obra) return { title: t("Obra no encontrada"), robots: { index: false } };
  const cuando = periodo(obra.anoinicio, obra.anofin, lang);
  const title = cuando ? `${obra.titulo} (${cuando.split(" ")[0]})` : obra.titulo;
  const description = recortar(obra.sinopsis, 158) || t("{titulo}: ficha completa con elenco, equipo artístico y fechas en Ziater.", { titulo: obra.titulo });
  const image = cld(obra.cartel, T_OG);
  return {
    title,
    description,
    alternates: alternos(lang, `/obra/${obra.id}`),
    openGraph: { type: "article", siteName: "Ziater", locale: OG_LOCALE[lang], title: obra.titulo, description, url: ruta(lang, `/obra/${obra.id}`), images: [{ url: image ?? OG_POR_DEFECTO, width: 1200, height: 630, alt: obra.titulo }] },
    twitter: { card: "summary_large_image", title: obra.titulo, description, images: [image ?? OG_POR_DEFECTO] },
  };
}

function youtubeId(url?: string) {
  const m = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m?.[1];
}

const duracionTexto = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ""}` : `${min} min`);
/** Edad recomendada en el formato de schema.org («12-», «3-6»…). */
function edadSchema(e: string): string | undefined {
  const rango = e.match(/(\d+)-(\d+)/);
  if (rango) return `${rango[1]}-${rango[2]}`;
  const desde = e.match(/\+(\d+)/);
  return desde ? `${desde[1]}-` : undefined;
}

export default async function ObraPage({ params }: Props) {
  const { lang, t } = await idiomaDePagina(params);
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
  const cuando = periodo(obra.anoinicio, obra.anofin, lang);
  const estreno = [obra.estreno_fecha ? new Date(obra.estreno_fecha + "T12:00:00").toLocaleDateString(LOCALE[lang], { day: "numeric", month: "long", year: "numeric" }) : "", obra.estreno_lugar ?? ""].filter(Boolean).join(" · ");
  const contacto = contactoDistribucion(obra.distribucion);
  // Relevos: si alguien entró más tarde o dejó la obra, se ofrecen los botones Actual / Original / Todos
  const hayRelevos = equipo.some((c) => c.desde || c.hasta);
  const fuera = (c: { desde?: string; hasta?: string }) => [c.hasta ? "fuera-actual" : "", c.desde ? "fuera-original" : ""].filter(Boolean).join(" ");
  const SECCIONES = (
    <>
          <section id="elenco">
            <h2 className="h2" style={{ marginBottom: 20 }}>{t("Elenco")}</h2>
            {elenco.length ? (
              <div className="scroller">
                {elenco.map((c) => (
                  <Link key={c.id} href={`/persona/${c.persona.id}`} className={`card ${fuera(c)}`}>
                    <Avatar persona={c.persona} />
                    <span className="card-title" style={{ textAlign: "center" }}>{nombreCompleto(c.persona)}</span>
                    {c.titulo || c.cover ? <span className="card-sub" style={{ textAlign: "center" }}>{[c.titulo, c.cover ? t("cover") : ""].filter(Boolean).join(" · ")}</span> : null}
                    {hayRelevos ? <span className="tramo" style={{ textAlign: "center" }}>{tramo(c, true, lang)}</span> : null}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="muted">{t("Aún no hay intérpretes en esta ficha.")}{" "}<Anadirme obraId={obra.id} titulo={obra.titulo} duenoObra={obra.creacion} anoinicio={obra.anoinicio} anofin={obra.anofin} /></p>
            )}
          </section>

          <section id="equipo" style={{ marginTop: 56 }}>
            <h2 className="h2" style={{ marginBottom: 8 }}>{t("Equipo artístico y técnico")}</h2>
            <p className="muted" style={{ marginTop: 0, marginBottom: 20 }}>{t("¿Trabajaste en esta obra?")}{" "}<Anadirme obraId={obra.id} titulo={obra.titulo} duenoObra={obra.creacion} anoinicio={obra.anoinicio} anofin={obra.anofin} texto={t("Añade tu crédito")} /></p>
            {tecnico.length ? (
              <ul className="list">
                {tecnico.map((g) => (
                  <li key={g.dep} className="credit-row">
                    <span className="dep">{t(g.dep)}</span>
                    <span className="cred-lista">
                      {g.items.map((c) => (
                        <span key={c.id} className={`cred ${fuera(c)}`}>
                          <Link href={`/persona/${c.persona.id}`} style={{ fontWeight: 500 }}>{nombreCompleto(c.persona)}</Link>
                          {c.titulo && c.titulo.trim() !== g.dep ? <span className="muted"> ({c.titulo.trim()})</span> : null}
                          {hayRelevos && (c.desde || c.hasta) ? <span className="tramo-linea"> · {tramo(c, false, lang)}</span> : null}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
    </>
  );
  const generos = (obra.categoria ?? []).filter(Boolean);
  const ig = instagramUrl(obra.instagram);
  const yt = youtubeId(obra.trailer);
  const fotos = fotosDe(obra);
  const { proximas, pasadas } = partirFunciones(obra.funciones);
  const url = `${SITE_URL}${ruta(lang, `/obra/${obra.id}`)}`;

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
            inLanguage: obra.idioma || undefined,
            producer: productora ? { "@type": "Organization", name: productora.nombre_prod, url: `${SITE_URL}/compania/${productora.id}` } : undefined,
            director: equipo.filter((c) => /direcci/i.test(c.puesto ?? "")).map((c) => ({ "@type": "Person", name: nombreCompleto(c.persona), url: `${SITE_URL}/persona/${c.persona.id}` })),
            actor: elenco.map((c) => ({ "@type": "Person", name: nombreCompleto(c.persona), url: `${SITE_URL}/persona/${c.persona.id}` })),
            contributor: equipo.filter((c) => departamento(c) !== "Interpretación" && !/direcci/i.test(c.puesto ?? "")).map((c) => ({ "@type": "Person", name: nombreCompleto(c.persona), url: `${SITE_URL}/persona/${c.persona.id}` })),
            award: premios.map((p) => p.galardon_obra),
            typicalAgeRange: obra.edad ? edadSchema(obra.edad) : undefined,
            accessibilityFeature: obra.accesibilidad?.length ? obra.accesibilidad : undefined,
            contentWarning: obra.avisos?.length ? obra.avisos : undefined,
            isBasedOn: obra.basada_en ? { "@type": "CreativeWork", name: obra.basada_en, author: obra.basada_autor ? { "@type": "Person", name: obra.basada_autor } : undefined } : undefined,
            datePublished: obra.estreno_fecha || undefined,
            locationCreated: obra.estreno_lugar ? { "@type": "Place", name: obra.estreno_lugar } : undefined,
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
            location: { "@type": "Place", name: fn.sala, address: { "@type": "PostalAddress", addressLocality: fn.ciudad || undefined } },
            offers: fn.entradas ? { "@type": "Offer", url: fn.entradas, availability: "https://schema.org/InStock" } : undefined,
            performer: elenco.slice(0, 6).map((c) => ({ "@type": "Person", name: nombreCompleto(c.persona) })),
            organizer: productora ? { "@type": "Organization", name: productora.nombre_prod, url: `${SITE_URL}/compania/${productora.id}` } : undefined,
          })),
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: t("Obras"), item: `${SITE_URL}${ruta(lang, "/obras")}` },
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
            <nav aria-label={t("Ruta")} className="breadcrumb">
              <Link href="/obras">{t("Obras")}</Link>
              {generos[0] ? <> / <Link href={`/obras?genero=${encodeURIComponent(generos[0])}`}>{t(generos[0])}</Link></> : null}
            </nav>
            <div className="chips" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {proximas.length ? <span className="chip chip-foco chip-dot">{t("En cartel · {fecha}", { fecha: fechaCorta(proximas[0].fecha, lang) })}</span> : obraActiva(obra) ? <span className="chip chip-foco chip-dot">{t("En activo")}</span> : <span className="chip">{t("Finalizada")}</span>}
              {generos.map((g) => <span key={g} className="chip">{t(g)}</span>)}
              {obra.gira ? <a href="#gira" className="chip chip-ok">{t("Disponible para gira")}</a> : null}
            </div>
            <h1 className="h1">{obra.titulo}</h1>
            {cuando || productora || obra.compania ? (
              <p style={{ margin: "12px 0 0", fontSize: 18 }} className="soft">
                {cuando}
                {productora ? <> · <Link href={`/compania/${productora.id}`} style={{ color: "var(--foco)" }}>{productora.nombre_prod}</Link></> : obra.compania ? <> · {obra.compania}</> : null}
              </p>
            ) : null}
            </div>
            <Valoracion obraId={obra.id} votos={obra.votos} nota={obra.nota} />
            <div className="actions">
              <EditarFicha dueno={obra.creacion} href={`/panel/obra/${obra.id}`} texto={t("Editar obra")} />
              <ObraActions obraId={obra.id} />
              <StoryBoton obraId={obra.id} titulo={obra.titulo} personasEnObra={[...new Set(equipo.map((c) => c.persona.id))]} />
            </div>
            {obra.sinopsis ? (
              <>
                <h2 className="eyebrow" style={{ margin: "36px 0 10px" }}>{t("Sinopsis")}</h2>
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
              <h2 className="h2" style={{ marginBottom: 16 }}>{t("Dónde verla")}</h2>
              {proximas.length ? (
                <ul className="list">
                  {proximas.map((fn, i) => (
                    <li key={i} className="funcion">
                      <span className="funcion-fecha"><strong>{fechaCorta(fn.fecha, lang)}</strong>{fn.hora ? <span className="hint">{t("{hora} h", { hora: fn.hora })}</span> : null}</span>
                      <span style={{ minWidth: 0 }}><strong style={{ display: "block" }}>{fn.sala_id ? <Link href={`/sala/${fn.sala_id}`} style={{ color: "var(--foco)" }}>{fn.sala}</Link> : fn.sala}</strong>{fn.ciudad ? <span className="hint">{fn.ciudad}</span> : null}</span>
                      {enlaceSeguro(fn.entradas) ? <a href={enlaceSeguro(fn.entradas)} className="btn btn-primary" target="_blank" rel="noopener noreferrer nofollow">{t("Entradas")}</a> : <span />}
                    </li>
                  ))}
                </ul>
              ) : <p className="muted" style={{ margin: 0 }}>{t("No hay funciones próximas anunciadas.")}</p>}
              {pasadas.length ? (
                <details style={{ marginTop: 14 }}>
                  <summary className="hint" style={{ cursor: "pointer" }}>{t("Funciones pasadas ({length})", { length: pasadas.length })}</summary>
                  <ul className="list" style={{ marginTop: 8 }}>
                    {pasadas.map((fn, i) => <li key={i} className="hint" style={{ padding: "8px 0" }}>{fechaCorta(fn.fecha, lang)} · {fn.sala}{fn.ciudad ? ` (${fn.ciudad})` : ""}</li>)}
                  </ul>
                </details>
              ) : null}
            </section>
          ) : null}
          {hayRelevos ? <VistaElenco activa={obraActiva(obra)} total={equipo.length}>{SECCIONES}</VistaElenco> : SECCIONES}

          {yt || fotos.length ? (
            <section id="galeria" style={{ marginTop: 56 }}>
              <h2 className="h2" style={{ marginBottom: 20 }}>{t("Galería")}</h2>
              {yt ? (
                <Trailer id={yt} titulo={obra.titulo} />
              ) : null}
              <Galeria fotos={fotos} titulo={obra.titulo} />
            </section>
          ) : null}
        </div>

        <aside className="side-col">
          <div className="panel">
            <h2 className="eyebrow">{t("Ficha técnica")}</h2>
            <dl className="dl">
              {cuando ? <><dt>{t("Años")}</dt><dd>{cuando}</dd></> : null}
              {estreno ? <><dt>{t("Estreno")}</dt><dd>{estreno}</dd></> : null}
              {productora ? <><dt>{t("Compañía")}</dt><dd><Link href={`/compania/${productora.id}`}>{productora.nombre_prod}</Link></dd></> : obra.compania ? <><dt>{t("Compañía")}</dt><dd>{obra.compania}</dd></> : null}
              {obra.apoyos ? <><dt>{t("Apoyos")}</dt><dd>{obra.apoyos}</dd></> : null}
              {obra.basada_en ? <><dt>{t("Basada en")}</dt><dd><em>{obra.basada_en}</em>{obra.basada_autor ? t(", de {basada_autor}", { basada_autor: obra.basada_autor }) : ""}</dd></> : null}
              {obra.duracion ? <><dt>{t("Duración")}</dt><dd>{duracionTexto(obra.duracion)}</dd></> : null}
              {obra.edad ? <><dt>{t("Edad")}</dt><dd>{t(obra.edad)}</dd></> : null}
              {obra.idioma ? <><dt>{t("Idioma")}</dt><dd>{t(obra.idioma)}</dd></> : null}
              {obra.accesibilidad?.length ? <><dt>{t("Accesibilidad")}</dt><dd>{obra.accesibilidad.map((a) => t(a)).join(" · ")}</dd></> : null}
              {ig ? <><dt>{t("Redes")}</dt><dd><a href={ig} target="_blank" rel="noopener noreferrer nofollow" style={{ color: "var(--foco)" }}>{instagramHandle(obra.instagram)}</a></dd></> : null}
            </dl>
          </div>
          {obra.avisos?.length ? (
            <div className="panel">
              <h2 className="eyebrow">{t("Antes de ir")}</h2>
              <p className="hint" style={{ margin: "0 0 8px" }}>{t("La obra incluye:")}</p>
              <ul style={{ margin: 0, paddingLeft: 18 }} className="soft">{obra.avisos.map((a) => <li key={a}>{t(a)}</li>)}</ul>
            </div>
          ) : null}
          {obra.gira && contacto ? (
            <div className="panel panel-foco" id="gira">
              <h2 className="eyebrow">{t("Disponible para gira")}</h2>
              <p className="hint" style={{ margin: "0 0 10px" }}>{t("¿Programas una sala o un festival? Contacta con la distribución:")}</p>
              <a href={contacto.href} className="btn btn-primary" style={{ width: "100%" }} {...(contacto.tipo === "web" ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}>{contacto.tipo === "email" ? t("Escribir a distribución") : t("Web de distribución")}</a>
              <p className="hint" style={{ margin: "8px 0 0", textAlign: "center", overflowWrap: "anywhere" }}>{contacto.texto}</p>
            </div>
          ) : null}
          {premios.length ? (
            <div className="panel">
              <h2 className="eyebrow">{t("Premios")}</h2>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }} className="stack">
                {premios.map((p) => <li key={p.id}><strong>{p.galardon_obra}</strong>{p.anio_premobr && String(p.anio_premobr) !== "NaN" ? <span className="muted"> · {String(p.anio_premobr)}</span> : null}</li>)}
              </ul>
            </div>
          ) : null}
          <div className="panel stack" style={{ gap: 10 }}>
            <h2 className="eyebrow" style={{ marginBottom: 0 }}>{t("¿Algo no cuadra?")}</h2>
            <p className="hint" style={{ margin: 0 }}>{t("Propón una corrección y le llegará a quien gestiona esta ficha.")}</p>
            <SugerirCambio tipo="obra" refId={obra.id} nombre={obra.titulo} className="btn" />
            <Link href={`/panel/obra/${obra.id}`} className="hint" style={{ textAlign: "center" }}>{t("¿Es tu obra o formas parte de ella? Gestionar ficha")}</Link>
          </div>
        </aside>
      </div>

      {relacionadas.length ? (
        <section className="wrap section">
          <h2 className="h2" style={{ marginBottom: 20 }}>{t("Si te gustó…")}</h2>
          <div className="grid-posters">{relacionadas.map((o) => <ObraCard key={o.id} obra={o} />)}</div>
        </section>
      ) : null}
    </main>
  );
}
