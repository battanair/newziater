"use client";

import { useRef, useState } from "react";
import { authFetch } from "./AuthProvider";

const MAX_MB = 8;

export async function subirImagen(file: File, tipo: "cartel" | "foto" | "galeria" | "logo"): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("El archivo tiene que ser una imagen");
  if (file.size > MAX_MB * 1024 * 1024) throw new Error(`La imagen no puede pesar más de ${MAX_MB} MB`);
  const firma = await authFetch("/api/cloudinary-firma", { tipo });
  const form = new FormData();
  form.append("file", file);
  for (const k of ["api_key", "timestamp", "signature", "folder", "allowed_formats"]) form.append(k, firma[k]);
  const res = await fetch(firma.url, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok || !data.secure_url) throw new Error(data.error?.message ?? "No se pudo subir la imagen");
  return data.secure_url as string;
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

  async function handle(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await subirImagen(file, tipo));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ width: shape === "poster" ? 160 : 150 }}>
      <button
        type="button"
        className="dropzone"
        style={{ aspectRatio: shape === "poster" ? "2/3" : "4/5", padding: 0, overflow: "hidden", position: "relative", background: value ? `center/cover no-repeat url(${JSON.stringify(value)})` : undefined }}
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handle(e.dataTransfer.files[0]); }}
        aria-label={value ? `Cambiar ${label.toLowerCase()}` : `Subir ${label.toLowerCase()}`}
      >
        {!value ? <><span style={{ fontSize: 28 }} aria-hidden="true">+</span><span>{busy ? "Subiendo…" : label}</span></> : busy ? <span className="chip" style={{ background: "var(--sala)" }}>Subiendo…</span> : null}
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic" hidden onChange={(e) => handle(e.target.files?.[0])} />
      {error ? <p className="error" role="alert">{error}</p> : <p className="hint" style={{ marginTop: 6 }}>Arrastra o pulsa · máx. {MAX_MB} MB</p>}
    </div>
  );
}
