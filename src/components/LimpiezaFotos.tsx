"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { authFetch } from "./AuthProvider";

// Fotos de Cloudinary que ya no usa ninguna ficha (cambiadas por otra, quitadas o
// subidas en un formulario que no se llegó a guardar). Se comprueban contra TODO
// lo guardado, incluido el historial de cambios, y solo cuentan las de más de 30 días.
// Una vez por semana, al abrir el panel, se borran solas.
const COLECCIONES = ["obra", "persona", "productoras", "salas", "historial", "sugerencias", "users", "colaboradores"];
const CLAVE = "ziater-limpieza-fotos";
const SEMANA = 7 * 86400_000;
const MAX_AUTO = 200; // si salen más, no se borran solas: mejor revisarlo

type Foto = { public_id: string; created_at: string; bytes: number };

async function textoDeTodo(): Promise<string> {
  const partes: string[] = [];
  for (const c of COLECCIONES) {
    const s = await getDocs(collection(db, c)).catch(() => null);
    if (!s) { if (["obra", "persona", "historial"].includes(c)) throw new Error(`No se pudo leer ${c}`); continue; }
    s.docs.forEach((d) => partes.push(JSON.stringify(d.data())));
  }
  return partes.join("\n");
}

export function LimpiezaFotos() {
  const [estado, setEstado] = useState<"idle" | "revisando" | "borrando">("idle");
  const [huerfanas, setHuerfanas] = useState<Foto[] | null>(null);
  const [total, setTotal] = useState(0);
  const [msg, setMsg] = useState("");

  async function revisar(auto: boolean) {
    setEstado("revisando");
    setMsg("");
    try {
      const [{ fotos, dias }, todo] = await Promise.all([authFetch("/api/admin/fotos", { accion: "listar" }) as Promise<{ fotos: Foto[]; dias: number }>, textoDeTodo()]);
      const limite = Date.now() - dias * 86400_000;
      const sinUso = fotos.filter((f) => Date.parse(f.created_at) < limite && !todo.includes(f.public_id));
      setTotal(fotos.length);
      setHuerfanas(sinUso);
      if (auto) {
        try { localStorage.setItem(CLAVE, String(Date.now())); } catch {}
        if (sinUso.length && sinUso.length <= MAX_AUTO) await borrar(sinUso);
      }
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setEstado("idle");
    }
  }

  async function borrar(lista: Foto[]) {
    setEstado("borrando");
    const { borradas } = (await authFetch("/api/admin/fotos", { accion: "borrar", ids: lista.map((f) => f.public_id) })) as { borradas: number };
    const mb = lista.reduce((s, f) => s + f.bytes, 0) / 1048576;
    setMsg(`Borradas ${borradas} fotos sin usar (${mb.toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB liberados).`);
    setHuerfanas([]);
    setEstado("idle");
  }

  useEffect(() => {
    let ultima = 0;
    try { ultima = Number(localStorage.getItem(CLAVE)) || 0; } catch {}
    if (Date.now() - ultima > SEMANA) revisar(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const mb = (huerfanas ?? []).reduce((s, f) => s + f.bytes, 0) / 1048576;
  return (
    <section>
      <h2 className="eyebrow" style={{ marginBottom: 12 }}>Fotos en Cloudinary</h2>
      <div className="panel" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
        <span style={{ flex: "1 1 260px" }}>
          {estado === "revisando" ? "Comprobando qué fotos se usan…" : estado === "borrando" ? "Borrando fotos sin usar…" : huerfanas === null ? "Las fotos que ya no usa ninguna ficha se borran solas una vez por semana." : huerfanas.length ? <><strong>{huerfanas.length} fotos sin usar</strong> ({mb.toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB) de {total} subidas desde la web nueva.</> : <>Todo limpio: las {total} fotos subidas desde la web nueva están en uso o son recientes.</>}
          <span className="hint" style={{ display: "block", marginTop: 4 }}>Solo se borran fotos de más de 30 días que no aparecen en ninguna ficha ni en su historial. Las de la web antigua no se tocan.</span>
          {msg ? <span className="hint" role="status" style={{ display: "block", marginTop: 4, color: "var(--foco)" }}>{msg}</span> : null}
        </span>
        {huerfanas?.length ? <button type="button" className="btn btn-primary" disabled={estado !== "idle"} onClick={() => borrar(huerfanas)}>Borrar {huerfanas.length}</button> : null}
        <button type="button" className="btn" disabled={estado !== "idle"} onClick={() => revisar(false)}>Comprobar ahora</button>
      </div>
    </section>
  );
}
