import { ImageResponse } from "next/og";
import { equipoDeObra, getObra, validId } from "@/lib/data";
import { idiomaDe, traductor } from "@/lib/i18n";
import { colorCartel, cld, nombreCompleto, partirFunciones, fechaCorta, periodo } from "@/lib/format";
import { ipDe, limitar } from "@/lib/limite";

// Imagen vertical (1080×1920) para compartir una obra en stories de Instagram,
// WhatsApp o TikTok. Solo usa datos públicos de la ficha.
//   /api/story?obra=ID&tipo=recomiendo           → «Te recomiendo»
//   /api/story?obra=ID&tipo=elenco&persona=ID    → «Estoy en el elenco de» (+ personaje)
// Se deja espacio libre arriba y abajo para la interfaz de Instagram.

export const revalidate = 600;

const W = 1080, H = 1920;
const ORO = "#c9a063", PAPEL = "#f3ede2", TEXTO2 = "#d3c8b6", FONDO = "#131210";
const T_STORY = "c_fill,g_auto,w_792,h_1188/f_jpg,q_80";

async function fuente(familia: string, peso: number, texto: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${familia}:wght@${peso}&text=${encodeURIComponent(texto)}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  if (!limitar(`story:${ipDe(req)}`, 30)) return new Response("Demasiadas peticiones", { status: 429 });
  const url = new URL(req.url);
  const id = url.searchParams.get("obra") ?? "";
  const tipo = url.searchParams.get("tipo") === "elenco" ? "elenco" : "recomiendo";
  const personaId = url.searchParams.get("persona") ?? "";
  const lang = idiomaDe(url.searchParams.get("lang"));
  const tr = traductor(lang);
  if (!validId(id)) return new Response("Obra no válida", { status: 400 });
  const obra = await getObra(id);
  if (!obra) return new Response("Obra no encontrada", { status: 404 });

  // «Estoy en el elenco» solo si esa persona figura de verdad en la ficha
  let persona = "", papel = "";
  if (tipo === "elenco" && validId(personaId)) {
    const c = (await equipoDeObra(id)).find((x) => x.persona.id === personaId);
    if (c) {
      persona = nombreCompleto(c.persona);
      const t = c.titulo?.trim();
      papel = t && t !== c.puesto ? (c.puesto === "Interpretación" || /actor|actriz|int[eé]rprete/i.test(c.puesto ?? "") ? tr("como {papel}", { papel: t }) : t) : tr(c.puesto ?? "");
      if (c.cover) papel = papel ? `${papel} (cover)` : "Cover";
    }
  }
  const esElenco = tipo === "elenco" && Boolean(persona);
  const cabecera = esElenco ? tr("Estoy en el elenco de") : tr("Te recomiendo");

  const prox = partirFunciones(obra.funciones ?? []).proximas[0];
  const cuando = prox ? `${fechaCorta(prox.fecha, lang)}${prox.hora ? ` · ${prox.hora} h` : ""}` : "";
  const donde = prox ? [prox.sala, prox.ciudad].filter(Boolean).join(", ") : "";
  const linea = prox ? (esElenco ? tr("Próxima función") : tr("Puedes verla")) : periodo(obra.anoinicio, obra.anofin, lang);
  // Solo carteles de Cloudinary (se piden en JPG; otros formatos como WebP no los admite el generador)
  const cartel = obra.cartel?.includes("res.cloudinary.com") ? cld(obra.cartel, T_STORY) : undefined;

  const textoSerif = "ZIATER" + cabecera + obra.titulo + persona;
  const textoSans = linea.toUpperCase() + linea + cuando + donde + papel + persona + " " + tr("Ficha completa en ziater.com") + "·–() " + periodo(obra.anoinicio, obra.anofin, lang);
  const [serif, sans, sansB] = await Promise.all([fuente("Fraunces", 600, textoSerif), fuente("Source+Sans+3", 400, textoSans), fuente("Source+Sans+3", 600, textoSans)]);
  const fonts = [
    ...(serif ? [{ name: "Fraunces", data: serif, weight: 600 as const, style: "normal" as const }] : []),
    ...(sans ? [{ name: "Sans", data: sans, weight: 400 as const, style: "normal" as const }] : []),
    ...(sansB ? [{ name: "Sans", data: sansB, weight: 600 as const, style: "normal" as const }] : []),
  ];
  // El cartel se adapta para que todo quepa entre las zonas que tapa Instagram
  const PW = esElenco ? 500 : prox ? 580 : 640, PH = Math.round(PW * 1.5);
  const tituloGrande = obra.titulo.length > 28 ? 72 : obra.titulo.length > 16 ? 88 : 104;

  const img = new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: FONDO, padding: "160px 90px 220px", fontFamily: "Sans", color: PAPEL }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: "Fraunces", fontSize: 40, letterSpacing: 6, color: PAPEL }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: ORO }} />
          ZIATER
        </div>
        <div style={{ display: "flex", marginTop: 48, fontFamily: "Fraunces", fontSize: 54, color: ORO }}>{cabecera}</div>
        <div style={{ display: "flex", marginTop: 36, width: PW, height: PH, borderRadius: 26, overflow: "hidden", background: colorCartel(obra.id), boxShadow: "0 30px 80px rgba(0,0,0,.55)", alignItems: "flex-end", justifyContent: "flex-start" }}>
          {cartel ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cartel} width={PW} height={PH} style={{ width: PW, height: PH, objectFit: "cover" }} alt="" />
          ) : (
            <div style={{ display: "flex", padding: 48, fontFamily: "Fraunces", fontSize: 72, lineHeight: 1.05, color: PAPEL }}>{obra.titulo}</div>
          )}
        </div>
        <div style={{ display: "flex", marginTop: 52, fontFamily: "Fraunces", fontSize: tituloGrande, lineHeight: 1.05, textAlign: "center", justifyContent: "center", maxWidth: 900 }}>{obra.titulo}</div>
        {esElenco ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 24 }}>
            <div style={{ display: "flex", fontSize: 44, fontWeight: 600 }}>{persona}</div>
            {papel ? <div style={{ display: "flex", fontSize: 38, color: TEXTO2, marginTop: 6 }}>{papel}</div> : null}
          </div>
        ) : null}
        {linea ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40, padding: "24px 44px", borderRadius: 20, border: `2px solid ${ORO}` }}>
            <div style={{ display: "flex", fontSize: 30, color: ORO, fontWeight: 600, letterSpacing: 2 }}>{linea.toUpperCase()}</div>
            {cuando ? <div style={{ display: "flex", fontSize: 40, fontWeight: 600, marginTop: 8 }}>{cuando}</div> : null}
            {donde ? <div style={{ display: "flex", fontSize: 36, color: TEXTO2, marginTop: 4 }}>{donde}</div> : null}
          </div>
        ) : null}
        <div style={{ display: "flex", marginTop: 44, fontSize: 34, color: TEXTO2 }}>{tr("Ficha completa en ziater.com")}</div>
      </div>
    ),
    { width: W, height: H, fonts: fonts.length ? fonts : undefined },
  );
  img.headers.set("cache-control", "public, max-age=600, s-maxage=600");
  return img;
}
