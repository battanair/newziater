"use client";

import Link from "next/link";
import { Suspense, use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addDoc, collection, deleteDoc, deleteField, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase-client";
import { RequireAuth } from "@/components/RequireAuth";
import { PanelNav } from "@/components/PanelNav";
import { GaleriaUpload, ImageUpload } from "@/components/ImageUpload";
import { authFetch } from "@/components/AuthProvider";
import { useBusqueda } from "@/components/SearchBox";
import { clavesDe } from "@/lib/claves";
import { anadirCredito, creditosDe, crearPersonaSinCuenta, leer, miPersona } from "@/lib/client-data";
import { DEPARTAMENTOS, GENEROS, colorCartel, fotosDe, iniciales } from "@/lib/format";
import type { Obra, Persona, SearchItem } from "@/lib/types";
import { SugerirCambio } from "@/components/SugerirCambio";
import { Historial } from "@/components/Historial";
import { guardarVersion, pedirGestionarObra, vinculoConObra } from "@/lib/colaboracion";

export default function ObraEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RequireAuth>{(user) => <Suspense><Editor id={id} user={user} /></Suspense>}</RequireAuth>;
}

type Miembro = {
  key: string;
  creditoId?: string; // existente en Firestore
  personaId?: string; // ficha ya existente
  nombre: string;
  img?: string;
  dep: string;
  titulo: string;
  estado: "tu" | "enlazado" | "nuevo";
};

const PASOS = [
  { l: "Lo básico", d: "Título, género, imágenes" },
  { l: "Elenco y equipo", d: "Enlaza a las personas" },
  { l: "Publicar", d: "Revisa y envía" },
];

