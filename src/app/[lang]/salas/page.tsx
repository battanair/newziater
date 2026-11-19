import { idiomaDePagina } from "@/lib/idioma-servidor";
import { alternos, idiomaDe, traductor } from "@/lib/i18n";
import type { Metadata } from "next";
import Link from "@/components/Idioma";
import { todasLasSalas } from "@/lib/data";
import { SalaCard } from "@/components/Cards";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = idiomaDe((await params).lang);
  const t = traductor(lang);
  return {
  title: t("Salas y teatros"),
  description: t("Salas de teatro, danza y artes escénicas: qué se ha representado en cada una y qué está en cartel."),
  alternates: alternos(lang, "/salas"),
};
}

export default async function SalasPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang, t } = await idiomaDePagina(params);
  const salas = await todasLasSalas();
  // Agrupadas por ciudad, las ciudades con más salas primero
  const porCiudad = new Map<string, typeof salas>();
  for (const s of salas) {
    const c = s.ciudad?.trim() || t("Otras");
    porCiudad.set(c, [...(porCiudad.get(c) ?? []), s]);
  }
  const ciudades = [...porCiudad.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "es"));

  return (
    <main className="wrap section">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 32 }}>
        <h1 className="h1" style={{ margin: 0 }}>{t("Salas")}</h1>
        <Link href="/panel/sala/nueva" className="btn btn-primary">{t("¿Tienes una sala? Dala de alta")}</Link>
      </div>
      {ciudades.length ? (
        ciudades.map(([ciudad, lista]) => (
          <section key={ciudad} style={{ marginBottom: 48 }}>
            <h2 className="h2" style={{ marginBottom: 16 }}>{ciudad}</h2>
            <div className="grid-posters">{lista.map((s) => <SalaCard key={s.id} sala={s} />)}</div>
          </section>
        ))
      ) : (
        <p className="lead soft">{t("Todavía no hay salas en Ziater. Si programas una sala o un teatro, sé la primera: tendrá su ficha con todo lo que se ha representado en ella y su cartelera.")}</p>
      )}
    </main>
  );
}
