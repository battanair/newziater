import type { Metadata } from "next";
import Link from "next/link";
import { cartelera } from "@/lib/data";
import { hoyES, sumarDias } from "@/lib/format";
import { CiudadesCartelera, DiasCartelera, EventosCartelera } from "@/components/Cartelera";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Cartelera de teatro esta semana",
  description: "Qué ver esta semana: obras de teatro, danza, circo e impro en cartel, ciudad a ciudad, con horarios, salas y entradas.",
  alternates: { canonical: "/cartelera" },
};

export default async function CarteleraPage() {
  const hoy = hoyES();
  const { funciones, ciudades } = await cartelera(hoy);
  const finSemana = sumarDias(hoy, 6);
  const semana = funciones.filter((f) => f.fecha <= finSemana);
  const despues = funciones.filter((f) => f.fecha > finSemana);

  return (
    <main className="wrap section">
      <EventosCartelera funciones={semana} />
      <p className="eyebrow" style={{ marginBottom: 12 }}>Cartelera</p>
      <h1 className="h1" style={{ marginBottom: 12 }}>Esta semana en el teatro</h1>
      <p className="lead soft" style={{ maxWidth: 680, marginTop: 0 }}>Las funciones que compañías y salas anuncian en Ziater, con hora, sala y enlace a las entradas.{ciudades.length ? " Elige tu ciudad:" : ""}</p>
      <div style={{ margin: "20px 0 36px" }}><CiudadesCartelera ciudades={ciudades} /></div>

      {semana.length ? <DiasCartelera funciones={semana} hoy={hoy} conCiudad /> : (
        <p className="soft">{funciones.length ? "No hay funciones anunciadas para los próximos siete días." : "Todavía no hay funciones anunciadas. En cuanto una compañía o una sala añada fechas, aparecerán aquí."}</p>
      )}

      {despues.length ? (
        <section style={{ marginTop: 48 }}>
          <h2 className="h2" style={{ marginBottom: 16 }}>Más adelante</h2>
          <DiasCartelera funciones={despues.slice(0, 60)} hoy={hoy} conCiudad />
        </section>
      ) : null}

      <div className="panel panel-foco" style={{ marginTop: 48, maxWidth: 680 }}>
        <h2 className="eyebrow">¿Tu obra no aparece?</h2>
        <p className="soft" style={{ marginTop: 0 }}>Añade las funciones en la ficha de tu obra (fecha, sala, ciudad y enlace de entradas) y saldrá aquí al momento.</p>
        <Link href="/panel" className="btn btn-primary">Ir a Mi espacio</Link>
      </div>
    </main>
  );
}
