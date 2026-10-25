import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { aportacionPublica, getPersona, trayectoriaDePersona, equipoDeObra } from "@/lib/data";
import { Avatar, JsonLd, Poster } from "@/components/Cards";
import { SugerirCambio } from "@/components/SugerirCambio";
import { EditarFicha } from "@/components/EditarFicha";
import { Ayuda } from "@/components/Ayuda";
import { ShareButton } from "@/components/ObraActions";
import { SeguirArtista } from "@/components/SeguirArtista";
import { Trayectoria } from "@/components/Trayectoria";
import { T_MINI, OG_POR_DEFECTO, T_RETRATO, T_OG, cld, colorCartel, departamento, iniciales, instagramUrl, nombreCompleto, periodo, recortar, tramo } from "@/lib/format";
import { SITE_URL } from "@/lib/firebase-config";

export const revalidate = 600;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getPersona(id);
  if (!p) return { title: "Perfil no encontrado", robots: { index: false } };
  const nombre = nombreCompleto(p);
  const roles = p.roles?.length ? p.roles.join(", ") : "Artes escénicas";
  const description = recortar(p.biografia, 158) || `${nombre} (${roles}): trayectoria completa en teatro y artes escénicas en Ziater.`;
  const image = cld(p.foto, T_OG);
  return {
    title: `${nombre} · ${roles}`,
    description,
    alternates: { canonical: `/persona/${p.id}` },
    openGraph: { type: "profile", siteName: "Ziater", locale: "es_ES", title: nombre, description, url: `/persona/${p.id}`, images: [{ url: image ?? OG_POR_DEFECTO, width: 1200, height: 630, alt: nombre }] },
    twitter: { card: "summary_large_image", title: nombre, description, images: [image ?? OG_POR_DEFECTO] },
  };
}

