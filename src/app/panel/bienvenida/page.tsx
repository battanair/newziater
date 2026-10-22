"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { useBusqueda } from "@/components/SearchBox";
import { crearMiPersona, miPersona } from "@/lib/client-data";
import type { User } from "firebase/auth";

export default function BienvenidaPage() {
  return <RequireAuth>{(user) => <Bienvenida user={user} />}</RequireAuth>;
}

function Bienvenida({ user }: { user: User }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(user.displayName ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    miPersona(user.uid).then((p) => { if (p) router.replace("/panel/ficha"); });
  }, [user.uid, router]);

  const { items: matches } = useBusqueda(nombre, ["persona"]);

  async function crear() {
    const [n, ...rest] = nombre.trim().split(/\s+/);
    if (!n) return setError("Escribe tu nombre artístico.");
    setBusy(true);
    try {
      await crearMiPersona(user.uid, { Nombre: n, Apellidos: rest.join(" ") });
      router.replace("/panel/ficha");
    } catch {
      setError("No se pudo crear la ficha. Inténtalo de nuevo.");
      setBusy(false);
    }
  }

  return (
    <main className="wrap section" style={{ maxWidth: 820 }}>
      <p className="eyebrow" style={{ marginBottom: 14 }}>Paso 1 de 2</p>
      <h1 className="h1" style={{ fontSize: 52 }}>Quizá ya estás en Ziater.</h1>
      <p className="lead soft" style={{ maxWidth: 620 }}>Compañías y espectadores añaden obras y créditos cada día. Busca tu nombre: si ya hay una ficha con tu trayectoria, reclámala y no empieces de cero.</p>

      <div className="field" style={{ maxWidth: 620, margin: "28px 0" }}>
        <label className="label" htmlFor="nombre">Tu nombre artístico</label>
        <input id="nombre" className="input" style={{ height: 60, fontSize: 18, background: "var(--papel)", color: "var(--sala)" }} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} autoFocus />
      </div>

      {nombre.trim() ? <p className="muted">{matches.length ? `${matches.length} ${matches.length === 1 ? "ficha coincide" : "fichas coinciden"}` : "No hay fichas con ese nombre"}</p> : null}
      <div className="stack" style={{ maxWidth: 760 }}>
        {matches.map((m) => (
          <div key={m.id} className="panel" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 18 }}>
            {m.img ? <img src={m.img} alt="" className="thumb thumb-round" style={{ width: 64, height: 64 }} /> : <span className="thumb thumb-round" style={{ width: 64, height: 64 }} />}
            <div style={{ flex: "1 1 240px" }}>
              <strong style={{ fontSize: 18 }}>{m.n}</strong>
              {m.s ? <div className="hint">{m.s}</div> : null}
              <Link href={`/persona/${m.id}`} target="_blank" className="hint" style={{ textDecoration: "underline" }}>Ver ficha</Link>
            </div>
            <Link href={`/reclamar/${m.id}`} className="btn btn-primary">¿Eres tú? Reclamar</Link>
          </div>
        ))}
        <button type="button" className="panel" onClick={crear} disabled={busy} style={{ borderStyle: "dashed", textAlign: "left", cursor: "pointer", color: "var(--papel)" }}>
          <strong style={{ display: "block", fontSize: 18 }}>{matches.length ? "No soy ninguna de estas personas" : "Crear mi ficha"}</strong>
          <span className="hint">{busy ? "Creando…" : "Empezar un perfil nuevo desde cero"}</span>
        </button>
        {error ? <p className="error" role="alert">{error}</p> : null}
      </div>
    </main>
  );
}
