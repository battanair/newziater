import { idiomaDePagina } from "@/lib/idioma-servidor";
import { alternos, idiomaDe, traductor } from "@/lib/i18n";
import type { Metadata } from "next";
import { paginaProductoras } from "@/lib/data";
import { ProductoraCard } from "@/components/Cards";
import { Paginacion } from "@/components/Paginacion";

export const revalidate = 600;

type SP = Promise<{ despues?: string }>;

export async function generateMetadata({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: SP }): Promise<Metadata> {
  const lang = idiomaDe((await params).lang);
  const t = traductor(lang);
  const { despues } = await searchParams;
  return {
    title: t("Compañías y productoras de artes escénicas"),
    description: t("Compañías de teatro, danza e improvisación y productoras escénicas, con su repertorio."),
    alternates: alternos(lang, "/companias"),
    robots: despues ? { index: false, follow: true } : undefined,
  };
}

export default async function CompaniasPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: SP }) {
  const { lang, t } = await idiomaDePagina(params);
  const { despues } = await searchParams;
  const { items, siguiente } = await paginaProductoras({ despues });
  return (
    <main className="wrap section">
      <h1 className="h1" style={{ marginBottom: 32 }}>{t("Compañías")}</h1>
      <div className="grid-people">{items.map((p) => <ProductoraCard key={p.id} p={p} />)}</div>
      <Paginacion base="/companias" params={{}} siguiente={siguiente} primera={!despues} />
    </main>
  );
}
