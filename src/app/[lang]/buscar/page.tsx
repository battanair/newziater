import { idiomaDePagina } from "@/lib/idioma-servidor";
import { alternos, idiomaDe, traductor } from "@/lib/i18n";
import type { Metadata } from "next";
import Link from "@/components/Idioma";
import { buscar } from "@/lib/data";
import { SearchBox } from "@/components/SearchBox";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = idiomaDe((await params).lang);
  const t = traductor(lang);
  return { title: t("Buscar"), robots: { index: false, follow: true } };
}

const LABEL = { obra: "Obra", persona: "Artista", productora: "Compañía", sala: "Sala" } as const;
const href = (t: keyof typeof LABEL, id: string) => (t === "obra" ? `/obra/${id}` : t === "persona" ? `/persona/${id}` : t === "sala" ? `/sala/${id}` : `/compania/${id}`);

export default async function BuscarPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ q?: string }> }) {
  const { lang, t } = await idiomaDePagina(params);
  const { q = "" } = await searchParams;
  const term = q.slice(0, 80).trim();
  const items = term.length >= 2 ? await buscar(term) : [];
  return (
    <main className="wrap section">
      <h1 className="h1" style={{ marginBottom: 24 }}>{t("Buscar")}</h1>
      <div style={{ maxWidth: 640, marginBottom: 32 }}><SearchBox hero autoFocus /></div>
      {term ? <p className="muted">{(items.length === 1 ? t("1 resultado para «{term}»", { term }) : t("{n} resultados para «{term}»", { n: items.length, term }))}</p> : null}
      <ul className="list">
        {items.map((i) => (
          <li key={i.t + i.id}>
            <Link href={href(i.t, i.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0" }}>
              {i.img ? <img src={i.img} alt="" className={`thumb ${i.t !== "obra" ? "thumb-round" : ""}`} loading="lazy" /> : <span className={`thumb ${i.t !== "obra" ? "thumb-round" : ""}`} />}
              <span style={{ flex: 1 }}><strong style={{ display: "block" }}>{i.n}</strong>{i.s ? <span className="hint">{i.s}</span> : null}</span>
              <span className="chip">{t(LABEL[i.t])}</span>
            </Link>
          </li>
        ))}
      </ul>
      {term && !items.length ? (
        <p className="soft">{t("No hay resultados.")}{" "}<Link href="/panel/obra/nueva" style={{ color: "var(--foco)" }}>{t("¿Falta una obra? Créala")}</Link></p>
      ) : null}
    </main>
  );
}
