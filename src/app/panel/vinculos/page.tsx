"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase-client";
import { RequireAuth } from "@/components/RequireAuth";
import { PanelNav } from "@/components/PanelNav";
import { authFetch } from "@/components/AuthProvider";
import { confirmarCredito, creditosDe, leer, miPersona, obrasCreadasPor } from "@/lib/client-data";
import { nombreCompleto } from "@/lib/format";
import type { Credito, Obra, Persona } from "@/lib/types";
import { resolverSugerencia, sugerenciasPendientes, type Sugerencia } from "@/lib/colaboracion";

export default function VinculosPage() {
  return <RequireAuth>{(user) => <Vinculos user={user} />}</RequireAuth>;
}

type Item = Credito & { obra?: Obra | null; persona?: Persona | null };

function Vinculos({ user }: { user: User }) {
  const [tab, setTab] = useState<"mios" | "obras" | "sugerencias" | "fichas">("mios");
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [yo, setYo] = useState<Persona | null>(null);
  const [mios, setMios] = useState<Item[]>([]);
  const [enObras, setEnObras] = useState<Item[]>([]);
  const [fichas, setFichas] = useState<Persona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [copiado, setCopiado] = useState("");

  const cargar = useCallback(async () => {
    const p = await miPersona(user.uid);
    setYo(p);
    // 1) Me han añadido a una obra y falta que lo confirme
    if (p) {
      const cs = (await creditosDe("id_persona", p.id)).filter((c) => c.estado === "pendiente" && c.creado_por !== user.uid);
      setMios(await Promise.all(cs.map(async (c) => ({ ...c, obra: await leer<Obra>("obra", c.id_obra) }))));
    }
    // 2) Alguien se ha añadido a una obra mía
    const obras = await obrasCreadasPor(user.uid);
    const lists = await Promise.all(obras.map((o) => creditosDe("id_obra", o.id)));
    const pend = lists.flat().filter((c) => c.estado === "pendiente" && c.creado_por !== user.uid);
    setEnObras(await Promise.all(pend.map(async (c) => ({ ...c, obra: obras.find((o) => o.id === c.id_obra), persona: await leer<Persona>("persona", c.id_persona) }))));
    // 3) Fichas que he creado para personas sin cuenta
    const q = await getDocs(query(collection(db, "persona"), where("creacion", "==", user.uid), where("coincide", "==", "")));
    setFichas(q.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Persona, "id">) })));
    // 4) Sugerencias de cambio en fichas que gestiono
    setSugerencias(await sugerenciasPendientes(user.uid).catch(() => []));
    setCargando(false);
  }, [user.uid]);

  useEffect(() => { cargar(); }, [cargar]);

  async function confirmar(c: Item) {
    await confirmarCredito(c.id);
    await authFetch("/api/revalidar", { obras: [c.id_obra], personas: [c.id_persona] }).catch(() => {});
    cargar();
  }
  async function rechazar(c: Item) {
    await deleteDoc(doc(db, "persona_obra", c.id));
    await authFetch("/api/revalidar", { obras: [c.id_obra], personas: [c.id_persona] }).catch(() => {});
    cargar();
  }
  async function resolver(sg: Sugerencia, estado: "aplicada" | "descartada") {
    await resolverSugerencia(sg.id, estado);
    setSugerencias((l) => l.filter((x) => x.id !== sg.id));
  }
  async function copiar(p: Persona) {
    await navigator.clipboard.writeText(`${location.origin}/reclamar/${p.id}`);
    setCopiado(p.id);
    setTimeout(() => setCopiado(""), 2000);
  }

  const tabs = [
    { k: "mios" as const, l: "Te han añadido", n: mios.length },
    { k: "obras" as const, l: "En tus obras", n: enObras.length },
    { k: "sugerencias" as const, l: "Sugerencias", n: sugerencias.length },
    { k: "fichas" as const, l: "Fichas por reclamar", n: fichas.length },
  ];

  return (
    <>
      <PanelNav personaId={yo?.id} pendientes={mios.length + enObras.length + sugerencias.length} />
      <main className="wrap section" style={{ maxWidth: 1000 }}>
        <h1 className="h1" style={{ fontSize: 48 }}>Vínculos</h1>
        <p className="lead soft" style={{ margin: "10px 0 28px" }}>Aquí se cruzan las fichas: quién te ha añadido a una obra, quién se ha añadido a las tuyas y a quién has dado de alta.</p>
        <div role="tablist" aria-label="Tipo de vínculo" className="tabs" style={{ marginBottom: 24 }}>
          {tabs.map((t) => <button key={t.k} type="button" role="tab" className="tab" aria-selected={tab === t.k} onClick={() => setTab(t.k)}>{t.l} <span style={{ opacity: .7 }}>{t.n}</span></button>)}
        </div>
        {cargando ? <p className="muted">Cargando…</p> : null}

        {tab === "mios" && !cargando ? (
          <div className="stack">
            {!yo ? <p className="soft">Primero <Link href="/panel/bienvenida" style={{ color: "var(--foco)" }}>crea o reclama tu ficha</Link>.</p> : null}
            {yo && !mios.length ? <Vacio texto="Todo al día. Te avisaremos cuando alguien te añada a una obra." /> : null}
            {mios.map((c) => (
              <div key={c.id} className="panel" style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}>
                <div style={{ flex: "1 1 320px" }}>
                  <div className="hint">Te han añadido a</div>
                  <Link href={`/obra/${c.id_obra}`} className="serif" style={{ fontSize: 26, fontWeight: 600 }}>{c.obra?.titulo ?? "Obra"}</Link>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}><span className="chip">{c.puesto}</span>{c.titulo && c.titulo !== c.puesto ? <span className="chip">{c.titulo}</span> : null}{c.fecha_inicio ? <span className="chip">{c.fecha_inicio}</span> : null}</div>
                </div>
                <div className="actions">
                  <button type="button" className="btn btn-ghost" onClick={() => rechazar(c)}>No soy yo</button>
                  <button type="button" className="btn btn-primary" onClick={() => confirmar(c)}>Confirmar</button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "obras" && !cargando ? (
          <div className="stack">
            {!enObras.length ? <Vacio texto="Nadie se ha añadido a tus obras pendiente de confirmar." /> : null}
            {enObras.map((c) => (
              <div key={c.id} className="panel" style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}>
                <div style={{ flex: "1 1 320px" }}>
                  <div><Link href={`/persona/${c.id_persona}`} style={{ fontWeight: 600 }}>{c.persona ? nombreCompleto(c.persona) : "Alguien"}</Link> <span className="soft">dice que participó en</span> <strong>{c.obra?.titulo}</strong></div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}><span className="chip">{c.puesto}</span>{c.titulo && c.titulo !== c.puesto ? <span className="chip">{c.titulo}</span> : null}</div>
                </div>
                <div className="actions">
                  <button type="button" className="btn btn-ghost" onClick={() => rechazar(c)}>No es correcto</button>
                  <button type="button" className="btn btn-primary" onClick={() => confirmar(c)}>Confirmar</button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "sugerencias" && !cargando ? (
          <div className="stack">
            {!sugerencias.length ? <Vacio texto="Nadie ha sugerido cambios en tus fichas. Cuando alguien proponga una corrección, aparecerá aquí." /> : null}
            {sugerencias.map((sg) => {
              const enlace = sg.tipo === "obra" ? `/obra/${sg.ref}` : sg.tipo === "persona" ? `/persona/${sg.ref}` : `/compania/${sg.ref}`;
              const editar = sg.tipo === "obra" ? `/panel/obra/${sg.ref}` : sg.tipo === "persona" && yo?.id === sg.ref ? "/panel/ficha" : null;
              return (
                <div key={sg.id} className="panel" style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
                  <div style={{ flex: "1 1 360px" }}>
                    <div className="hint">{sg.autor_nombre || "Alguien"} sugiere un cambio en {sg.tipo === "obra" ? "la obra" : sg.tipo === "persona" ? "la ficha" : "la compañía"}</div>
                    <Link href={enlace} className="serif" style={{ fontSize: 24, fontWeight: 600 }}>{sg.titulo_ficha || "Ficha"}</Link>
                    <div style={{ marginTop: 8 }}><span className="chip">{sg.campo}</span></div>
                    <p className="soft" style={{ margin: "12px 0 0", whiteSpace: "pre-line" }}>{sg.texto}</p>
                  </div>
                  <div className="actions">
                    <button type="button" className="btn btn-ghost" onClick={() => resolver(sg, "descartada")}>Descartar</button>
                    {editar ? <Link href={editar} className="btn">Editar ficha</Link> : null}
                    <button type="button" className="btn btn-primary" onClick={() => resolver(sg, "aplicada")}>Hecho</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {tab === "fichas" && !cargando ? (
          <div>
            {!fichas.length ? <Vacio texto="No has creado fichas para otras personas." /> : null}
            <ul className="list">
              {fichas.map((p) => (
                <li key={p.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "16px 0" }}>
                  <Link href={`/persona/${p.id}`} style={{ flex: 1, fontWeight: 600 }}>{nombreCompleto(p)}</Link>
                  <span className="chip">Sin reclamar</span>
                  <button type="button" className="btn" onClick={() => copiar(p)}>{copiado === p.id ? "✓ Enlace copiado" : "Copiar enlace para que la reclame"}</button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </main>
    </>
  );
}

function Vacio({ texto }: { texto: string }) {
  return <div className="panel" style={{ borderStyle: "dashed", background: "transparent", textAlign: "center", color: "var(--texto-2)" }}>{texto}</div>;
}
