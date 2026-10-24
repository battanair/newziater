import Link from "next/link";
import Image from "next/image";
import type { Obra, Persona, Productora } from "@/lib/types";
import { T_CARTEL, T_LOGO, T_RETRATO, cld, colorCartel, iniciales, nombreCompleto, obraActiva, periodo } from "@/lib/format";

export function Poster({ obra, sizes = "200px", priority = false }: { obra: Pick<Obra, "id" | "titulo" | "cartel">; sizes?: string; priority?: boolean }) {
  const src = cld(obra.cartel, T_CARTEL);
  return (
    <span className="poster" style={{ background: colorCartel(obra.id) }}>
      {src ? (
        <Image src={src} alt={`Cartel de ${obra.titulo}`} fill sizes={sizes} priority={priority} />
      ) : (
        <span className="poster-title">{obra.titulo}</span>
      )}
    </span>
  );
}

export function ObraCard({ obra, etiqueta }: { obra: Obra; etiqueta?: string }) {
  const cat = obra.categoria?.filter(Boolean)[0];
  return (
    <Link href={`/obra/${obra.id}`} className="card" style={{ display: "block" }}>
      <Poster obra={obra} />
      <span className="card-title" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <span>{obra.titulo}</span>
        {obra.votos ? <span style={{ whiteSpace: "nowrap", fontSize: 14 }}><span style={{ color: "var(--foco)" }} aria-hidden="true">★</span> {obra.nota?.toLocaleString("es-ES", { maximumFractionDigits: 1 })}<span className="sr-only"> de 10</span></span> : null}
      </span>
      <span className="card-sub">{[cat, periodo(obra.anoinicio, obra.anofin)].filter(Boolean).join(" · ")}</span>
      {etiqueta ? <span className="card-sub" style={{ color: "var(--foco)", fontWeight: 600 }}>{etiqueta}</span> : obraActiva(obra) ? <span className="card-sub" style={{ color: "var(--foco)" }}>En activo</span> : null}
    </Link>
  );
}

export function Avatar({ persona, size }: { persona: Pick<Persona, "id" | "Nombre" | "Apellidos" | "foto">; size?: number }) {
  const nombre = nombreCompleto(persona);
  // Retrato vertical en el mismo marco 2:3 que los carteles
  const src = cld(persona.foto, T_RETRATO);
  const peq = size !== undefined && size < 60;
  return (
    <span className="avatar" style={{ background: colorCartel(persona.id), width: size, height: size ? size * 1.5 : undefined, flex: size ? "none" : undefined, padding: size ? 0 : undefined, borderRadius: peq ? 4 : undefined }}>
      {src ? (
        <Image src={src} alt={`Foto de ${nombre}`} fill sizes={size ? `${size}px` : "(max-width: 640px) 50vw, 200px"} />
      ) : (
        <span className="avatar-ini" aria-hidden="true" style={size ? { fontSize: Math.max(13, size / 2.8) } : undefined}>{iniciales(nombre)}</span>
      )}
    </span>
  );
}

export function PersonaCard({ persona, sub }: { persona: Persona; sub?: string }) {
  return (
    <Link href={`/persona/${persona.id}`} className="card" style={{ display: "block" }}>
      <Avatar persona={persona} />
      <span className="card-title">{nombreCompleto(persona)}</span>
      {sub || persona.roles?.length ? <span className="card-sub">{sub ?? persona.roles!.slice(0, 2).join(" · ")}</span> : null}
    </Link>
  );
}

export function ProductoraCard({ p }: { p: Productora }) {
  return (
    <Link href={`/compania/${p.id}`} className="card" style={{ display: "block" }}>
      <span className="avatar cuadrado" style={{ background: colorCartel(p.id) }}>
        {cld(p.foto_prod, T_LOGO) ? (
          <Image src={cld(p.foto_prod, T_LOGO)!} alt={`Logo de ${p.nombre_prod}`} fill sizes="180px" />
        ) : (
          <span className="avatar-ini" aria-hidden="true">{iniciales(p.nombre_prod)}</span>
        )}
      </span>
      <span className="card-title">{p.nombre_prod}</span>
    </Link>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  // Se escapa "<" para que ningún texto de usuario pueda cerrar la etiqueta <script>
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
