import { idiomaDePagina } from "@/lib/idioma-servidor";
import { alternos, idiomaDe } from "@/lib/i18n";
import type { Metadata } from "next";
import Link from "@/components/Idioma";
import { artistasDestacados, cartelera, obrasEnCartel, obrasMejorValoradas, obrasRecientes, productorasDestacadas } from "@/lib/data";
import { fechaCorta, hoyES } from "@/lib/format";
import { ParaTi } from "@/components/ParaTi";
import { ObraCard, PersonaCard, ProductoraCard, JsonLd } from "@/components/Cards";
import { SearchBox } from "@/components/SearchBox";
import { SITE_URL } from "@/lib/firebase-config";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  return { alternates: alternos(idiomaDe((await params).lang), "/") };
}

// La portada nunca carga todas las fichas: solo selecciones pequeñas y
// ordenadas (12 + 12 + 12 + 8 documentos), cacheadas 10 minutos y renovadas al momento al guardar.
export const revalidate = 600;

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang, t } = await idiomaDePagina(params);
  const [enCartel, top, recientes, artistas, prods, cart] = await Promise.all([
    obrasEnCartel(hoyES(), 6),
    obrasMejorValoradas(12),
    obrasRecientes(12),
    artistasDestacados(12),
    productorasDestacadas(8),
    cartelera(hoyES()),
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
            alternateName: t("Ziater, la base de datos de las artes escénicas"),
            url: lang === "en" ? `${SITE_URL}/en` : SITE_URL,
            inLanguage: lang,
            publisher: { "@id": `${SITE_URL}/#organizacion` },
            potentialAction: { "@type": "SearchAction", target: `${SITE_URL}${lang === "en" ? "/en" : ""}/buscar?q={search_term_string}`, "query-input": "required name=search_term_string" },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${SITE_URL}/#organizacion`,
            name: "Ziater",
            url: SITE_URL,
            logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png`, width: 512, height: 512 },
            description: t("Base de datos abierta de las artes escénicas: obras, artistas y compañías de teatro, danza, circo e improvisación."),
          },
        ]}
      />

      <section className="wrap" style={{ paddingTop: 72, paddingBottom: 48 }}>
        <p className="eyebrow" style={{ marginBottom: 18 }}>{t("La base de datos de las artes escénicas")}</p>
        <h1 className="display" style={{ maxWidth: 900 }}>{t("Lo que ocurre en un escenario")}{" "}<span className="acento">{t("no se queda en él.")}</span>
        </h1>
        <p className="lead" style={{ maxWidth: 600, margin: "24px 0 32px", color: "var(--texto-2)" }}>{t("Encuentra obras, artistas y compañías de teatro, danza, circo e improvisación, y la trayectoria completa de quienes las hacen posibles.")}</p>
        <SearchBox hero />
      </section>

      <ParaTi />

      <section className="wrap section que-es solo-sin-sesion" aria-labelledby="que-es-ziater">
        <div className="que-es-intro">
          <p className="eyebrow" style={{ marginBottom: 12 }}>{t("Qué es Ziater")}</p>
          <h2 id="que-es-ziater" className="h2" style={{ margin: "0 0 12px" }}>{t("La memoria viva de las artes escénicas.")}</h2>
          <p className="soft" style={{ margin: 0, maxWidth: 720 }}>{t("Ziater es una base de datos abierta de teatro, danza, circo, impro y musical. Cada obra aparece con su elenco, su equipo, sus fechas y dónde verla. Cada artista, con su trayectoria. Consultarla y participar es gratis.")}</p>
        </div>
        <div className="que-es-cols">
          <div className="panel que-es-col">
            <h3 className="que-es-tit">{t("Si eres artista")}</h3>
            <ul className="que-es-lista">
              <li>{t("Tu trayectoria completa en una ficha pública, para compartirla como si fuera tu CV.")}</li>
              <li>{t("Si ya tienes ficha, la reclamas. Si no, la creas en un minuto.")}</li>
              <li>{t("Sube tus obras con elenco, equipo y fotos: tus compañeros quedan enlazados.")}</li>
              <li>{t("Anuncia tus funciones con la sala, la fecha y el enlace a las entradas.")}</li>
              <li>{t("Registra los relevos: elenco original, el actual y quienes han pasado por la obra.")}</li>
            </ul>
            <Link href="/signup?profesional=1" className="btn btn-primary">{t("Crear o reclamar mi ficha")}</Link>
          </div>
          <div className="panel que-es-col">
            <h3 className="que-es-tit">{t("Si eres público")}</h3>
            <ul className="que-es-lista">
              <li>{t("Descubre qué hay en cartel, en qué sala y con enlace a las entradas.")}</li>
              <li>{t("Busca cualquier obra, artista, compañía o sala y mira quién hizo qué.")}</li>
              <li>{t("Puntúa lo que has visto y apunta lo que quieres ver.")}</li>
              <li>{t("Sigue a tus artistas favoritos y verás sus obras en tu portada.")}</li>
              <li>{t("¿Falta algo o hay un error? Sugiere el cambio y ayuda a completar las fichas.")}</li>
            </ul>
            <Link href="/signup" className="btn">{t("Crear mi cuenta gratis")}</Link>
          </div>
        </div>
        <p className="hint" style={{ margin: "16px 0 0" }}>{t("¿Programas una sala o un teatro?")}{" "}<Link href="/panel/sala/nueva" style={{ color: "var(--foco)", fontWeight: 600 }}>{t("Dala de alta")}</Link>{" "}{t("y tendrás tu cartelera en Ziater.")}</p>
      </section>

      {enCartel.length ? (
        <section className="wrap section">
          <div className="section-head">
            <div>
              <h2 className="h2">{t("En cartel")}</h2>
              <p className="muted" style={{ margin: "6px 0 0" }}>{t("Próximas funciones")}</p>
            </div>
            <Link href="/cartelera" style={{ color: "var(--foco)", fontWeight: 600 }}>{t("Ver la cartelera →")}</Link>
          </div>
          {cart.ciudades.length ? (
            <nav aria-label={t("Cartelera por ciudad")} style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "-6px 0 20px" }}>
              {cart.ciudades.slice(0, 8).map((c) => <Link key={c.slug} href={`/cartelera/${c.slug}`} className="chip" style={{ minHeight: 36, padding: "0 12px", fontSize: 14 }}>{t("Esta semana en {nombre}", { nombre: c.nombre })}</Link>)}
            </nav>
          ) : null}
          <div className="grid-posters">{enCartel.map((o) => <ObraCard key={o.id} obra={o} etiqueta={t("Próxima: {fecha}", { fecha: fechaCorta(o.proxima, lang) })} />)}</div>
        </section>
      ) : null}

      {top.length ? (
        <section className="wrap section">
          <div className="section-head">
            <div>
              <h2 className="h2">{t("Mejor valoradas")}</h2>
              <p className="muted" style={{ margin: "6px 0 0" }}>{t("Según las notas del público")}</p>
            </div>
            <Link href="/obras?orden=valoradas" style={{ color: "var(--foco)", fontWeight: 600 }}>{t("Ver el ranking →")}</Link>
          </div>
          <div className="grid-posters">{top.slice(0, 6).map((o) => <ObraCard key={o.id} obra={o} />)}</div>
        </section>
      ) : null}

      {recientesSinTop.length ? (
        <section className="wrap section">
          <div className="section-head">
            <h2 className="h2">{t("Recién añadidas")}</h2>
            <Link href="/obras?orden=recientes" style={{ color: "var(--foco)", fontWeight: 600 }}>{t("Todas las obras →")}</Link>
          </div>
          <div className="grid-posters">{recientesSinTop.slice(0, 6).map((o) => <ObraCard key={o.id} obra={o} />)}</div>
        </section>
      ) : null}

      {artistas.length ? (
        <section className="wrap section">
          <div className="section-head">
            <div>
              <h2 className="h2">{t("Artistas destacados")}</h2>
              <p className="muted" style={{ margin: "6px 0 0" }}>{t("De las obras mejor valoradas")}</p>
            </div>
            <Link href="/personas" style={{ color: "var(--foco)", fontWeight: 600 }}>{t("Todos los artistas →")}</Link>
          </div>
          <div className="grid-people desliza">{artistas.map((p) => <PersonaCard key={p.id} persona={p} />)}</div>
        </section>
      ) : null}

      {prods.length ? (
        <section className="wrap section">
          <div className="section-head">
            <h2 className="h2">{t("Compañías y productoras")}</h2>
            <Link href="/companias" style={{ color: "var(--foco)", fontWeight: 600 }}>{t("Todas →")}</Link>
          </div>
          <div className="grid-people desliza">{prods.map((p) => <ProductoraCard key={p.id} p={p} />)}</div>
        </section>
      ) : null}

    </main>
  );
}
