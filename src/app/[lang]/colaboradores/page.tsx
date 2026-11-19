import { idiomaDePagina } from "@/lib/idioma-servidor";
import { alternos, idiomaDe, traductor } from "@/lib/i18n";
import type { Metadata } from "next";
import Link from "@/components/Idioma";
import { rankingColaboradores } from "@/lib/data";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = idiomaDe((await params).lang);
  const t = traductor(lang);
  return {
  title: t("Colaboradores"),
  description: t("Las personas que construyen Ziater: quienes más obras, fichas y créditos han aportado a la base de datos de las artes escénicas."),
  alternates: alternos(lang, "/colaboradores"),
};
}

export default async function ColaboradoresPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang, t } = await idiomaDePagina(params);
  const lista = await rankingColaboradores();
  return (
    <main className="wrap section" style={{ maxWidth: 900 }}>
      <p className="eyebrow" style={{ marginBottom: 12 }}>{t("Gracias")}</p>
      <h1 className="h1">{t("Quienes construyen Ziater")}</h1>
      <p className="lead" style={{ margin: "16px 0 32px" }}>{t("Ziater existe porque mucha gente se toma el tiempo de crear fichas, enlazar elencos y corregir datos. Estas son las personas que más han aportado.")}</p>

      {lista.length ? (
        <ol className="list" style={{ counterReset: "puesto" }}>
          {lista.map((a, i) => (
            <li key={a.uid} style={{ display: "grid", gridTemplateColumns: "44px minmax(0, 1fr) auto", gap: 16, alignItems: "center", padding: "16px 0" }}>
              <span className="serif" style={{ fontSize: 26, fontWeight: 600, color: i < 3 ? "var(--foco)" : "var(--texto-3)", textAlign: "center" }}>{i + 1}</span>
              <span style={{ minWidth: 0 }}>
                {a.persona_id ? <Link href={`/persona/${a.persona_id}`} style={{ fontWeight: 600, fontSize: 18 }}>{a.nombre}</Link> : <strong style={{ fontSize: 18 }}>{a.nombre}</strong>}
                <span className="hint" style={{ display: "block" }}>
                  {[a.obras && (a.obras === 1 ? t("1 obra") : t("{n} obras", { n: a.obras })), a.fichas && (a.fichas === 1 ? t("1 ficha") : t("{n} fichas", { n: a.fichas })), a.creditos && (a.creditos === 1 ? t("1 crédito") : t("{n} créditos", { n: a.creditos }))].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="chip chip-foco" title={t("Una obra cuenta 3 puntos; una ficha o un crédito, 1")}>{t("{total} pts", { total: a.total })}</span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="panel" style={{ textAlign: "center" }}>
          <p className="soft" style={{ marginTop: 0 }}>{t("Todavía nadie ha activado su perfil de colaborador.")}</p>
        </div>
      )}

      <div className="panel" style={{ marginTop: 40 }}>
        <h2 className="eyebrow">{t("¿Quieres aparecer?")}</h2>
        <p className="soft" style={{ margin: "0 0 14px" }}>{t("Solo salen quienes lo activan. Hazlo desde «Tus aportaciones»: tu nombre aparecerá aquí y en tu ficha de artista, si tienes.")}</p>
        <Link href="/panel/aportaciones" className="btn btn-primary">{t("Ir a Tus aportaciones")}</Link>
      </div>
    </main>
  );
}
