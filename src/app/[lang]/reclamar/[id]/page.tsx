"use client";


import Link, { useT, useIdioma } from "@/components/Idioma";
import { use, useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { leer, miPersona, solicitarReclamacion } from "@/lib/client-data";
import { nombreCompleto } from "@/lib/format";
import type { Persona } from "@/lib/types";
import type { User } from "firebase/auth";

const METODOS = [
  { id: "instagram", t: "Con tu Instagram", d: "Te escribiremos por mensaje directo a la cuenta de tu ficha o a la que nos indiques.", campo: "Tu usuario de Instagram" },
  { id: "compania", t: "Con una compañía", d: "Una compañía o teatro con el que hayas trabajado confirma que eres tú.", campo: "Compañía y email de contacto" },
  { id: "representante", t: "Con tu representante", d: "Tu agencia lo confirma desde su email profesional.", campo: "Email de tu representante" },
];

export default function ReclamarPage({ params }: { params: Promise<{ id: string; lang: string }> }) {
  const { id } = use(params);
  return <RequireAuth>{(user) => <Reclamar id={id} user={user} />}</RequireAuth>;
}

function Reclamar({ id, user }: { id: string; user: User }) {
  const t = useT();
  const [persona, setPersona] = useState<Persona | null | undefined>(undefined);
  const [metodo, setMetodo] = useState("instagram");
  const [contacto, setContacto] = useState("");
  const [estado, setEstado] = useState<"idle" | "busy" | "ok" | "error">("idle");

  const [previa, setPrevia] = useState<string | null>(null);
  const [mia, setMia] = useState<Persona | null>(null);

  useEffect(() => {
    leer<Persona>("persona", id).then(setPersona).catch(() => setPersona(null));
    getDoc(doc(db, "reclamaciones", `${id}_${user.uid}`)).then((s) => setPrevia(s.exists() ? String(s.data().estado ?? "pendiente") : null)).catch(() => {});
    miPersona(user.uid).then(setMia).catch(() => {});
  }, [id, user.uid]);

  if (persona === undefined) return <main className="wrap section"><p className="muted">{t("Cargando…")}</p></main>;
  if (!persona) return <main className="wrap section"><p>{t("Esta ficha no existe.")}</p></main>;
  if (persona.coincide === user.uid) return <main className="wrap section"><p>{t("Esta ficha ya es tuya.")}{" "}<Link href="/panel/ficha" style={{ color: "var(--foco)" }}>{t("Editar mi ficha")}</Link></p></main>;
  if (persona.coincide) return <main className="wrap section"><p>{t("Esta ficha ya la ha reclamado otra persona. Si crees que es un error,")}{" "}<Link href="/contacto" style={{ color: "var(--foco)" }}>{t("escríbenos")}</Link>.</p></main>;

  if (previa && estado !== "ok") {
    return (
      <main className="wrap section" style={{ maxWidth: 720 }}>
        <h1 className="h1" style={{ fontSize: 44 }}>{previa === "rechazada" ? t("Solicitud no aprobada") : t("Ya has enviado la solicitud")}</h1>
        <p className="lead soft">{previa === "rechazada"
          ? <>{t("No pudimos confirmar que eres {persona}. Si crees que es un error,", { persona: nombreCompleto(persona) })}{" "}<Link href="/contacto" style={{ color: "var(--foco)" }}>{t("escríbenos")}</Link>{" "}{t("y lo revisamos.")}</>
          : <>{t("Estamos comprobando que eres {persona}. Verás el estado en Mi espacio.", { persona: nombreCompleto(persona) })}</>}</p>
        <Link href="/panel" className="btn btn-primary">{t("Ir a Mi espacio")}</Link>
      </main>
    );
  }

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
        <h1 className="h1" style={{ fontSize: 44 }}>{t("Solicitud enviada")}</h1>
        <p className="lead soft">{t("Revisaremos que eres {persona} en uno o dos días. Verás el estado de tu solicitud en Mi espacio y, cuando esté aprobada, podrás editar la ficha y confirmar tus créditos.", { persona: nombreCompleto(persona) })}</p>
        <Link href="/panel" className="btn btn-primary">{t("Ir a Mi espacio")}</Link>
      </main>
    );
  }

  return (
    <main className="wrap section" style={{ maxWidth: 820 }}>
      <p className="eyebrow" style={{ marginBottom: 14 }}>{t("Paso 2 de 2")}</p>
      <h1 className="h1" style={{ fontSize: 48 }}>{t("Confirma que eres {persona}", { persona: nombreCompleto(persona) })}</h1>
      <p className="lead soft">{t("Así nadie puede apropiarse de tu ficha. Elige la forma más cómoda para ti.")}</p>
      {mia && mia.id !== id ? (
        <p className="panel" style={{ marginTop: 16 }}>{t("Ya gestionas la ficha de")}{" "}<Link href={`/persona/${mia.id}`} style={{ color: "var(--foco)" }}>{nombreCompleto(mia)}</Link>{t(". Si esta es un duplicado tuyo, envía la solicitud igualmente: al revisarla uniremos las dos.")}</p>
      ) : null}
      <form onSubmit={enviar} className="stack" style={{ marginTop: 28 }}>
        <div role="radiogroup" aria-label={t("Forma de verificación")} className="form-grid">
          {METODOS.map((x) => (
            <button key={x.id} type="button" role="radio" aria-checked={x.id === metodo} onClick={() => setMetodo(x.id)} className={`panel ${x.id === metodo ? "panel-foco" : ""}`} style={{ textAlign: "left", cursor: "pointer", color: "var(--papel)" }}>
              <strong style={{ display: "block" }}>{t(x.t)}</strong>
              <span className="hint">{t(x.d)}</span>
            </button>
          ))}
        </div>
        <div className="field" style={{ maxWidth: 520 }}>
          <label className="label" htmlFor="contacto">{t(m.campo)}</label>
          <input id="contacto" className="input" required maxLength={200} value={contacto} onChange={(e) => setContacto(e.target.value)} />
        </div>
        {estado === "error" ? <p className="error" role="alert">{t("No se pudo enviar la solicitud. Inténtalo de nuevo.")}</p> : null}
        <button type="submit" className="btn btn-primary btn-lg" disabled={estado === "busy"} style={{ alignSelf: "flex-start" }}>{t("Enviar solicitud")}</button>
      </form>
    </main>
  );
}
