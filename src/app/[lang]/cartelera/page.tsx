import { idiomaDePagina } from "@/lib/idioma-servidor";
import { alternos, idiomaDe, traductor } from "@/lib/i18n";
import type { Metadata } from "next";
import Link from "@/components/Idioma";
import { cartelera } from "@/lib/data";
import { hoyES, sumarDias } from "@/lib/format";
import { CiudadesCartelera, DiasCartelera, EventosCartelera } from "@/components/Cartelera";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = idiomaDe((await params).lang);
  const t = traductor(lang);
  return {
  title: t("Cartelera de teatro esta semana"),
  description: t("Qué ver esta semana: obras de teatro, danza, circo e impro en cartel, ciudad a ciudad, con horarios, salas y entradas."),
  alternates: alternos(lang, "/cartelera"),
};
}

export default async function CarteleraPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang, t } = await idiomaDePagina(params);
  const hoy = hoyES();
  const { funciones, ciudades } = await cartelera(hoy);
  const finSemana = sumarDias(hoy, 6);
  const semana = funciones.filter((f) => f.fecha <= finSemana);
  const despues = funciones.filter((f) => f.fecha > finSemana);

  return (
    <main className="wrap section">
      <EventosCartelera funciones={semana} />
      <p className="eyebrow" style={{ marginBottom: 12 }}>{t("Cartelera")}</p>
      <h1 className="h1" style={{ marginBottom: 12 }}>{t("Esta semana en el teatro")}</h1>
      <p className="lead soft" style={{ maxWidth: 680, marginTop: 0 }}>{t("Las funciones que compañías y salas anuncian en Ziater, con hora, sala y enlace a las entradas.") + (ciudades.length ? " " + t("Elige tu ciudad:") : "")}</p>
      <div style={{ margin: "20px 0 36px" }}><CiudadesCartelera ciudades={ciudades} /></div>

      {semana.length ? <DiasCartelera funciones={semana} hoy={hoy} conCiudad /> : (
        <p className="soft">{funciones.length ? t("No hay funciones anunciadas para los próximos siete días.") : t("Todavía no hay funciones anunciadas. En cuanto una compañía o una sala añada fechas, aparecerán aquí.")}</p>
      )}

      {despues.length ? (
        <section style={{ marginTop: 48 }}>
          <h2 className="h2" style={{ marginBottom: 16 }}>{t("Más adelante")}</h2>
          <DiasCartelera funciones={despues.slice(0, 60)} hoy={hoy} conCiudad />
        </section>
      ) : null}

      <div className="panel panel-foco" style={{ marginTop: 48, maxWidth: 680 }}>
        <h2 className="eyebrow">{t("¿Tu obra no aparece?")}</h2>
        <p className="soft" style={{ marginTop: 0 }}>{t("Añade las funciones en la ficha de tu obra (fecha, sala, ciudad y enlace de entradas) y saldrá aquí al momento.")}</p>
        <Link href="/panel" className="btn btn-primary">{t("Ir a Mi espacio")}</Link>
      </div>
    </main>
  );
}
