import type { Metadata } from "next";
import Link from "next/link";
import { artistasDestacados, obrasEnCartel, obrasMejorValoradas, obrasRecientes, productorasDestacadas } from "@/lib/data";
import { fechaCorta, hoyES } from "@/lib/format";
import { ParaTi } from "@/components/ParaTi";
import { ObraCard, PersonaCard, ProductoraCard, JsonLd } from "@/components/Cards";
import { SearchBox } from "@/components/SearchBox";
import { SITE_URL } from "@/lib/firebase-config";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// La portada nunca carga todas las fichas: solo selecciones pequeñas y
// ordenadas (12 + 12 + 12 + 8 documentos), cacheadas 10 minutos y renovadas al momento al guardar.
export const revalidate = 600;

export default async function Home() {
  const [enCartel, top, recientes, artistas, prods] = await Promise.all([
    obrasEnCartel(hoyES(), 6),
    obrasMejorValoradas(12),
    obrasRecientes(12),
    artistasDestacados(12),
    productorasDestacadas(8),
  ]);
  const recientesSinTop = recientes.filter((o) => !top.slice(0, 6).some((t) => t.id === o.id));

  return (
    <main>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${SITE_URL}/#web`,
            name: "Ziater",
            alternateName: "Ziater, la base de datos de las artes escénicas",
            url: SITE_URL,
            inLanguage: "es",
            publisher: { "@id": `${SITE_URL}/#organizacion` },
            potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/buscar?q={search_term_string}`, "query-input": "required name=search_term_string" },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${SITE_URL}/#organizacion`,
            name: "Ziater",
            url: SITE_URL,
            logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png`, width: 512, height: 512 },
            description: "Base de datos abierta de las artes escénicas: obras, artistas y compañías de teatro, danza, circo e improvisación.",
          },
        ]}
      />

      <section className="wrap" style={{ paddingTop: 72, paddingBottom: 48 }}>
        <p className="eyebrow" style={{ marginBottom: 18 }}>La base de datos de las artes escénicas</p>
        <h1 className="display" style={{ maxWidth: 900 }}>
          Lo que ocurre en un escenario <span className="acento">no se queda en él.</span>
        </h1>
        <p className="lead" style={{ maxWidth: 600, margin: "24px 0 32px", color: "var(--texto-2)" }}>
          Encuentra obras, artistas y compañías de teatro, danza, circo e improvisación, y la trayectoria completa de quienes las hacen posibles.
        </p>
        <SearchBox hero />
      </section>

      <ParaTi />

      <section className="wrap section que-es" aria-labelledby="que-es-ziater">
        <div className="que-es-intro">
          <p className="eyebrow" style={{ marginBottom: 12 }}>Qué es Ziater</p>
          <h2 id="que-es-ziater" className="h2" style={{ margin: "0 0 12px" }}>La memoria viva de las artes escénicas.</h2>
          <p className="soft" style={{ margin: 0, maxWidth: 720 }}>
            Ziater es una base de datos abierta de teatro, danza, circo, impro y musical. Cada obra aparece con su elenco, su equipo, sus fechas y dónde verla. Cada artista, con su trayectoria completa. Gratis, siempre.
          </p>
        </div>
        <div className="que-es-cols">
          <div className="panel que-es-col">
            <h3 className="que-es-tit">Si eres artista</h3>
            <ul className="que-es-lista">
              <li>Tu trayectoria completa en una ficha pública, para compartirla como si fuera tu CV.</li>
              <li>Si ya tienes ficha, la reclamas. Si no, la creas en un minuto.</li>
              <li>Sube tus obras con elenco, equipo y fotos: tus compañeros quedan enlazados.</li>
              <li>Anuncia tus funciones con la sala, la fecha y el enlace a las entradas.</li>
              <li>Registra los relevos: elenco original, el actual y quienes han pasado por la obra.</li>
            </ul>
            <Link href="/signup?profesional=1" className="btn btn-primary">Crear o reclamar mi ficha</Link>
          </div>
          <div className="panel que-es-col">
            <h3 className="que-es-tit">Si eres público</h3>
            <ul className="que-es-lista">
              <li>Descubre qué hay en cartel, en qué sala y con enlace a las entradas.</li>
              <li>Busca cualquier obra, artista, compañía o sala y mira quién hizo qué.</li>
              <li>Puntúa lo que has visto y apunta lo que quieres ver.</li>
              <li>Sigue a tus artistas favoritos y verás sus obras en tu portada.</li>
              <li>¿Falta algo o hay un error? Sugiere el cambio y ayuda a completar las fichas.</li>
            </ul>
            <Link href="/signup" className="btn">Crear mi cuenta gratis</Link>
          </div>
        </div>
        <p className="hint" style={{ margin: "16px 0 0" }}>¿Programas una sala o un teatro? <Link href="/panel/sala/nueva" style={{ color: "var(--foco)", fontWeight: 600 }}>Dala de alta</Link> y tendrás tu cartelera en Ziater.</p>
      </section>

      {enCartel.length ? (
        <section className="wrap section">
          <div className="section-head">
            <div>
              <h2 className="h2">En cartel</h2>
              <p className="muted" style={{ margin: "6px 0 0" }}>Próximas funciones</p>
            </div>
          </div>
          <div className="grid-posters">{enCartel.map((o) => <ObraCard key={o.id} obra={o} etiqueta={`Próxima: ${fechaCorta(o.proxima)}`} />)}</div>
        </section>
      ) : null}

      {top.length ? (
        <section className="wrap section">
          <div className="section-head">
            <div>
              <h2 className="h2">Mejor valoradas</h2>
              <p className="muted" style={{ margin: "6px 0 0" }}>Según las notas del público</p>
            </div>
            <Link href="/obras?orden=valoradas" style={{ color: "var(--foco)", fontWeight: 600 }}>Ver el ranking →</Link>
          </div>
          <div className="grid-posters">{top.slice(0, 6).map((o) => <ObraCard key={o.id} obra={o} />)}</div>
        </section>
      ) : null}

      {recientesSinTop.length ? (
        <section className="wrap section">
          <div className="section-head">
            <h2 className="h2">Recién añadidas</h2>
            <Link href="/obras?orden=recientes" style={{ color: "var(--foco)", fontWeight: 600 }}>Todas las obras →</Link>
          </div>
          <div className="grid-posters">{recientesSinTop.slice(0, 6).map((o) => <ObraCard key={o.id} obra={o} />)}</div>
        </section>
      ) : null}

      {artistas.length ? (
        <section className="wrap section">
          <div className="section-head">
            <div>
              <h2 className="h2">Artistas destacados</h2>
              <p className="muted" style={{ margin: "6px 0 0" }}>De las obras mejor valoradas</p>
            </div>
            <Link href="/personas" style={{ color: "var(--foco)", fontWeight: 600 }}>Todos los artistas →</Link>
          </div>
          <div className="grid-people desliza">{artistas.map((p) => <PersonaCard key={p.id} persona={p} />)}</div>
        </section>
      ) : null}

      {prods.length ? (
        <section className="wrap section">
          <div className="section-head">
            <h2 className="h2">Compañías y productoras</h2>
            <Link href="/companias" style={{ color: "var(--foco)", fontWeight: 600 }}>Todas →</Link>
          </div>
          <div className="grid-people desliza">{prods.map((p) => <ProductoraCard key={p.id} p={p} />)}</div>
        </section>
      ) : null}

    </main>
  );
}
