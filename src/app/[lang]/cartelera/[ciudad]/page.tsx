import { idiomaDePagina } from "@/lib/idioma-servidor";
import { alternos, idiomaDe, traductor } from "@/lib/i18n";
import type { Metadata } from "next";
import Link from "@/components/Idioma";
import { notFound } from "next/navigation";
import { cartelera } from "@/lib/data";
import { hoyES, sumarDias } from "@/lib/format";
import { CiudadesCartelera, DiasCartelera, EventosCartelera } from "@/components/Cartelera";

export const revalidate = 600;

type P = Promise<{ ciudad: string; lang: string }>;

async function datos(slug: string) {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const hoy = hoyES();
  const c = await cartelera(hoy);
  const ciudad = c.ciudades.find((x) => x.slug === slug);
  if (!ciudad) return null;
  return { hoy, ciudad, ciudades: c.ciudades, funciones: c.funciones.filter((f) => f.slug === slug) };
}

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const lang = idiomaDe((await params).lang);
  const t = traductor(lang);
  const d = await datos((await params).ciudad);
  if (!d) return { title: t("Cartelera"), robots: { index: false } };
  const n = d.ciudad.nombre;
  return {
    title: t("Teatro en {ciudad} esta semana", { ciudad: n }),
    description: t("Qué ver en {ciudad}: obras de teatro, danza, circo e impro en cartel esta semana, con horarios, salas y entradas.", { ciudad: n }),
    alternates: alternos(lang, `/cartelera/${d.ciudad.slug}`),
  };
}

export default async function CarteleraCiudad({ params }: { params: P }) {
  const { t } = await idiomaDePagina(params);
  const d = await datos((await params).ciudad);
  if (!d) notFound();
  const finSemana = sumarDias(d.hoy, 6);
  const semana = d.funciones.filter((f) => f.fecha <= finSemana);
  const despues = d.funciones.filter((f) => f.fecha > finSemana);
  const obras = new Set(d.funciones.map((f) => f.obra.id)).size;

  return (
    <main className="wrap section">
      <EventosCartelera funciones={d.funciones} />
      <p className="eyebrow" style={{ marginBottom: 12 }}><Link href="/cartelera">{t("Cartelera")}</Link> · {d.ciudad.nombre}</p>
      <h1 className="h1" style={{ marginBottom: 12 }}>{t("Esta semana en {nombre}", { nombre: d.ciudad.nombre })}</h1>
      <p className="lead soft" style={{ maxWidth: 680, marginTop: 0 }}>{(obras === 1 ? t("1 obra con funciones anunciadas en los próximos dos meses.") : t("{n} obras con funciones anunciadas en los próximos dos meses.", { n: obras }))}</p>
      <div style={{ margin: "20px 0 36px" }}><CiudadesCartelera ciudades={d.ciudades} actual={d.ciudad.slug} /></div>

      {semana.length ? <DiasCartelera funciones={semana} hoy={d.hoy} /> : <p className="soft">{t("No hay funciones en {nombre} los próximos siete días. Mira lo que viene más adelante.", { nombre: d.ciudad.nombre })}</p>}

      {despues.length ? (
        <section style={{ marginTop: 48 }}>
          <h2 className="h2" style={{ marginBottom: 16 }}>{t("Más adelante en {nombre}", { nombre: d.ciudad.nombre })}</h2>
          <DiasCartelera funciones={despues.slice(0, 60)} hoy={d.hoy} />
        </section>
      ) : null}
    </main>
  );
}
