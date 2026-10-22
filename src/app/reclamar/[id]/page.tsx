"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { leer, solicitarReclamacion } from "@/lib/client-data";
import { nombreCompleto } from "@/lib/format";
import type { Persona } from "@/lib/types";
import type { User } from "firebase/auth";

const METODOS = [
  { id: "instagram", t: "Con tu Instagram", d: "Te escribiremos por mensaje directo a la cuenta de tu ficha o a la que nos indiques.", campo: "Tu usuario de Instagram" },
  { id: "compania", t: "Con una compañía", d: "Una compañía o teatro con el que hayas trabajado confirma que eres tú.", campo: "Compañía y email de contacto" },
  { id: "representante", t: "Con tu representante", d: "Tu agencia lo confirma desde su email profesional.", campo: "Email de tu representante" },
];

export default function ReclamarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RequireAuth>{(user) => <Reclamar id={id} user={user} />}</RequireAuth>;
}

function Reclamar({ id, user }: { id: string; user: User }) {
  const [persona, setPersona] = useState<Persona | null | undefined>(undefined);
  const [metodo, setMetodo] = useState("instagram");
  const [contacto, setContacto] = useState("");
  const [estado, setEstado] = useState<"idle" | "busy" | "ok" | "error">("idle");

  useEffect(() => { leer<Persona>("persona", id).then(setPersona).catch(() => setPersona(null)); }, [id]);

  if (persona === undefined) return <main className="wrap section"><p className="muted">Cargando…</p></main>;
  if (!persona) return <main className="wrap section"><p>Esta ficha no existe.</p></main>;
  if (persona.coincide === user.uid) return <main className="wrap section"><p>Esta ficha ya es tuya. <Link href="/panel/ficha" style={{ color: "var(--foco)" }}>Editar mi ficha</Link></p></main>;
  if (persona.coincide) return <main className="wrap section"><p>Esta ficha ya la ha reclamado otra persona. Si crees que es un error, <Link href="/contacto" style={{ color: "var(--foco)" }}>escríbenos</Link>.</p></main>;

  const m = METODOS.find((x) => x.id === metodo)!;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("busy");
    try {
      await solicitarReclamacion(id, metodo, contacto.trim());
      setEstado("ok");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "ok") {
    return (
      <main className="wrap section" style={{ maxWidth: 720 }}>
        <h1 className="h1" style={{ fontSize: 44 }}>Solicitud enviada</h1>
        <p className="lead soft">Revisaremos que eres {nombreCompleto(persona)} en uno o dos días y te avisaremos por email. Después podrás editar la ficha y confirmar tus créditos.</p>
        <Link href="/" className="btn">Volver al inicio</Link>
      </main>
    );
  }

  return (
    <main className="wrap section" style={{ maxWidth: 820 }}>
      <p className="eyebrow" style={{ marginBottom: 14 }}>Paso 2 de 2</p>
      <h1 className="h1" style={{ fontSize: 48 }}>Confirma que eres {nombreCompleto(persona)}</h1>
      <p className="lead soft">Así nadie puede apropiarse de tu ficha. Elige la forma más cómoda para ti.</p>
      <form onSubmit={enviar} className="stack" style={{ marginTop: 28 }}>
        <div role="radiogroup" aria-label="Forma de verificación" className="form-grid">
          {METODOS.map((x) => (
            <button key={x.id} type="button" role="radio" aria-checked={x.id === metodo} onClick={() => setMetodo(x.id)} className={`panel ${x.id === metodo ? "panel-foco" : ""}`} style={{ textAlign: "left", cursor: "pointer", color: "var(--papel)" }}>
              <strong style={{ display: "block" }}>{x.t}</strong>
              <span className="hint">{x.d}</span>
            </button>
          ))}
        </div>
        <div className="field" style={{ maxWidth: 520 }}>
          <label className="label" htmlFor="contacto">{m.campo}</label>
          <input id="contacto" className="input" required maxLength={200} value={contacto} onChange={(e) => setContacto(e.target.value)} />
        </div>
        {estado === "error" ? <p className="error" role="alert">No se pudo enviar la solicitud. Inténtalo de nuevo.</p> : null}
        <button type="submit" className="btn btn-primary btn-lg" disabled={estado === "busy"} style={{ alignSelf: "flex-start" }}>Enviar solicitud</button>
      </form>
    </main>
  );
}
