"use client";

import { useRef, useState } from "react";
import { authFetch } from "./AuthProvider";
import { MAX_FOTOS_OBRA, PROPORCION, T_CARTEL, T_RETRATO, cld } from "@/lib/format";

export const MAX_MB = 4; // tamaño máximo de lo que se sube (ya comprimido)
const MAX_MB_ORIGINAL = 25; // la foto tal como sale del móvil o la cámara
const MIN_ALTO = 900; // por debajo se ve borrosa en pantallas grandes
const MAX_LADO = 2000; // px del lado mayor tras comprimir: de sobra para verse nítida en pantallas grandes
const CALIDAD = 0.82;

/**
 * Comprime la foto en el navegador antes de subirla: la reduce a 2000 px de lado
 * como mucho y la guarda en WebP (o JPEG si el navegador no sabe hacer WebP).
 * Una foto de móvil de 5–10 MB suele quedar en 300–700 KB sin diferencia visible.
 * Si algo falla o no mejora, se sube la original.
 */
async function comprimir(file: File, tipo: string): Promise<File> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) return file;
  let bmp: ImageBitmap;
  try { bmp = await createImageBitmap(file); } catch { return file; } // p. ej. HEIC fuera de Safari: lo convierte Cloudinary
  const k = Math.min(1, MAX_LADO / Math.max(bmp.width, bmp.height));
  if (k === 1 && file.size < 400 * 1024) { bmp.close(); return file; } // ya es ligera
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const aBlob = (type: string) => new Promise<Blob | null>((ok) => canvas.toBlob(ok, type, CALIDAD));
  let blob = await aBlob("image/webp");
  if (!blob || blob.type !== "image/webp") {
    if (tipo === "logo") return file; // JPEG perdería la transparencia del logo
    blob = await aBlob("image/jpeg");
  }
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + (blob.type === "image/webp" ? ".webp" : ".jpg"), { type: blob.type });
}

export async function subirImagen(original: File, tipo: "cartel" | "foto" | "galeria" | "logo"): Promise<string> {
  if (!original.type.startsWith("image/")) throw new Error("El archivo tiene que ser una imagen");
  if (original.size > MAX_MB_ORIGINAL * 1024 * 1024) throw new Error(`«${original.name}» pesa ${(original.size / 1048576).toFixed(1)} MB. El máximo son ${MAX_MB_ORIGINAL} MB.`);
  const file = await comprimir(original, tipo);
  if (file.size > MAX_MB * 1024 * 1024) throw new Error(`«${original.name}» sigue pesando ${(file.size / 1048576).toFixed(1)} MB después de comprimirla. Prueba con otra versión de la foto.`);
  const firma = await authFetch("/api/cloudinary-firma", { tipo });
  const form = new FormData();
  form.append("file", file);
  for (const k of ["api_key", "timestamp", "signature", "folder", "allowed_formats", "transformation"]) if (firma[k]) form.append(k, firma[k]);
  const res = await fetch(firma.url, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok || !data.secure_url) throw new Error(data.error?.message ?? "No se pudo subir la imagen");
  return data.secure_url as string;
}

