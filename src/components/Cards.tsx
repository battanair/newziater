import Link from "next/link";
import Image from "next/image";
import type { Obra, Persona, Productora } from "@/lib/types";
import { cld, colorCartel, iniciales, nombreCompleto, obraActiva, periodo } from "@/lib/format";

export function Poster({ obra, sizes = "200px", priority = false }: { obra: Pick<Obra, "id" | "titulo" | "cartel">; sizes?: string; priority?: boolean }) {
  return (
    <span className="poster" style={{ background: colorCartel(obra.id) }}>
      {obra.cartel ? (
        <Image src={cld(obra.cartel, "c_fill,g_auto,w_600,h_900,f_auto,q_auto")!} alt={`Cartel de ${obra.titulo}`} fill sizes={sizes} priority={priority} />
      ) : (
        <span className="poster-title">{obra.titulo}</span>
      )}
    </span>
  );
}

export function ObraCard({ obra }: { obra: Obra }) {
  const cat = obra.categoria?.filter(Boolean)[0];
  return (
    <Link href={`/obra/${obra.id}`} className="card" style={{ display: "block" }}>
      <Poster obra={obra} />
      <span className="card-title">{obra.titulo}</span>
      <span className="card-sub">{[cat, periodo(obra.anoinicio, obra.anofin)].filter(Boolean).join(" · ")}</span>
      {obraActiva(obra) ? <span className="card-sub" style={{ color: "var(--foco)" }}>En activo</span> : null}
    </Link>
  );
}

export function Avatar({ persona, size }: { persona: Pick<Persona, "id" | "Nombre" | "Apellidos" | "foto">; size?: number }) {
  const nombre = nombreCompleto(persona);
  return (
    <span className="avatar" style={{ background: colorCartel(persona.id), width: size, height: size, fontSize: size ? size / 2.6 : undefined }}>
      {persona.foto ? (
        <Image src={cld(persona.foto, "c_fill,g_face,w_400,h_400,f_auto,q_auto")!} alt={`Foto de ${nombre}`} fill sizes={size ? `${size}px` : "180px"} />
      ) : (
        <span aria-hidden="true">{iniciales(nombre)}</span>
      )}
    </span>
  );
}

export function PersonaCard({ persona, sub }: { persona: Persona; sub?: string }) {
  return (
    <Link href={`/persona/${persona.id}`} className="card" style={{ display: "block", textAlign: "center" }}>
      <Avatar persona={persona} />
      <span className="card-title">{nombreCompleto(persona)}</span>
      {sub || persona.roles?.length ? <span className="card-sub">{sub ?? persona.roles!.slice(0, 2).join(" · ")}</span> : null}
    </Link>
  );
}

export function ProductoraCard({ p }: { p: Productora }) {
  return (
    <Link href={`/compania/${p.id}`} className="card" style={{ display: "block", textAlign: "center" }}>
      <span className="avatar" style={{ background: colorCartel(p.id), borderRadius: 16 }}>
        {p.foto_prod ? (
          <Image src={cld(p.foto_prod, "c_pad,w_400,h_400,b_rgb:1c1915,f_auto,q_auto")!} alt={`Logo de ${p.nombre_prod}`} fill sizes="180px" />
        ) : (
          <span aria-hidden="true">{iniciales(p.nombre_prod)}</span>
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
