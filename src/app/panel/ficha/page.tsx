"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase-client";
import { RequireAuth } from "@/components/RequireAuth";
import { PanelNav } from "@/components/PanelNav";
import { ImageUpload } from "@/components/ImageUpload";
import { authFetch } from "@/components/AuthProvider";
import { useBusqueda } from "@/components/SearchBox";
import { anadirCredito, creditosDe, leer, miPersona, obrasCreadasPor } from "@/lib/client-data";
import { T_RETRATO, cld, DEPARTAMENTOS, ROLES, nombreCompleto } from "@/lib/format";
import type { Credito, Obra, Persona, SearchItem } from "@/lib/types";
import { clavesDe } from "@/lib/claves";

export default function FichaArtistaPage() {
  return <RequireAuth>{(user) => <Panel user={user} />}</RequireAuth>;
}

type CreditoObra = Credito & { obra?: Obra | null };

function Panel({ user }: { user: User }) {
  const [persona, setPersona] = useState<Persona | null | undefined>(undefined);
  const [form, setForm] = useState<Partial<Persona>>({});
  const [creditos, setCreditos] = useState<CreditoObra[]>([]);
  const [misObras, setMisObras] = useState<Obra[]>([]);
  const [estado, setEstado] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const cargar = useCallback(async () => {
    const p = await miPersona(user.uid);
    setPersona(p);
    setMisObras(await obrasCreadasPor(user.uid));
    if (!p) return;
    setForm({ Nombre: p.Nombre, Apellidos: p.Apellidos ?? "", ciudad: p.ciudad ?? "", biografia: p.biografia ?? "", instagram: p.instagram ?? "", foto: p.foto ?? "", roles: p.roles ?? [], destacadas: p.destacadas ?? [] });
    const cs = await creditosDe("id_persona", p.id);
    setCreditos(await Promise.all(cs.map(async (c) => ({ ...c, obra: await leer<Obra>("obra", c.id_obra) }))));
  }, [user.uid]);

  useEffect(() => { cargar(); }, [cargar]);

  if (persona === undefined) return <main className="wrap section"><p className="muted">Cargando tu panel…</p></main>;

  if (!persona) {
    return (
      <>
        <PanelNav />
        <main className="wrap section" style={{ maxWidth: 720 }}>
          <h1 className="h1" style={{ fontSize: 44 }}>Aún no tienes ficha de artista</h1>
          <p className="lead soft">Si trabajas en las artes escénicas, crea tu ficha o reclama la que ya tengas. Si solo quieres seguir obras, no necesitas hacer nada más.</p>
          <Link href="/panel/bienvenida" className="btn btn-primary btn-lg">Crear o reclamar mi ficha</Link>
          {misObras.length ? <MisObras obras={misObras} /> : null}
        </main>
      </>
    );
  }

  const set = <K extends keyof Persona>(k: K, v: Persona[K]) => { setForm((f) => ({ ...f, [k]: v })); setEstado("idle"); };
  const checks = [
    { ok: Boolean(form.foto), l: "Añade tu retrato" },
    { ok: (form.biografia ?? "").length > 80, l: "Escribe tu biografía" },
    { ok: (form.roles ?? []).length > 0, l: "Elige tus roles" },
    { ok: creditos.length >= 3, l: "Añade al menos 3 obras" },
    { ok: Boolean(form.instagram), l: "Añade tu Instagram" },
  ];
  const pct = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  async function guardar() {
    if (!persona || !form.Nombre?.trim()) return;
    setEstado("saving");
    try {
      await updateDoc(doc(db, "persona", persona.id), {
        Nombre: form.Nombre.trim().slice(0, 100),
        Apellidos: (form.Apellidos ?? "").trim().slice(0, 150),
        ciudad: (form.ciudad ?? "").trim().slice(0, 80),
        biografia: (form.biografia ?? "").trim().slice(0, 5000),
        instagram: (form.instagram ?? "").trim().slice(0, 100),
        foto: form.foto ?? "",
        roles: (form.roles ?? []).slice(0, 10),
        claves: clavesDe(form.Nombre, form.Apellidos),
        destacadas: (form.destacadas ?? []).slice(0, 4),
      });
      await authFetch("/api/revalidar", { personas: [persona.id] }).catch(() => {});
      setEstado("saved");
    } catch {
      setEstado("error");
    }
  }

  function toggleDestacada(obraId: string) {
    const d = form.destacadas ?? [];
    set("destacadas", d.includes(obraId) ? d.filter((x) => x !== obraId) : d.length >= 4 ? d : [...d, obraId]);
  }

  return (
    <>
      <PanelNav personaId={persona.id} />
      <div className="wrap" style={{ paddingTop: 32 }}>
        <div className="panel" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px 32px" }}>
          <div style={{ flex: "1 1 260px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}><strong>Tu ficha está al {pct} %</strong><span className="muted">Las fichas completas salen más en Google</span></div>
            <div className="progress"><span style={{ width: `${pct}%` }} /></div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {checks.map((c) => <span key={c.l} className={`chip ${c.ok ? "chip-ok" : ""}`}>{c.ok ? "✓ " : "+ "}{c.l}</span>)}
          </div>
        </div>
      </div>

      <div className="wrap row section" style={{ alignItems: "flex-start" }}>
        <main className="main-col stack" style={{ gap: 28 }}>
          <section className="panel" style={{ background: "transparent" }}>
            <h2 className="h3" style={{ marginBottom: 20 }}>Lo esencial</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
              <ImageUpload value={form.foto} onChange={(url) => set("foto", url)} tipo="foto" label="Subir retrato" shape="portrait" />
              <div style={{ flex: "1 1 300px" }} className="stack">
                <div className="form-grid">
                  <div className="field"><label className="label" htmlFor="n">Nombre</label><input id="n" className="input" value={form.Nombre ?? ""} onChange={(e) => set("Nombre", e.target.value)} maxLength={100} required /></div>
                  <div className="field"><label className="label" htmlFor="a">Apellidos</label><input id="a" className="input" value={form.Apellidos ?? ""} onChange={(e) => set("Apellidos", e.target.value)} maxLength={150} /></div>
                </div>
                <div className="form-grid">
                  <div className="field"><label className="label" htmlFor="c">Ciudad</label><input id="c" className="input" value={form.ciudad ?? ""} onChange={(e) => set("ciudad", e.target.value)} maxLength={80} /></div>
                  <div className="field"><label className="label" htmlFor="ig">Instagram</label><input id="ig" className="input" placeholder="@usuario" value={form.instagram ?? ""} onChange={(e) => set("instagram", e.target.value)} maxLength={100} /></div>
                </div>
              </div>
            </div>
            <p className="label" style={{ margin: "24px 0 10px" }}>¿Qué haces? <span className="muted" style={{ fontWeight: 400 }}>Elige todos los que apliquen</span></p>
            <div role="group" aria-label="Roles" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ROLES.map((r) => {
                const on = (form.roles ?? []).includes(r);
                return <button key={r} type="button" className="chip" aria-pressed={on} onClick={() => set("roles", on ? form.roles!.filter((x) => x !== r) : [...(form.roles ?? []), r])}>{r}</button>;
              })}
            </div>
            <div className="field" style={{ marginTop: 24 }}>
              <label className="label" htmlFor="bio">Biografía</label>
              <textarea id="bio" className="textarea" rows={6} maxLength={5000} value={form.biografia ?? ""} onChange={(e) => set("biografia", e.target.value)} />
              <span className="hint" style={{ textAlign: "right" }}>{(form.biografia ?? "").length} / 5000</span>
            </div>
            <div className="actions" style={{ marginTop: 16, alignItems: "center" }}>
              <button type="button" className="btn btn-primary" onClick={guardar} disabled={estado === "saving"}>{estado === "saving" ? "Guardando…" : "Guardar y publicar"}</button>
              {estado === "saved" ? <span className="ok" role="status">✓ Publicado. Tu ficha ya está actualizada.</span> : null}
              {estado === "error" ? <span className="error" role="alert">No se pudo guardar.</span> : null}
            </div>
          </section>

          <section className="panel" style={{ background: "transparent" }}>
            <div className="section-head" style={{ marginBottom: 6 }}><h2 className="h3">Trayectoria</h2></div>
            <p className="muted" style={{ marginTop: 0 }}>Cada crédito te une a la ficha de la obra. Marca con ★ hasta 4 obras para «Conocido por».</p>
            <AnadirCredito persona={persona} uid={user.uid} onAdded={cargar} />
            <ol className="list" style={{ marginTop: 20 }}>
              {creditos.map((c) => (
                <li key={c.id} className="career-row" style={{ gridTemplateColumns: "44px minmax(0,1fr) auto" }}>
                  <button type="button" className="btn btn-ghost" style={{ padding: 0, minWidth: 44, color: (form.destacadas ?? []).includes(c.id_obra) ? "var(--foco)" : "var(--texto-4)" }} aria-pressed={(form.destacadas ?? []).includes(c.id_obra)} aria-label="Destacar en «Conocido por»" onClick={() => toggleDestacada(c.id_obra)}>★</button>
                  <span>
                    {c.obra ? <Link href={`/obra/${c.obra.id}`} style={{ fontWeight: 600 }}>{c.obra.titulo}</Link> : <span className="muted">Obra eliminada</span>}
                    <span className="hint" style={{ display: "block" }}>{[c.puesto, c.titulo?.trim() !== c.puesto ? c.titulo : "", c.fecha_inicio].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <span className={`chip ${c.estado === "pendiente" ? "" : "chip-ok"}`}>{c.estado === "pendiente" ? (c.creado_por === user.uid ? "Pendiente de la compañía" : "Por confirmar") : "✓ Confirmado"}</span>
                    <button type="button" className="btn btn-ghost" aria-label="Quitar crédito" onClick={async () => { await deleteDoc(doc(db, "persona_obra", c.id)); await authFetch("/api/revalidar", { personas: [persona.id], obras: [c.id_obra] }).catch(() => {}); cargar(); }}>✕</button>
                  </span>
                </li>
              ))}
            </ol>
            {(form.destacadas ?? []).join() !== (persona.destacadas ?? []).join() ? <p className="hint">Pulsa «Guardar y publicar» para guardar tus obras destacadas.</p> : null}
          </section>
          {misObras.length ? <MisObras obras={misObras} /> : null}
        </main>

        <aside className="side-col" style={{ position: "sticky", top: 90 }}>
          <p className="eyebrow" style={{ color: "var(--texto-3)" }}>Vista previa</p>
          <div className="panel" style={{ background: "var(--butaca-2)" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <span style={{ width: 84, height: 126, borderRadius: 8, background: form.foto ? `center/cover url(${JSON.stringify(cld(form.foto, T_RETRATO) ?? form.foto)})` : "var(--linea)", flex: "none" }} />
              <div>
                <div className="serif" style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.05 }}>{nombreCompleto({ Nombre: form.Nombre ?? "", Apellidos: form.Apellidos })}</div>
                <div className="soft" style={{ fontSize: 14, marginTop: 6 }}>{(form.roles ?? []).join(" · ") || "Añade tus roles"}</div>
                {form.ciudad ? <div className="hint">{form.ciudad}</div> : null}
              </div>
            </div>
            <p className="hint" style={{ marginTop: 16 }}>{(form.biografia ?? "").slice(0, 160) || "Tu biografía aparecerá aquí."}</p>
          </div>
        </aside>
      </div>
    </>
  );
}

function MisObras({ obras }: { obras: Obra[] }) {
  return (
    <section className="panel" style={{ background: "transparent", marginTop: 28 }}>
      <h2 className="h3" style={{ marginBottom: 12 }}>Obras que has creado</h2>
      <ul className="list">
        {obras.map((o) => (
          <li key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", gap: 12 }}>
            <Link href={`/obra/${o.id}`} style={{ fontWeight: 600 }}>{o.titulo}</Link>
            <Link href={`/panel/obra/${o.id}`} className="btn">Editar</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AnadirCredito({ persona, uid, onAdded }: { persona: Persona; uid: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [obra, setObra] = useState<SearchItem | null>(null);
  const [puesto, setPuesto] = useState("Interpretación");
  const [titulo, setTitulo] = useState("");
  const [anio, setAnio] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const { items: obras } = useBusqueda(open ? q : "", ["obra"]);

  async function guardar() {
    if (!obra) return;
    setBusy(true);
    setError("");
    try {
      const o = await leer<Obra>("obra", obra.id);
      await anadirCredito({ id_obra: obra.id, id_persona: persona.id, puesto, titulo: titulo || puesto, fecha_inicio: anio, fecha_fin: "" }, o?.creacion === uid);
      await authFetch("/api/revalidar", { personas: [persona.id], obras: [obra.id] }).catch(() => {});
      setOpen(false); setObra(null); setQ(""); setTitulo(""); setAnio("");
      onAdded();
    } catch {
      setError("No se pudo añadir el crédito.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>+ Añadir crédito</button>;

  return (
    <div className="panel panel-foco stack">
      <div className="field">
        <label className="label" htmlFor="qobra">¿En qué obra participaste?</label>
        <input id="qobra" type="search" className="input" placeholder="Escribe el título…" value={q} onChange={(e) => { setQ(e.target.value); setObra(null); }} autoFocus maxLength={120} />
      </div>
      {!obra && q.trim() ? (
        <div className="suggest" style={{ marginTop: 0 }}>
          {obras.map((o) => (
            <button key={o.id} type="button" className="suggest-item" onClick={() => setObra(o)}>
              {o.img ? <img src={o.img} alt="" className="thumb" /> : <span className="thumb" />}
              <span><strong style={{ display: "block" }}>{o.n}</strong>{o.s ? <span className="hint">{o.s}</span> : null}</span>
            </button>
          ))}
          <Link href={`/panel/obra/nueva?titulo=${encodeURIComponent(q.trim())}`} className="suggest-item" style={{ color: "var(--foco)", fontWeight: 600 }}>+ No está: crear la ficha de «{q.trim()}»</Link>
        </div>
      ) : null}
      {obra ? (
        <>
          <p style={{ margin: 0 }}><span className="chip chip-foco">{obra.n}</span> <button type="button" className="btn btn-ghost" onClick={() => setObra(null)}>Cambiar</button></p>
          <div className="form-grid">
            <div className="field"><label className="label" htmlFor="puesto">Tu papel</label>
              <select id="puesto" className="select" value={puesto} onChange={(e) => setPuesto(e.target.value)}>{DEPARTAMENTOS.map((d) => <option key={d}>{d}</option>)}</select></div>
            <div className="field"><label className="label" htmlFor="tit">{puesto === "Interpretación" ? "Personaje (opcional)" : "Cargo concreto (opcional)"}</label><input id="tit" className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={150} /></div>
            <div className="field"><label className="label" htmlFor="anio">Año</label><input id="anio" className="input" inputMode="numeric" pattern="[0-9]{4}" placeholder="2024" value={anio} onChange={(e) => setAnio(e.target.value)} maxLength={4} /></div>
          </div>
          <p className="hint" style={{ margin: 0 }}>Si no creaste tú la obra, quien la creó recibirá un aviso para confirmarlo.</p>
          {error ? <p className="error" role="alert">{error}</p> : null}
          <div className="actions"><button type="button" className="btn btn-primary" onClick={guardar} disabled={busy}>{busy ? "Añadiendo…" : "Añadir a mi trayectoria"}</button><button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancelar</button></div>
        </>
      ) : null}
    </div>
  );
}
