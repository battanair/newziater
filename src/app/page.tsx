import Link from "next/link";
import { listObras, listPersonas, listProductoras } from "@/lib/data";
import { ObraCard, PersonaCard, ProductoraCard, JsonLd } from "@/components/Cards";
import { SearchBox } from "@/components/SearchBox";
import { obraActiva } from "@/lib/format";
import { SITE_URL } from "@/lib/firebase-config";

// La portada se regenera como mucho una vez por hora (ISR): rápida y casi sin lecturas.
export const revalidate = 3600;

export default async function Home() {
  const [obras, personas, prods] = await Promise.all([listObras(), listPersonas(), listProductoras()]);
  const activas = obras.filter(obraActiva);
  const conFoto = personas.filter((p) => p.foto && !p.foto.includes("/imagenesdefecto/") && p.Nombre?.trim());

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
          Lo que ocurre en un escenario <em style={{ color: "var(--foco)" }}>no se queda en él.</em>
        </h1>
        <p className="lead" style={{ maxWidth: 600, margin: "24px 0 32px", color: "var(--texto-2)" }}>
          Encuentra obras, artistas y compañías de teatro, danza, circo e improvisación, y la trayectoria completa de quienes las hacen posibles.
        </p>
        <SearchBox hero />
      </section>

      {activas.length ? (
        <section className="wrap section">
          <div className="section-head">
            <h2 className="h2">En activo</h2>
            <Link href="/obras" style={{ color: "var(--foco)", fontWeight: 600 }}>Todas las obras →</Link>
          </div>
          <div className="grid-posters">{activas.slice(0, 12).map((o) => <ObraCard key={o.id} obra={o} />)}</div>
        </section>
      ) : null}

      <section className="wrap section">
        <div className="section-head">
          <h2 className="h2">Artistas</h2>
          <Link href="/personas" style={{ color: "var(--foco)", fontWeight: 600 }}>Todos los artistas →</Link>
        </div>
        <div className="grid-people">{(conFoto.length ? conFoto : personas).slice(0, 12).map((p) => <PersonaCard key={p.id} persona={p} />)}</div>
      </section>

      {obras.length > activas.length ? (
        <section className="wrap section">
          <div className="section-head"><h2 className="h2">Del archivo</h2></div>
          <div className="grid-posters">{obras.filter((o) => !obraActiva(o)).slice(0, 6).map((o) => <ObraCard key={o.id} obra={o} />)}</div>
        </section>
      ) : null}

      {prods.length ? (
        <section className="wrap section">
          <div className="section-head"><h2 className="h2">Compañías y productoras</h2></div>
          <div className="grid-people">{prods.slice(0, 8).map((p) => <ProductoraCard key={p.id} p={p} />)}</div>
        </section>
      ) : null}

      <section style={{ borderTop: "1px solid var(--linea)", marginTop: 48 }}>
        <div className="wrap form-grid" style={{ paddingTop: 64, paddingBottom: 32, gap: 32 }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 12 }}>Qué es Ziater</p>
            <p className="serif" style={{ margin: 0, fontSize: 30, lineHeight: 1.2 }}>La cultura como bien público.</p>
          </div>
          <div><p style={{ margin: "0 0 6px", fontWeight: 600 }}>Espectadores</p><p className="muted" style={{ margin: 0 }}>Busca obras, sigue a tus artistas y guarda lo que has visto. Gratis siempre.</p></div>
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
