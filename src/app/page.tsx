import Link from "next/link";
import { artistasDestacados, obrasMejorValoradas, obrasRecientes, productorasDestacadas } from "@/lib/data";
import { ObraCard, PersonaCard, ProductoraCard, JsonLd } from "@/components/Cards";
import { SearchBox } from "@/components/SearchBox";
import { SITE_URL } from "@/lib/firebase-config";

// La portada nunca carga todas las fichas: solo selecciones pequeñas y
// ordenadas (12 + 12 + 12 + 8 documentos), cacheadas 10 minutos y renovadas al momento al guardar.
export const revalidate = 600;

export default async function Home() {
  const [top, recientes, artistas, prods] = await Promise.all([
    obrasMejorValoradas(12),
    obrasRecientes(12),
    artistasDestacados(12),
    productorasDestacadas(8),
  ]);
  const recientesSinTop = recientes.filter((o) => !top.slice(0, 6).some((t) => t.id === o.id));

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Ziater",
          url: SITE_URL,
          inLanguage: "es",
          potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/buscar?q={search_term_string}`, "query-input": "required name=search_term_string" },
        }}
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

      <section style={{ borderTop: "1px solid var(--linea)", marginTop: 48 }}>
        <div className="wrap form-grid" style={{ paddingTop: 64, paddingBottom: 32, gap: 32 }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 12 }}>Qué es Ziater</p>
            <p className="serif" style={{ margin: 0, fontSize: 30, lineHeight: 1.2 }}>La cultura como bien público.</p>
          </div>
          <div><p style={{ margin: "0 0 6px", fontWeight: 600 }}>Espectadores</p><p className="muted" style={{ margin: 0 }}>Busca obras, puntúa lo que has visto y sigue a tus artistas. Gratis siempre.</p></div>
          <div><p style={{ margin: "0 0 6px", fontWeight: 600 }}>Profesionales</p><p className="muted" style={{ margin: 0 }}>Tu trayectoria completa en una ficha pública que puedes compartir. Gratis siempre.</p></div>
          <div>
            <p style={{ margin: "0 0 6px", fontWeight: 600 }}>¿Trabajas en las artes escénicas?</p>
            <p className="muted" style={{ margin: "0 0 14px" }}>Quizá ya tienes ficha. Reclámala o crea la tuya en un minuto.</p>
            <Link href="/signup?profesional=1" className="btn btn-primary">Crear o reclamar mi ficha</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
