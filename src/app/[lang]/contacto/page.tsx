import { idiomaDePagina } from "@/lib/idioma-servidor";
import { alternos, idiomaDe, traductor } from "@/lib/i18n";
import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = idiomaDe((await params).lang);
  const t = traductor(lang);
  return { title: t("Contacto"), description: t("¿Tienes alguna pregunta o sugerencia sobre Ziater? Escríbenos."), alternates: alternos(lang, "/contacto") };
}

export default async function ContactoPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ motivo?: string }> }) {
  const { t } = await idiomaDePagina(params);
  const { motivo } = await searchParams;
  return (
    <main className="wrap section" style={{ maxWidth: 720 }}>
      <h1 className="h1" style={{ marginBottom: 12 }}>{t("Contacto")}</h1>
      <p className="soft" style={{ marginBottom: 32 }}>{t("¿Tienes alguna pregunta o sugerencia? Te respondemos lo antes posible.")}</p>
      <ContactForm tipoInicial={motivo === "borrado" || motivo === "ficha" ? motivo : "consulta"} />
    </main>
  );
}
