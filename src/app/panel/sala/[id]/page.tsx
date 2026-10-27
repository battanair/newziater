"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase-client";
import { RequireAuth } from "@/components/RequireAuth";
import { ImageUpload } from "@/components/ImageUpload";
import { authFetch } from "@/components/AuthProvider";
import { useBusqueda } from "@/components/SearchBox";
import { useEsAdmin } from "@/components/EsAdmin";
import { clavesDe, normalizar } from "@/lib/claves";
import { leer } from "@/lib/client-data";
import type { Sala } from "@/lib/types";

export default function SalaEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RequireAuth>{(user) => <Editor id={id} user={user} />}</RequireAuth>;
}

const VACIA = { nombre: "", ciudad: "", direccion: "", web: "", instagram: "", aforo: "", descripcion: "", foto: "" };

function Editor({ id, user }: { id: string; user: User }) {
  const router = useRouter();
  const nueva = id === "nueva";
  const esAdmin = useEsAdmin();
  const [sala, setSala] = useState<Sala | null>(null);
  const [cargando, setCargando] = useState(!nueva);
  const [f, setF] = useState(VACIA);
  const [estado, setEstado] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState("");
  const { items: parecidas } = useBusqueda(nueva ? f.nombre : "", ["sala"]);

  useEffect(() => {
    if (nueva) return;
    leer<Sala>("salas", id).then((s) => {
      setSala(s);
      if (s) setF({ nombre: s.nombre ?? "", ciudad: s.ciudad ?? "", direccion: s.direccion ?? "", web: s.web ?? "", instagram: s.instagram ?? "", aforo: s.aforo ? String(s.aforo) : "", descripcion: s.descripcion ?? "", foto: s.foto ?? "" });
    }).catch(() => setSala(null)).finally(() => setCargando(false));
  }, [id, nueva]);

  if (cargando) return <main className="wrap section"><p className="muted">Cargando…</p></main>;
  if (!nueva && !sala) return <main className="wrap section"><p>Esta sala no existe.</p></main>;
  if (!nueva && sala!.creacion !== user.uid && !esAdmin) {
    return (
      <main className="wrap section" style={{ maxWidth: 640 }}>
        <h1 className="h2">{sala!.nombre}</h1>
        <p className="soft">Esta ficha la gestiona quien la dio de alta. Si es tu sala y quieres gestionarla, escríbenos desde <Link href="/contacto" style={{ color: "var(--foco)" }}>contacto</Link> o sugiere un cambio desde su ficha.</p>
        <Link href={`/sala/${sala!.id}`} className="btn">Ver la sala</Link>
      </main>
    );
  }

  const set = (k: keyof typeof VACIA, v: string) => setF((x) => ({ ...x, [k]: v }));
  const repetida = nueva ? parecidas.find((p) => normalizar(p.n) === normalizar(f.nombre)) : undefined;

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!f.nombre.trim() || !f.ciudad.trim()) return setError("La sala necesita nombre y ciudad.");
    setEstado("saving");
    setError("");
    const aforo = Math.max(0, Math.min(100000, Math.round(Number(f.aforo) || 0)));
    const datos = {
      nombre: f.nombre.trim().slice(0, 150),
      ciudad: f.ciudad.trim().slice(0, 80),
      direccion: f.direccion.trim().slice(0, 200),
      web: f.web.trim().slice(0, 300),
      instagram: f.instagram.trim().replace(/^@/, "").slice(0, 100),
      descripcion: f.descripcion.trim().slice(0, 3000),
      foto: f.foto,
      aforo,
      claves: clavesDe(f.nombre, f.ciudad),
    };
    try {
      let salaId = id;
      if (nueva) salaId = (await addDoc(collection(db, "salas"), { ...datos, creacion: user.uid, creado: serverTimestamp() })).id;
      else await updateDoc(doc(db, "salas", id), datos);
      await authFetch("/api/revalidar", { salas: [salaId] }).catch(() => {});
      router.push(`/sala/${salaId}`);
    } catch {
      setEstado("error");
      setError("No se pudo guardar. Revisa los datos e inténtalo de nuevo.");
    }
  }

  return (
    <main className="wrap section" style={{ maxWidth: 860 }}>
      <h1 className="h1" style={{ fontSize: 44 }}>{nueva ? "Da de alta tu sala" : "Editar sala"}</h1>
      {nueva ? (
        <p className="lead soft" style={{ maxWidth: 680 }}>
          Tu sala tendrá su ficha en Ziater con su cartelera y todas las obras que han pasado por ella. Las compañías podrán enlazarla al anunciar sus funciones, y la gente la encontrará en Google.
        </p>
      ) : null}
      <form onSubmit={guardar} className="stack" style={{ gap: 20, marginTop: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
          <ImageUpload value={f.foto} onChange={(u) => set("foto", u)} tipo="foto" label="Subir foto de la sala" />
          <div className="stack" style={{ flex: "1 1 320px", gap: 16 }}>
            <div className="field">
              <label className="label" htmlFor="nombre">Nombre de la sala *</label>
              <input id="nombre" className="input" required maxLength={150} value={f.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Teatro del Barrio" />
              {repetida ? (
                <p className="hint" role="status" style={{ color: "var(--foco)", margin: "6px 0 0" }}>
                  Ya hay una sala con este nombre: <Link href={`/sala/${repetida.id}`} target="_blank" style={{ textDecoration: "underline" }}>{repetida.n}{repetida.s ? ` (${repetida.s})` : ""}</Link>. Si es la tuya, no hace falta crearla otra vez.
                </p>
              ) : null}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <div className="field" style={{ flex: "1 1 180px" }}>
                <label className="label" htmlFor="ciudad">Ciudad *</label>
                <input id="ciudad" className="input" required maxLength={80} value={f.ciudad} onChange={(e) => set("ciudad", e.target.value)} placeholder="Madrid" />
              </div>
              <div className="field" style={{ flex: "0 1 140px" }}>
                <label className="label" htmlFor="aforo">Aforo</label>
                <input id="aforo" className="input" type="number" min={0} max={100000} inputMode="numeric" value={f.aforo} onChange={(e) => set("aforo", e.target.value)} placeholder="Butacas" />
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="direccion">Dirección</label>
              <input id="direccion" className="input" maxLength={200} value={f.direccion} onChange={(e) => set("direccion", e.target.value)} placeholder="Calle del Ave María, 48" />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <div className="field" style={{ flex: "1 1 220px" }}>
                <label className="label" htmlFor="web">Web</label>
                <input id="web" className="input" type="url" maxLength={300} value={f.web} onChange={(e) => set("web", e.target.value)} placeholder="https://…" />
              </div>
              <div className="field" style={{ flex: "1 1 180px" }}>
                <label className="label" htmlFor="ig">Instagram</label>
                <input id="ig" className="input" maxLength={100} value={f.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@tusala" />
              </div>
            </div>
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="desc">Sobre la sala</label>
          <textarea id="desc" className="input" rows={6} maxLength={3000} value={f.descripcion} onChange={(e) => set("descripcion", e.target.value)} placeholder="Historia, programación, accesibilidad, cómo llegar…" />
        </div>
        {error ? <p className="error" role="alert">{error}</p> : null}
        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={estado === "saving"}>{estado === "saving" ? "Guardando…" : nueva ? "Publicar sala" : "Guardar cambios"}</button>
          <Link href={nueva ? "/salas" : `/sala/${id}`} className="btn btn-ghost">Cancelar</Link>
        </div>
      </form>
    </main>
  );
}
