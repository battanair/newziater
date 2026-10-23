import { ImageResponse } from "next/og";

// Imagen que aparece al compartir ziater.com (y fichas sin cartel ni foto)
// en WhatsApp, redes sociales o buscadores. Se genera una vez al publicar.
export const alt = "Ziater — La base de datos de las artes escénicas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TITULO = "Lo que ocurre en un escenario no se queda en él.";
const PIE = "La base de datos de las artes escénicas · ziater.com";

/** Descarga solo los caracteres necesarios de una fuente de Google (en TTF, que es lo que admite ImageResponse). */
async function fuente(familia: string, peso: number, texto: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${familia}:wght@${peso}&text=${encodeURIComponent(texto)}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function Imagen() {
  const [serif, sans] = await Promise.all([fuente("Fraunces", 600, "ZIATER" + TITULO), fuente("Source+Sans+3", 600, PIE)]);
  const fonts = [
    ...(serif ? [{ name: "Fraunces", data: serif, weight: 600 as const, style: "normal" as const }] : []),
    ...(sans ? [{ name: "Source Sans 3", data: sans, weight: 600 as const, style: "normal" as const }] : []),
  ];
  const [antes, despues] = TITULO.split("no se queda");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#131210", padding: "72px 80px", fontFamily: "Fraunces" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, color: "#f3ede2", fontSize: 44, letterSpacing: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: 999, background: "#c9a063" }} />
          ZIATER
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", color: "#f3ede2", fontSize: 84, lineHeight: 1.08, maxWidth: 1000 }}>
          <span>{antes.trim()}&nbsp;</span>
          <span style={{ color: "#c9a063" }}>no se queda{despues}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#d3c8b6", fontSize: 30, fontFamily: "Source Sans 3" }}>
          <span>{PIE}</span>
          <div style={{ width: 120, height: 4, background: "#c9a063", borderRadius: 4 }} />
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
