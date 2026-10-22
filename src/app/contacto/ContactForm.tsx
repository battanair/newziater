"use client";

import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase-client";

// Escribe en la colección existente "fallos" (nombre, email, mensaje, fecha).
// Las reglas solo permiten crear mensajes; nadie puede leerlos desde la web.
export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    if (f.get("web")) return; // trampa anti-bots: los humanos no ven este campo
    setStatus("sending");
    try {
      await addDoc(collection(db, "fallos"), {
        nombre: String(f.get("nombre")).slice(0, 100),
        email: String(f.get("email")).slice(0, 200),
        mensaje: String(f.get("mensaje")).slice(0, 5000),
        fecha: new Date().toISOString(),
      });
      setStatus("ok");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") return <p className="ok" role="status">Gracias, hemos recibido tu mensaje.</p>;

  return (
    <form onSubmit={onSubmit} className="stack">
      <div className="field"><label className="label" htmlFor="nombre">Nombre</label><input id="nombre" name="nombre" className="input" required maxLength={100} autoComplete="name" /></div>
      <div className="field"><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" className="input" required maxLength={200} autoComplete="email" /></div>
      <div className="field"><label className="label" htmlFor="mensaje">Mensaje</label><textarea id="mensaje" name="mensaje" className="textarea" rows={6} required maxLength={5000} /></div>
      <div className="sr-only" aria-hidden="true"><label htmlFor="web">No rellenar</label><input id="web" name="web" tabIndex={-1} autoComplete="off" /></div>
      {status === "error" ? <p className="error" role="alert">No se pudo enviar. Inténtalo de nuevo.</p> : null}
      <button type="submit" className="btn btn-primary btn-lg" disabled={status === "sending"} style={{ alignSelf: "flex-start" }}>{status === "sending" ? "Enviando…" : "Enviar mensaje"}</button>
    </form>
  );
}
