import { idiomaDePagina } from "@/lib/idioma-servidor";
import { alternos, idiomaDe, traductor } from "@/lib/i18n";
import type { Metadata } from "next";
import Link from "@/components/Idioma";
import { obrasEnGira, paginaObras, type OrdenObras } from "@/lib/data";
import { ObraCard } from "@/components/Cards";
import { Paginacion } from "@/components/Paginacion";
import { AnadirObraBoton } from "@/components/AnadirObraBoton";
import { GENEROS } from "@/lib/format";

export const revalidate = 600;

const ORDENES: { k: OrdenObras; l: string }[] = [
  { k: "valoradas", l: "Mejor valoradas" },
  { k: "recientes", l: "Recién añadidas" },
  { k: "titulo", l: "A–Z" },
];

type SP = Promise<{ genero?: string; orden?: string; despues?: string; gira?: string }>;

export async function generateMetadata({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: SP }): Promise<Metadata> {
  const lang = idiomaDe((await params).lang);
  const t = traductor(lang);
  const { genero, despues, gira } = await searchParams;
  if (gira === "1") return { title: t("Obras disponibles para gira"), description: t("Obras de teatro, danza y artes escénicas disponibles para programar, con su contacto de distribución."), alternates: alternos(lang, "/obras?gira=1") };
  return {
    title: genero ? t("Obras de {genero}", { genero: t(genero).toLowerCase() }) : t("Obras de teatro, danza y artes escénicas"),
    description: t("Catálogo de obras de teatro, danza, circo e improvisación: fichas con elenco, equipo artístico, valoraciones y compañías."),
    alternates: alternos(lang, genero ? `/obras?genero=${encodeURIComponent(genero)}` : "/obras"),
    // Las páginas siguientes del listado no se indexan: Google llega a cada ficha por el sitemap
    robots: despues ? { index: false, follow: true } : undefined,
  };
}

export default async function ObrasPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: SP }) {
  const { lang, t } = await idiomaDePagina(params);
  const sp = await searchParams;
  const orden: OrdenObras = ORDENES.some((o) => o.k === sp.orden) ? (sp.orden as OrdenObras) : "valoradas";
  const genero = sp.genero && GENEROS.includes(sp.genero) ? sp.genero : undefined;
  const enGira = sp.gira === "1";
  const { items, siguiente } = enGira ? { items: await obrasEnGira(), siguiente: undefined } : await paginaObras({ orden, genero, despues: sp.despues });

  const link = (p: { orden?: string; genero?: string }) => {
    const q = new URLSearchParams(Object.entries({ orden, genero, ...p }).filter(([, v]) => v) as [string, string][]);
    return `/obras?${q}`;
  };

  return (
    <main className="wrap section">
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
        <h1 className="h1" style={{ margin: 0 }}>{enGira ? t("Obras disponibles para gira") : genero ? t("Obras · {genero}", { genero: t(genero) }) : t("Obras")}</h1>
        <AnadirObraBoton />
      </div>
      {enGira ? (
        <>
          <p className="lead soft" style={{ maxWidth: 680, marginTop: 0 }}>{t("Para salas, festivales y programadores: obras cuyas compañías buscan bolos. En cada ficha encontrarás el contacto de distribución.")}</p>
          <p style={{ margin: "0 0 28px" }}><Link href="/obras" style={{ color: "var(--foco)" }}>{t("← Todas las obras")}</Link></p>
          {items.length ? <div className="grid-posters">{items.map((o) => <ObraCard key={o.id} obra={o} />)}</div> : <p className="soft">{t("Todavía ninguna compañía ha marcado su obra como disponible para gira. Si es tu caso, márcalo en «Ficha técnica» al editar la obra.")}</p>}
        </>
      ) : null}
      {!enGira ? (<>
      <nav aria-label={t("Ordenar")} className="tabs" style={{ marginBottom: 12 }}>
        {ORDENES.map((o) => <Link key={o.k} href={link({ orden: o.k })} className="tab" aria-selected={o.k === orden} style={{ display: "inline-flex", alignItems: "center" }}>{t(o.l)}</Link>)}
      </nav>
      <nav aria-label={t("Géneros")} style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "0 0 32px" }}>
        <Link href={link({ genero: "" })} className={`chip ${!genero ? "chip-foco" : ""}`} style={{ minHeight: 40, padding: "0 14px", fontSize: 14 }}>{t("Todos los géneros")}</Link>
        {GENEROS.map((g) => <Link key={g} href={link({ genero: g === genero ? "" : g })} className={`chip ${g === genero ? "chip-foco" : ""}`} style={{ minHeight: 40, padding: "0 14px", fontSize: 14 }}>{t(g)}</Link>)}
        <Link href="/obras?gira=1" className="chip chip-ok" style={{ minHeight: 40, padding: "0 14px", fontSize: 14 }}>{t("Disponibles para gira")}</Link>
      </nav>
      {items.length ? (
        <div className="grid-posters">{items.map((o) => <ObraCard key={o.id} obra={o} />)}</div>
      ) : (
        <p className="soft">{orden === "valoradas" ? t("Todavía no hay obras valoradas aquí. Prueba con «Recién añadidas».") : t("No hay obras con esos filtros.")}</p>
      )}
      <Paginacion base="/obras" params={{ orden, genero }} siguiente={siguiente} primera={!sp.despues} />
      </>) : null}
    </main>
  );
}