/** Lee el tamaño real de la imagen antes de subirla. */
function medir(file: File): Promise<{ w: number; h: number } | null> {
  return new Promise((ok) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { ok({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { ok(null); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

/** Explica cómo se recortará una imagen que no es 2:3. */
function avisoProporcion(w: number, h: number): string {
  const r = w / h, ideal = PROPORCION.ancho / PROPORCION.alto;
  const avisos: string[] = [];
  if (Math.abs(r - ideal) > 0.06) {
    const forma = r > 1.05 ? "horizontal" : r > 0.95 ? "cuadrada" : r > ideal ? "un poco ancha" : "más alargada de lo normal";
    avisos.push(`Tu imagen es ${forma} (${w} × ${h} px), así que se recortará ${r > ideal ? "por los lados" : "por arriba y por abajo"}. Mira la vista previa: así se verá.`);
  }
  if (h < MIN_ALTO) avisos.push(`Tiene poca resolución (${h} px de alto) y puede verse borrosa. Mejor a partir de ${PROPORCION.px}.`);
  return avisos.join(" ");
}

export function ImageUpload({ value, onChange, tipo, label, shape = "poster" }: {
  value?: string;
  onChange: (url: string) => void;
  tipo: "cartel" | "foto" | "galeria" | "logo";
  label: string;
  shape?: "poster" | "portrait";
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const transform = shape === "portrait" ? T_RETRATO : T_CARTEL;

  async function handle(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    const dim = await medir(file);
    setAviso(dim ? avisoProporcion(dim.w, dim.h) : "");
    try {
      onChange(await subirImagen(file, tipo));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ width: 170 }}>
      <button
        type="button"
        className="dropzone"
        style={{ aspectRatio: "2/3", padding: 12, overflow: "hidden", position: "relative", textAlign: "center", background: value ? `center/cover no-repeat url(${JSON.stringify(cld(value, transform) ?? value)})` : undefined }}
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handle(e.dataTransfer.files[0]); }}
        aria-label={value ? `Cambiar ${label.toLowerCase()}` : `Subir ${label.toLowerCase()}`}
        aria-describedby={`${tipo}-formato`}
      >
        {!value ? (
          <>
            <span style={{ fontSize: 28 }} aria-hidden="true">+</span>
            <span style={{ fontWeight: 600, color: "var(--papel)" }}>{busy ? "Subiendo…" : label}</span>
            <span style={{ fontSize: 13 }}>Vertical 2:3</span>
          </>
        ) : busy ? <span className="chip" style={{ background: "var(--sala)" }}>Subiendo…</span> : null}
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic" hidden onChange={(e) => handle(e.target.files?.[0])} />
      <p id={`${tipo}-formato`} className="hint" style={{ margin: "8px 0 0" }}>
        Formato <strong style={{ color: "var(--texto-2)" }}>{PROPORCION.texto}</strong>, recomendado {PROPORCION.px}. JPG, PNG o WebP; se comprime sola al subirla. Si tiene otra forma, se recortará.
      </p>
      {aviso ? <p className="hint" role="status" style={{ margin: "8px 0 0", color: "var(--foco)" }}>{aviso}</p> : null}
      {error ? <p className="error" role="alert" style={{ margin: "8px 0 0" }}>{error}</p> : null}
    </div>
  );
}

/** Galería de fotos de una obra: varias a la vez, con miniaturas y botón para quitar. */
export const MAX_FOTOS = MAX_FOTOS_OBRA;
export function GaleriaUpload({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(0);
  const [error, setError] = useState("");

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const hueco = MAX_FOTOS - value.length;
    const lista = [...files].slice(0, Math.max(0, hueco));
    if (files.length > hueco) setError(`Caben ${MAX_FOTOS} fotos como máximo; se han añadido ${lista.length}.`);
    let urls = [...value];
    setSubiendo(lista.length);
    for (const file of lista) {
      try {
        urls = [...urls, await subirImagen(file, "galeria")];
        onChange(urls);
      } catch (e) {
        setError((e as Error).message);
      }
      setSubiendo((n) => n - 1);
    }
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
        {value.map((url, i) => (
          <div key={url} style={{ position: "relative", aspectRatio: "4/3", borderRadius: 8, overflow: "hidden", background: "var(--capa)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cld(url, "c_fill,g_auto,w_300,h_225,f_auto,q_auto") ?? url} alt={`Foto ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button type="button" className="btn" aria-label={`Quitar foto ${i + 1}`} onClick={() => onChange(value.filter((u) => u !== url))}
              style={{ position: "absolute", top: 6, right: 6, minHeight: 30, width: 30, padding: 0, borderRadius: 999, background: "rgba(0,0,0,.65)", color: "#fff" }}>×</button>
          </div>
        ))}
        {value.length < MAX_FOTOS ? (
          <button type="button" className="dropzone" style={{ aspectRatio: "4/3", minHeight: 0 }} onClick={() => input.current?.click()}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handle(e.dataTransfer.files); }}>
            <span style={{ fontSize: 24 }} aria-hidden="true">+</span>
            <span style={{ fontSize: 13 }}>{subiendo ? `Subiendo ${subiendo}…` : "Añadir fotos"}</span>
          </button>
        ) : null}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple hidden onChange={(e) => handle(e.target.files)} />
      <p className="hint" style={{ margin: "8px 0 0" }}>
        Fotos de la función o de ensayos. Mejor en horizontal (4:3, a partir de 1600 × 1200 px). JPG, PNG o WebP; se comprimen solas al subirlas. Máximo {MAX_FOTOS}.
      </p>
      {error ? <p className="error" role="alert" style={{ margin: "8px 0 0" }}>{error}</p> : null}
    </div>
  );
}