function Editor({ id, user }: { id: string; user: User }) {
  const router = useRouter();
  const sp = useSearchParams();
  const nueva = id === "nueva";
  const [cargando, setCargando] = useState(!nueva);
  const [obra, setObra] = useState<Obra | null>(null);
  const [yo, setYo] = useState<Persona | null>(null);
  const [paso, setPaso] = useState(0);
  const [f, setF] = useState({ titulo: sp.get("titulo")?.slice(0, 200) ?? "", sinopsis: "", anoinicio: "", anofin: "", activa: true, cartel: "", instagram: "", trailer: "", categoria: [] as string[], duracion: "", idioma: "Castellano", fotos: [] as string[] });
  const [equipo, setEquipo] = useState<Miembro[]>([]);
  const [borrados, setBorrados] = useState<string[]>([]);
  const [dep, setDep] = useState("Interpretación");
  const [q, setQ] = useState("");
  const [personaje, setPersonaje] = useState("");
  const [estado, setEstado] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    miPersona(user.uid).then(setYo);
    if (nueva) return;
    (async () => {
      const o = await leer<Obra>("obra", id);
      setObra(o);
      if (o) {
        const fin = String(o.anofin ?? "");
        setF({ titulo: o.titulo, sinopsis: o.sinopsis ?? "", anoinicio: String(o.anoinicio ?? ""), anofin: fin === "0" ? "" : fin, activa: !fin || fin === "0", cartel: o.cartel ?? "", instagram: o.instagram ?? "", trailer: o.trailer ?? "", categoria: (o.categoria ?? []).filter(Boolean), duracion: o.duracion ? String(o.duracion) : "", idioma: o.idioma ?? "Castellano", fotos: fotosDe(o) });
        const cs = await creditosDe("id_obra", id);
        const ps = await Promise.all(cs.map((c) => leer<Persona>("persona", c.id_persona)));
        setEquipo(cs.map((c, i) => ({ key: c.id, creditoId: c.id, personaId: c.id_persona, nombre: ps[i] ? `${ps[i]!.Nombre} ${ps[i]!.Apellidos ?? ""}`.trim() : "Ficha eliminada", img: ps[i]?.foto, dep: c.puesto || "Equipo", titulo: c.titulo ?? "", estado: c.id_persona === user.uid || ps[i]?.coincide === user.uid ? "tu" : "enlazado" })));
      }
      setCargando(false);
    })();
  }, [id, nueva, user.uid]);

  const esDuena = nueva || obra?.creacion === user.uid;
  const { items: sugerencias } = useBusqueda(q, ["persona"]);

  if (cargando) return <main className="wrap section"><p className="muted">Cargando…</p></main>;
  if (!nueva && !obra) return <main className="wrap section"><p>Esta obra no existe.</p></main>;

  // Quien no creó la obra: añadir su crédito, sugerir un cambio o, si tiene vínculo, pedir gestionarla
  if (!esDuena) {
    return (
      <>
        <PanelNav personaId={yo?.id} />
        <main className="wrap section" style={{ maxWidth: 720 }}>
          <h1 className="h1" style={{ fontSize: 44 }}>{obra!.titulo}</h1>
          <p className="lead soft">Esta ficha la gestiona quien la creó. Puedes añadir tu propio crédito y le pediremos que lo confirme, o sugerir un cambio y le llegará.</p>
          <div className="actions">
            <Link href="/panel/ficha" className="btn btn-primary">Añadir mi crédito</Link>
            <SugerirCambio tipo="obra" refId={obra!.id} nombre={obra!.titulo} />
          </div>
          <PedirGestion obra={obra!} user={user} personaId={yo?.id} />
        </main>
      </>
    );
  }

  const set = (k: keyof typeof f, v: (typeof f)[keyof typeof f]) => setF((x) => ({ ...x, [k]: v }));

  function anadir(p?: SearchItem) {
    const nombre = (p?.n ?? q).trim();
    if (!nombre) return;
    const esYo = Boolean(p && yo && p.id === yo.id);
    setEquipo((e) => [...e, { key: crypto.randomUUID(), personaId: p?.id, nombre, img: p?.img, dep, titulo: dep === "Interpretación" ? personaje.trim() : "", estado: esYo ? "tu" : p ? "enlazado" : "nuevo" }]);
    setQ("");
    setPersonaje("");
  }

  function quitar(m: Miembro) {
    setEquipo((e) => e.filter((x) => x.key !== m.key));
    if (m.creditoId) setBorrados((b) => [...b, m.creditoId!]);
  }

  async function publicar() {
    if (!f.titulo.trim()) { setPaso(0); return setError("La obra necesita un título."); }
    setEstado("saving");
    setError("");
    try {
      const datos = {
        titulo: f.titulo.trim().slice(0, 200),
        sinopsis: f.sinopsis.trim().slice(0, 3000),
        anoinicio: f.anoinicio.trim().slice(0, 4),
        anofin: f.activa ? 0 : f.anofin.trim().slice(0, 4),
        cartel: f.cartel,
        instagram: f.instagram.trim().slice(0, 100),
        trailer: f.trailer.trim().slice(0, 500),
        categoria: f.categoria.slice(0, 5),
        idioma: f.idioma.slice(0, 40),
        claves: clavesDe(f.titulo),
        fotos_obra: f.fotos.slice(0, 5),
        ...(f.duracion ? { duracion: Math.min(600, Number(f.duracion) || 0) } : {}),
      };
      let obraId = id;
      if (nueva) obraId = (await addDoc(collection(db, "obra"), { ...datos, creacion: user.uid, creado: serverTimestamp() })).id;
      // Las fotos de la web antigua (fotosObra) pasan al campo nuevo
      else {
        // Antes de cambiarla, se guarda cómo estaba (historial con «Recuperar»)
        await guardarVersion("obra", id, obra as unknown as Record<string, unknown>, datos).catch(() => {});
        await updateDoc(doc(db, "obra", id), { ...datos, ...(obra && "fotosObra" in obra ? { fotosObra: deleteField() } : {}) });
      }

      for (const cid of borrados) await deleteDoc(doc(db, "persona_obra", cid));
      const personasTocadas: string[] = [];
      for (const m of equipo.filter((x) => !x.creditoId)) {
        const personaId = m.personaId ?? (await crearPersonaSinCuenta(m.nombre));
        personasTocadas.push(personaId);
        await anadirCredito({ id_obra: obraId, id_persona: personaId, puesto: m.dep, titulo: m.titulo || m.dep, fecha_inicio: f.anoinicio, fecha_fin: f.activa ? "" : f.anofin }, m.estado === "tu");
      }
      await authFetch("/api/revalidar", { obras: [obraId], personas: personasTocadas }).catch(() => {});
      router.push(`/obra/${obraId}`);
    } catch {
      setEstado("error");
      setError("No se pudo publicar. Revisa los datos e inténtalo de nuevo.");
    }
  }

  const grupos = DEPARTAMENTOS.concat(["Equipo"]).map((d) => ({ d, items: equipo.filter((m) => m.dep === d) })).filter((g) => g.items.length);
  const otros = equipo.filter((m) => !DEPARTAMENTOS.includes(m.dep) && m.dep !== "Equipo");
  if (otros.length) grupos.push({ d: "Otros", items: otros });

  return (
    <>
      <PanelNav personaId={yo?.id} />
      <div className="wrap row section" style={{ alignItems: "flex-start", gap: 40 }}>
        <nav aria-label="Pasos" className="pasos" style={{ flex: "0 1 220px", minWidth: 200 }}>
          <ol className="steps">
            {PASOS.map((p, i) => (
              <li key={p.l}>
                <button type="button" className={`step ${i < paso ? "done" : ""}`} aria-current={i === paso ? "step" : undefined} onClick={() => setPaso(i)}>
                  <span className="step-dot">{i < paso ? "✓" : i + 1}</span>
                  <span><strong style={{ display: "block" }}>{p.l}</strong><span className="hint">{p.d}</span></span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <main className="main-col">
          {paso === 0 ? (
            <div className="stack" style={{ gap: 20 }}>
              <h1 className="h2" style={{ fontSize: 40 }}>{nueva ? "Nueva ficha de obra" : "Editar obra"}</h1>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
                <ImageUpload value={f.cartel} onChange={(u) => set("cartel", u)} tipo="cartel" label="Subir cartel" />
                <div className="stack" style={{ flex: "1 1 320px" }}>
                  <div className="field">
                    <label className="label" htmlFor="titulo">Título</label>
                    <input id="titulo" className="input serif" style={{ fontSize: 22, height: 56 }} value={f.titulo} onChange={(e) => set("titulo", e.target.value)} maxLength={200} required />
                    <TituloDuplicado titulo={f.titulo} actual={id} />
                  </div>
                  <div className="form-grid">
                    <div className="field"><label className="label" htmlFor="ini">Año de estreno</label><input id="ini" className="input" inputMode="numeric" maxLength={4} value={f.anoinicio} onChange={(e) => set("anoinicio", e.target.value)} /></div>
                    <div className="field">
                      <label className="label" htmlFor="fin">Último año</label>
                      <input id="fin" className="input" inputMode="numeric" maxLength={4} value={f.activa ? "" : f.anofin} disabled={f.activa} onChange={(e) => set("anofin", e.target.value)} placeholder={f.activa ? "Sigue en activo" : ""} />
                      <label className="hint" style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={f.activa} onChange={(e) => set("activa", e.target.checked)} /> Sigue en activo</label>
                    </div>
                    <div className="field"><label className="label" htmlFor="dur">Duración (min)</label><input id="dur" className="input" inputMode="numeric" maxLength={3} value={f.duracion} onChange={(e) => set("duracion", e.target.value)} /></div>
                  </div>
                </div>
              </div>
              <div>
                <p className="label" style={{ margin: "0 0 10px" }}>Género <span className="muted" style={{ fontWeight: 400 }}>(hasta 5)</span></p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[...new Set([...GENEROS, ...f.categoria])].map((g) => {
                    const on = f.categoria.includes(g);
                    return <button key={g} type="button" className="chip" aria-pressed={on} onClick={() => set("categoria", on ? f.categoria.filter((x) => x !== g) : f.categoria.length >= 5 ? f.categoria : [...f.categoria, g])}>{g}</button>;
                  })}
                </div>
              </div>
              <div className="field"><label className="label" htmlFor="sin">Sinopsis</label><textarea id="sin" className="textarea" rows={4} maxLength={3000} value={f.sinopsis} onChange={(e) => set("sinopsis", e.target.value)} placeholder="Dos o tres frases que inviten a verla." /></div>
              <div className="form-grid">
                <div className="field"><label className="label" htmlFor="ig">Instagram de la obra</label><input id="ig" className="input" placeholder="@obra" maxLength={100} value={f.instagram} onChange={(e) => set("instagram", e.target.value)} /></div>
                <div className="field"><label className="label" htmlFor="tr">Tráiler (YouTube)</label><input id="tr" className="input" type="url" maxLength={500} value={f.trailer} onChange={(e) => set("trailer", e.target.value)} /></div>
                <div className="field"><label className="label" htmlFor="idi">Idioma</label><input id="idi" className="input" maxLength={40} value={f.idioma} onChange={(e) => set("idioma", e.target.value)} /></div>
              </div>
              <div className="field">
                <span className="label">Galería de imágenes</span>
                <GaleriaUpload value={f.fotos} onChange={(urls) => set("fotos", urls)} />
              </div>
              {!nueva ? (
                <Historial tipo="obra" refId={id} onRecuperar={(a) => {
                  const fin = String(a.anofin ?? "");
                  setF((x) => ({
                    ...x,
                    titulo: String(a.titulo ?? x.titulo), sinopsis: String(a.sinopsis ?? ""), anoinicio: String(a.anoinicio ?? ""),
                    anofin: fin === "0" ? "" : fin, activa: !fin || fin === "0", cartel: String(a.cartel ?? ""), instagram: String(a.instagram ?? ""),
                    trailer: String(a.trailer ?? ""), categoria: Array.isArray(a.categoria) ? (a.categoria as string[]) : [], idioma: String(a.idioma ?? "Castellano"),
                    duracion: a.duracion ? String(a.duracion) : "", fotos: fotosDe(a as { fotos_obra?: string[]; fotosObra?: string[] }),
                  }));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }} />
              ) : null}
            </div>
          ) : null}

          {paso === 1 ? (
            <div className="stack" style={{ gap: 20 }}>
              <h1 className="h2" style={{ fontSize: 40 }}>Elenco y equipo</h1>
              <p className="soft" style={{ margin: 0 }}>Escribe un nombre. Si la persona ya está en Ziater, queda enlazada a su ficha y recibe un aviso. Si no, le creamos una ficha que podrá reclamar.</p>
              <div className="panel panel-foco">
                <p className="label" style={{ margin: "0 0 10px" }}>Añadir a</p>
                <div role="group" aria-label="Departamento" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  {DEPARTAMENTOS.map((d) => <button key={d} type="button" className="chip" aria-pressed={dep === d} onClick={() => setDep(d)}>{d}</button>)}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); anadir(sugerencias[0] && sugerencias[0].n.toLowerCase() === q.trim().toLowerCase() ? sugerencias[0] : undefined); }} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <label className="sr-only" htmlFor="who">Nombre</label>
                  <input id="who" type="search" className="input" style={{ flex: "2 1 240px", background: "var(--sala)" }} placeholder="Nombre de la persona…" value={q} onChange={(e) => setQ(e.target.value)} maxLength={120} autoComplete="off" />
                  {dep === "Interpretación" ? <><label className="sr-only" htmlFor="pj">Personaje</label><input id="pj" className="input" style={{ flex: "1 1 160px", background: "var(--sala)" }} placeholder="Personaje" value={personaje} onChange={(e) => setPersonaje(e.target.value)} maxLength={150} /></> : null}
                </form>
                {q.trim() ? (
                  <div className="suggest">
                    {sugerencias.map((p) => (
                      <button key={p.id} type="button" className="suggest-item" onClick={() => anadir(p)}>
                        {p.img ? <img src={p.img} alt="" className="thumb thumb-round" /> : <span className="thumb thumb-round" />}
                        <span style={{ flex: 1 }}><strong style={{ display: "block" }}>{p.n}</strong><span className="hint">{p.s || "Ficha en Ziater"}</span></span>
                        <span style={{ color: "var(--foco)", fontWeight: 600, fontSize: 14 }}>Enlazar</span>
                      </button>
                    ))}
                    <button type="button" className="suggest-item" onClick={() => anadir()}>
                      <span className="thumb thumb-round" style={{ border: "1px dashed var(--linea-3)", background: "transparent" }} />
                      <span><strong style={{ display: "block" }}>Añadir «{q.trim()}» sin ficha</strong><span className="hint">Le crearemos una ficha que podrá reclamar</span></span>
                    </button>
                  </div>
                ) : null}
              </div>

              {grupos.map((g) => (
                <div key={g.d}>
                  <h2 className="eyebrow" style={{ color: "var(--texto-3)", marginBottom: 6 }}>{g.d} · {g.items.length}</h2>
                  {g.items.map((m) => (
                    <div key={m.key} className="member">
                      <span style={{ width: 44, height: 66, borderRadius: 4, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", background: m.img ? `center/cover url(${JSON.stringify(m.img)})` : colorCartel(m.key), border: m.estado === "nuevo" ? "1px dashed var(--texto-4)" : 0 }} aria-hidden="true">{m.img ? "" : iniciales(m.nombre)}</span>
                      <span className="who"><strong style={{ display: "block" }}>{m.nombre}</strong>{m.titulo ? <span className="hint">{m.titulo}</span> : null}</span>
                      <span className={`chip ${m.estado === "tu" ? "chip-foco" : m.estado === "enlazado" ? "chip-ok" : ""}`}>{m.estado === "tu" ? "Eres tú" : m.estado === "enlazado" ? (m.creditoId ? "✓ Enlazado" : "✓ Enlazado · recibirá aviso") : "Ficha nueva · podrá reclamarla"}</span>
                      <button type="button" className="btn btn-ghost" aria-label={`Quitar a ${m.nombre}`} onClick={() => quitar(m)}>✕</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : null}

          {paso === 2 ? (
            <div className="stack">
              <h1 className="h2" style={{ fontSize: 40 }}>Revisar y publicar</h1>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }} className="stack">
                <li className="panel"><strong>La ficha de «{f.titulo || "sin título"}» será pública al momento</strong><span className="hint" style={{ display: "block" }}>Y aparecerá en Google en los próximos días.</span></li>
                <li className="panel"><strong>{equipo.filter((m) => m.estado === "enlazado" && !m.creditoId).length} personas con ficha quedarán enlazadas</strong><span className="hint" style={{ display: "block" }}>La obra se añade a su trayectoria y pueden confirmarlo en su bandeja de vínculos.</span></li>
                <li className="panel"><strong>{equipo.filter((m) => m.estado === "nuevo").length} fichas nuevas</strong><span className="hint" style={{ display: "block" }}>Podrás compartirles un enlace para que las reclamen desde «Vínculos».</span></li>
              </ul>
              {error ? <p className="error" role="alert">{error}</p> : null}
            </div>
          ) : null}

          {error && paso !== 2 ? <p className="error" role="alert">{error}</p> : null}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 36, paddingTop: 24, borderTop: "1px solid var(--linea)" }}>
            <button type="button" className="btn" onClick={() => setPaso((p) => Math.max(0, p - 1))} disabled={paso === 0}>← Anterior</button>
            {paso < 2 ? (
              <button type="button" className="btn btn-primary btn-lg" onClick={() => { if (paso === 0 && !f.titulo.trim()) return setError("La obra necesita un título."); setError(""); setPaso(paso + 1); }}>Siguiente →</button>
            ) : (
              <button type="button" className="btn btn-primary btn-lg" onClick={publicar} disabled={estado === "saving"}>{estado === "saving" ? "Publicando…" : nueva ? "Publicar ficha" : "Guardar cambios"}</button>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

function TituloDuplicado({ titulo, actual }: { titulo: string; actual: string }) {
  const t = titulo.trim().toLowerCase();
  const { items } = useBusqueda(t.length >= 3 ? titulo : "", ["obra"]);
  if (t.length < 3) return null;
  const iguales = items.filter((i) => i.id !== actual && i.n.trim().toLowerCase() === t);
  if (!iguales.length) return <span className="ok">✓ No hay otra ficha con este título.</span>;
  return (
    <span className="hint" style={{ color: "var(--foco)" }}>
      Ya existe una ficha con este título: <Link href={`/obra/${iguales[0].id}`} target="_blank" style={{ textDecoration: "underline" }}>ver «{iguales[0].n}»</Link>. Si es la misma obra, añade tu crédito allí en lugar de crear otra.
    </span>
  );
}

/** Obras sin dueño activo: quien tiene un crédito confirmado o la compañía puede pedir gestionarla. */
function PedirGestion({ obra, user, personaId }: { obra: Obra; user: User; personaId?: string }) {
  const [vinculo, setVinculo] = useState<Awaited<ReturnType<typeof vinculoConObra>> | undefined>(undefined);
  const [motivo, setMotivo] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");

  useEffect(() => { vinculoConObra(user.uid, obra, personaId).then(setVinculo).catch(() => setVinculo(null)); }, [user.uid, obra, personaId]);

  if (vinculo === undefined) return null;
  return (
    <section className="panel" style={{ marginTop: 32 }}>
      <h2 className="eyebrow">¿Quien creó la ficha ya no la gestiona?</h2>
      {!vinculo ? (
        <p className="soft" style={{ margin: 0 }}>Pueden pedir gestionarla las personas con un crédito confirmado en la obra o la compañía que la produce. Si es tu caso, confirma primero tu crédito desde tu ficha de artista.</p>
      ) : estado === "ok" ? (
        <p className="soft" style={{ margin: 0 }}>Solicitud enviada. El equipo de Ziater la revisará y, si todo encaja, podrás editar la obra desde aquí.</p>
      ) : (
        <form className="stack" style={{ gap: 12 }} onSubmit={async (e) => {
          e.preventDefault();
          setEstado("enviando");
          try { await pedirGestionarObra(obra.id, vinculo, motivo); setEstado("ok"); } catch { setEstado("error"); }
        }}>
          <p className="soft" style={{ margin: 0 }}>
            Como {vinculo.via === "reparto" ? "parte del reparto o del equipo confirmado" : "dueño de la compañía que la produce"}, puedes pedir encargarte de esta ficha para mantenerla al día.
          </p>
          <div className="field">
            <label className="label" htmlFor="motivo">Cuéntanos por qué (opcional)</label>
            <textarea id="motivo" className="textarea" rows={3} maxLength={1000} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Por ejemplo: soy la directora y quien la creó ya no usa Ziater." />
          </div>
          {estado === "error" ? <p className="error" role="alert" style={{ margin: 0 }}>No se pudo enviar. Puede que ya tengas una solicitud pendiente.</p> : null}
          <div><button type="submit" className="btn btn-primary" disabled={estado === "enviando"}>{estado === "enviando" ? "Enviando…" : "Pedir gestionar esta obra"}</button></div>
        </form>
      )}
    </section>
  );
}
