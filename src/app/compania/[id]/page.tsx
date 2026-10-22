import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductora, obrasDeProductora } from "@/lib/data";
import { JsonLd, ObraCard } from "@/components/Cards";
import { ShareButton } from "@/components/ObraActions";
import { T_LOGO, T_OG, cld, colorCartel, iniciales, instagramUrl, recortar } from "@/lib/format";
import { SITE_URL } from "@/lib/firebase-config";

export const revalidate = 3600;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getProductora(id);
  if (!p) return { title: "Compañía no encontrada", robots: { index: false } };
  const description = recortar(p.descripcion, 158) || `${p.nombre_prod}: compañía de artes escénicas en Ziater.`;
  const image = cld(p.foto_prod, T_OG);
  return {
    title: p.nombre_prod,
    description,
    alternates: { canonical: `/compania/${p.id}` },
    openGraph: { title: p.nombre_prod, description, url: `/compania/${p.id}`, images: image ? [{ url: image, width: 1200, height: 630 }] : undefined },
  };
}

export default async function CompaniaPage({ params }: Props) {
  const { id } = await params;
  const p = await getProductora(id);
  if (!p) notFound();
  const obras = await obrasDeProductora(p.id);
  const ig = instagramUrl(p.instagram);
  const url = `${SITE_URL}/compania/${p.id}`;

  return (
    <main>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "PerformingGroup", "@id": url, url, name: p.nombre_prod, description: p.descripcion, logo: p.foto_prod, sameAs: ig ? [ig] : undefined }} />
      <section className="hero-ficha">
        <div className="wrap hero-ficha-in">
          <div className="hero-media" style={{ maxWidth: 240 }}>
            <div style={{ position: "relative", aspectRatio: "1", borderRadius: 16, overflow: "hidden", background: colorCartel(p.id), display: "flex", alignItems: "center", justifyContent: "center" }}>
              {cld(p.foto_prod, T_LOGO) ? <Image src={cld(p.foto_prod, T_LOGO)!} alt={`Logo de ${p.nombre_prod}`} fill sizes="240px" priority /> : <span className="serif" style={{ fontSize: 72 }}>{iniciales(p.nombre_prod)}</span>}
            </div>
          </div>
          <div className="hero-text">
            <p className="eyebrow" style={{ marginBottom: 12 }}>Compañía</p>
            <h1 className="h1">{p.nombre_prod}</h1>
            {p.descripcion ? <p className="lead" style={{ maxWidth: 700, whiteSpace: "pre-line" }}>{p.descripcion}</p> : null}
            <div className="actions">
              {ig ? <a href={ig} className="btn" target="_blank" rel="noopener noreferrer nofollow">Instagram</a> : null}
              <ShareButton />
            </div>
          </div>
        </div>
      </section>
      {obras.length ? (
        <section className="wrap section">
          <h2 className="h2" style={{ marginBottom: 20 }}>Repertorio</h2>
          <div className="grid-posters">{obras.map((o) => <ObraCard key={o.id} obra={o} />)}</div>
        </section>
      ) : null}
    </main>
  );
}