export default async function PersonaPage({ params }: Props) {
  const { id } = await params;
  const persona = await getPersona(id);
  if (!persona) notFound();

  const nombre = nombreCompleto(persona);
  const [tray, aporta] = await Promise.all([trayectoriaDePersona(persona.id), persona.coincide ? aportacionPublica(persona.coincide) : Promise.resolve(null)]);
  const ig = instagramUrl(persona.instagram);
  const reclamada = Boolean(persona.coincide);

  // "Conocida por": las elegidas por el artista o, si no, las más recientes
  const elegidas = (persona.destacadas ?? []).map((oid) => tray.find((c) => c.obra.id === oid)).filter(Boolean) as typeof tray;
  const conocida = (elegidas.length ? elegidas : tray).filter((c, i, arr) => arr.findIndex((x) => x.obra.id === c.obra.id) === i).slice(0, 4);

  // Colaboradores frecuentes: personas que comparten más obras
  const equipos = await Promise.all([...new Set(tray.map((c) => c.obra.id))].slice(0, 20).map((oid) => equipoDeObra(oid)));
  const cuenta = new Map<string, { n: number; p: (typeof equipos)[number][number]["persona"] }>();
  for (const eq of equipos) for (const id2 of new Set(eq.map((c) => c.persona.id))) {
    if (id2 === persona.id) continue;
    const p = eq.find((c) => c.persona.id === id2)!.persona;
    cuenta.set(id2, { n: (cuenta.get(id2)?.n ?? 0) + 1, p });
  }
  const colaboradores = [...cuenta.values()].sort((a, b) => b.n - a.n).slice(0, 6);

  const grupos = new Map<string, { y: string; obraId: string; titulo: string; detalle: string; rol: string; img?: string; color: string }[]>();
  for (const c of tray) {
    const dep = departamento(c);
    const fila = { y: (c.desde ? c.desde.slice(0, 4) : periodo(c.fecha_inicio || c.obra.anoinicio, c.fecha_fin || c.obra.anofin).split(" ")[0]) || "—", obraId: c.obra.id, titulo: c.obra.titulo, detalle: (c.obra.categoria ?? []).filter(Boolean).join(" · "), rol: [c.titulo?.trim() || dep, tramo(c)].filter(Boolean).join(" · "), img: cld(c.obra.cartel, T_MINI), color: colorCartel(c.obra.id) };
    grupos.set(dep, [...(grupos.get(dep) ?? []), fila]);
  }
  const url = `${SITE_URL}/persona/${persona.id}`;
  const roles = persona.roles?.length ? persona.roles : [...grupos.keys()];

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          url,
          mainEntity: {
            "@type": "Person",
            "@id": url,
            name: nombre,
            givenName: persona.Nombre,
            familyName: persona.Apellidos,
            image: persona.foto,
            description: persona.biografia,
            jobTitle: roles.length ? roles.join(", ") : undefined,
            homeLocation: persona.ciudad ? { "@type": "Place", name: persona.ciudad } : undefined,
            sameAs: ig ? [ig] : undefined,
            performerIn: tray.filter((c) => departamento(c) === "Interpretación").map((c) => ({ "@type": "CreativeWork", name: c.obra.titulo, url: `${SITE_URL}/obra/${c.obra.id}` })),
          },
        }}
      />

      <section className="hero-ficha">
        <div className="wrap hero-ficha-in">
          <div className="hero-media" style={{ maxWidth: 300 }}>
            <div style={{ position: "relative", aspectRatio: "2/3", borderRadius: 8, overflow: "hidden", background: colorCartel(persona.id), display: "flex", alignItems: "center", justifyContent: "center" }}>
              {cld(persona.foto, T_RETRATO) ? (
                <Image src={cld(persona.foto, T_RETRATO)!} alt={`Foto de ${nombre}`} fill sizes="300px" priority style={{ objectFit: "cover" }} />
              ) : (
                <span className="serif" style={{ fontSize: 96, color: "#f6e6cc" }} aria-hidden="true">{iniciales(nombre)}</span>
              )}
            </div>
          </div>
          <div className="hero-text">
            <div className="hero-cab">
            <nav aria-label="Ruta" className="breadcrumb"><Link href="/personas">Artistas</Link></nav>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
              <h1 className="h1">{nombre}</h1>
              {persona.verificado ? <span className="chip chip-foco">✓ Perfil verificado <Ayuda etiqueta="Qué significa perfil verificado">El equipo de Ziater ha comprobado que esta ficha la gestiona la propia persona.</Ayuda></span> : null}
            </div>
            {roles.length ? <p className="soft" style={{ margin: "14px 0 0", fontSize: 18 }}>{roles.join(" · ")}</p> : null}
            </div>

            <dl className="stats">
              {persona.ciudad ? <div><dt>Ciudad</dt><dd>{persona.ciudad}</dd></div> : null}
              <div><dt>Obras</dt><dd>{new Set(tray.map((c) => c.obra.id)).size}</dd></div>
              {tray.length ? <div><dt>Desde</dt><dd>{tray.map((c) => Number(c.fecha_inicio || c.obra.anoinicio)).filter((n) => n > 1900).sort()[0] ?? "—"}</dd></div> : null}
            </dl>

            {persona.biografia ? (
              persona.biografia.length > 420 ? (
                <details>
                  <summary style={{ listStyle: "none", cursor: "pointer" }}>
                    <p className="lead" style={{ margin: 0, maxWidth: 700 }}>{recortar(persona.biografia, 400)}</p>
                    <span style={{ color: "var(--foco)", fontWeight: 600, display: "inline-block", marginTop: 10 }}>Leer biografía completa</span>
                  </summary>
                  <p className="lead" style={{ maxWidth: 700, whiteSpace: "pre-line" }}>{persona.biografia}</p>
                </details>
              ) : (
                <p className="lead" style={{ margin: 0, maxWidth: 700, whiteSpace: "pre-line" }}>{persona.biografia}</p>
              )
            ) : null}

            <div className="actions" style={{ marginTop: 24 }}>
              <EditarFicha dueno={persona.coincide || undefined} href="/panel/ficha" texto="Editar mi ficha" />
              {ig ? <a href={ig} className="btn" target="_blank" rel="noopener noreferrer nofollow">Instagram</a> : null}
              <SeguirArtista personaId={persona.id} />
              <ShareButton />
              <SugerirCambio tipo="persona" refId={persona.id} nombre={nombre} className="btn btn-ghost" />
              {!reclamada ? <Link href={`/reclamar/${persona.id}`} className="btn btn-primary">¿Eres tú? Reclama esta ficha</Link> : null}
            </div>
          </div>
        </div>
      </section>

      {conocida.length ? (
        <section className="wrap section">
          <h2 className="h2" style={{ marginBottom: 20 }}>Conocido por</h2>
          <div className="grid-posters">
            {conocida.map((c) => (
              <Link key={c.obra.id} href={`/obra/${c.obra.id}`} className="card" style={{ display: "block" }}>
                <Poster obra={c.obra} />
                <span className="card-title">{c.obra.titulo}</span>
                <span className="card-sub">{[c.titulo?.trim(), tramo(c) || periodo(c.fecha_inicio || c.obra.anoinicio, c.fecha_fin || c.obra.anofin)].filter(Boolean).join(" · ")}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="wrap row section">
        <div className="main-col">
          <h2 className="h2" style={{ marginBottom: 16 }}>Trayectoria</h2>
          {grupos.size ? <Trayectoria grupos={[...grupos.entries()].map(([dep, filas]) => ({ dep, filas }))} /> : <p className="muted">Todavía no hay obras en esta ficha.</p>}
        </div>
        <aside className="side-col">
          {aporta && aporta.total > 0 ? (
            <div className="panel panel-foco">
              <h2 className="eyebrow">Colabora en Ziater</h2>
              <p className="soft" style={{ margin: "0 0 10px" }}>
                {persona.Nombre} ha aportado {[aporta.obras && `${aporta.obras} ${aporta.obras === 1 ? "obra" : "obras"}`, aporta.fichas && `${aporta.fichas} ${aporta.fichas === 1 ? "ficha" : "fichas"}`, aporta.creditos && `${aporta.creditos} ${aporta.creditos === 1 ? "crédito" : "créditos"}`].filter(Boolean).join(", ")} a la base de datos. ¡Gracias!
              </p>
              <Link href="/colaboradores" className="hint" style={{ textDecoration: "underline" }}>Ver quién más colabora</Link>
            </div>
          ) : null}
          {colaboradores.length ? (
            <div className="panel">
              <h2 className="eyebrow">Colaboradores frecuentes</h2>
              <div className="stack" style={{ gap: 12 }}>
                {colaboradores.map(({ p, n }) => (
                  <Link key={p.id} href={`/persona/${p.id}`} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar persona={p} size={44} />
                    <span><strong style={{ display: "block" }}>{nombreCompleto(p)}</strong><span className="hint">{n} {n === 1 ? "obra" : "obras"} juntos</span></span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          {!reclamada ? (
            <div className="panel panel-foco">
              <h2 className="eyebrow">¿Eres {persona.Nombre}? <Ayuda etiqueta="Qué es reclamar una ficha">Reclamar es pedir el control de tu ficha: podrás editar tu biografía y tu foto y confirmar en qué obras has participado. Antes de aprobarlo, el equipo comprueba que eres tú (por Instagram, tu compañía o tu representante).</Ayuda></h2>
              <p className="soft" style={{ marginTop: 0 }}>Reclama tu ficha para editar tu biografía, tu foto y confirmar tus créditos.</p>
              <Link href={`/reclamar/${persona.id}`} className="btn btn-primary" style={{ width: "100%" }}>Reclamar ficha</Link>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
