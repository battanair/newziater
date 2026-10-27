"use client";

import Link from "next/link";
import { Suspense, use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { addDoc, collection, deleteDoc, deleteField, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase-client";
import { RequireAuth } from "@/components/RequireAuth";
import { PanelNav } from "@/components/PanelNav";
import { GaleriaUpload, ImageUpload } from "@/components/ImageUpload";
import { authFetch } from "@/components/AuthProvider";
import { useBusqueda } from "@/components/SearchBox";
import { clavesDe, normalizar } from "@/lib/claves";
import { anadirCredito, creditosDe, crearPersonaSinCuenta, leer, miPersona } from "@/lib/client-data";
import { DEPARTAMENTOS, GENEROS, colorCartel, fotosDe, iniciales, mesActual, tramo } from "@/lib/format";
import type { Funcion, Obra, Persona, SearchItem } from "@/lib/types";
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
  desde?: string; // "AAAA-MM"; vacío = desde el estreno
  hasta?: string; // "AAAA-MM"; vacío = sigue
  cambiado?: boolean; // crédito ya guardado cuyas fechas hay que actualizar
};

const PASOS = [
  { l: "Lo básico", d: "Título, género, imágenes" },
  { l: "Elenco y equipo", d: "Enlaza a las personas" },
  { l: "Publicar", d: "Revisa y envía" },
];

function Editor({ id, user }: { id: string; user: User }) {
  const sp = useSearchParams();
  const nueva = id === "nueva";
  const [cargando, setCargando] = useState(!nueva);
  const [obra, setObra] = useState<Obra | null>(null);
  const [yo, setYo] = useState<Persona | null>(null);
  const [paso, setPaso] = useState(0);
  const [f, setF] = useState({ titulo: sp.get("titulo")?.slice(0, 200) ?? "", sinopsis: "", anoinicio: "", anofin: "", activa: true, cartel: "", instagram: "", trailer: "", categoria: [] as string[], duracion: "", idioma: "Castellano", fotos: [] as string[], funciones: [] as Funcion[] });
  const [equipo, setEquipo] = useState<Miembro[]>([]);
  const [borrados, setBorrados] = useState<string[]>([]);
  const [dep, setDep] = useState("Interpretación");
  const [q, setQ] = useState("");
  const [personaje, setPersonaje] = useState("");
  const [dudosas, setDudosas] = useState<SearchItem[] | null>(null);
  // Relevos: quién entra en lugar de quién, quién deja la obra y si alguien se incorpora tarde
  const [incorpora, setIncorpora] = useState(""); // "" = desde el estreno
  const [relevo, setRelevo] = useState<{ key: string; q: string; desde: string } | null>(null);
  const [salida, setSalida] = useState<{ key: string; hasta: string } | null>(null);
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
        setF({ titulo: o.titulo, sinopsis: o.sinopsis ?? "", anoinicio: String(o.anoinicio ?? ""), anofin: fin === "0" ? "" : fin, activa: !fin || fin === "0", cartel: o.cartel ?? "", instagram: o.instagram ?? "", trailer: o.trailer ?? "", categoria: (o.categoria ?? []).filter(Boolean), duracion: o.duracion ? String(o.duracion) : "", idioma: o.idioma ?? "Castellano", fotos: fotosDe(o), funciones: o.funciones ?? [] });
        const cs = await creditosDe("id_obra", id);
        const ps = await Promise.all(cs.map((c) => leer<Persona>("persona", c.id_persona)));
        setEquipo(cs.map((c, i) => ({ key: c.id, creditoId: c.id, personaId: c.id_persona, nombre: ps[i] ? `${ps[i]!.Nombre} ${ps[i]!.Apellidos ?? ""}`.trim() : "Ficha eliminada", img: ps[i]?.foto, dep: c.puesto || "Equipo", titulo: c.titulo ?? "", estado: c.id_persona === user.uid || ps[i]?.coincide === user.uid ? "tu" : "enlazado", desde: c.desde ?? "", hasta: c.hasta ?? "" })));
      }
      setCargando(false);
    })();
  }, [id, nueva, user.uid]);

  const esDuena = nueva || obra?.creacion === user.uid;
  const { items: sugerencias } = useBusqueda(q, ["persona"]);
  const { items: sugRelevo } = useBusqueda(relevo?.q ?? "", ["persona"]);

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

  /** Antes de crear una ficha nueva, avisa si ya hay alguien con un nombre parecido. */
  function anadirNueva() {
    const parecidas = sugerencias.filter((s) => nombresParecidos(s.n, q));
    if (parecidas.length) return setDudosas(parecidas);
    anadir();
  }

  function anadir(p?: SearchItem) {
    const nombre = (p?.n ?? q).trim();
    if (!nombre) return;
    setDudosas(null);
    if (p && equipo.some((m) => m.personaId === p.id && m.dep === dep)) { setQ(""); return; } // ya estaba en ese departamento
    const esYo = Boolean(p && yo && p.id === yo.id);
    setEquipo((e) => [...e, { key: crypto.randomUUID(), personaId: p?.id, nombre, img: p?.img, dep, titulo: dep === "Interpretación" ? personaje.trim() : "", estado: esYo ? "tu" : p ? "enlazado" : "nuevo", desde: nueva ? "" : incorpora }]);
    setQ("");
    setPersonaje("");
  }

  /** Cambia las fechas de un miembro (si ya estaba guardado, se actualizará al publicar). */
  function fechas(key: string, cambios: Partial<Pick<Miembro, "desde" | "hasta">>) {
    setEquipo((e) => e.map((x) => (x.key === key ? { ...x, ...cambios, cambiado: Boolean(x.creditoId) } : x)));
  }

  /** Relevo: quien estaba sale ese mes y entra otra persona con el mismo puesto y personaje. */
  function hacerRelevo(m: Miembro, p?: SearchItem) {
    if (!relevo) return;
    const nombre = (p?.n ?? relevo.q).trim();
    if (!nombre || !relevo.desde) return;
    const esYo = Boolean(p && yo && p.id === yo.id);
    setEquipo((e) => {
      const sin = e.map((x) => (x.key === m.key ? { ...x, hasta: relevo.desde, cambiado: Boolean(x.creditoId) } : x));
      const i = sin.findIndex((x) => x.key === m.key);
      const nuevo: Miembro = { key: crypto.randomUUID(), personaId: p?.id, nombre, img: p?.img, dep: m.dep, titulo: m.titulo, estado: esYo ? "tu" : p ? "enlazado" : "nuevo", desde: relevo.desde };
      return [...sin.slice(0, i), nuevo, ...sin.slice(i)];
    });
    setRelevo(null);
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
        ...limpiarFunciones(f.funciones),
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
      // Una misma persona nueva puede tener varios puestos (dirige, escribe y actúa):
      // se crea una sola ficha por nombre y todos sus créditos apuntan a ella.
      const nuevas = new Map<string, string>();
      const normal = (n: string) => n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
      for (const m of equipo.filter((x) => x.creditoId && x.cambiado)) {
        await updateDoc(doc(db, "persona_obra", m.creditoId!), { desde: (m.desde ?? "").slice(0, 7), hasta: (m.hasta ?? "").slice(0, 7) });
        if (m.personaId) personasTocadas.push(m.personaId);
      }
      for (const m of equipo.filter((x) => !x.creditoId)) {
        const k = normal(m.nombre);
        const personaId: string = m.personaId ?? nuevas.get(k) ?? (await crearPersonaSinCuenta(m.nombre));
        if (!m.personaId) nuevas.set(k, personaId);
        personasTocadas.push(personaId);
        await anadirCredito({ id_obra: obraId, id_persona: personaId, puesto: m.dep, titulo: m.titulo || m.dep, fecha_inicio: f.anoinicio, fecha_fin: f.activa ? "" : f.anofin, desde: m.desde, hasta: m.hasta }, m.estado === "tu");
      }
      await authFetch("/api/revalidar", { obras: [obraId], personas: personasTocadas }).catch(() => {});
      // Carga completa (no navegación interna): así se ve la ficha recién guardada y no la que el navegador tenía en caché
      window.location.assign(`/obra/${obraId}`);
    } catch {
      setEstado("error");
      setError("No se pudo publicar. Revisa los datos e inténtalo de nuevo.");
    }
  }

  const hayRelevos = equipo.some((m) => m.desde || m.hasta);
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
              <div className="field">
                <span className="label">Dónde verla</span>
                <FuncionesEditor value={f.funciones} onChange={(v) => set("funciones", v)} />
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
                    funciones: Array.isArray(a.funciones) ? (a.funciones as Funcion[]) : [],
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
                <form onSubmit={(e) => { e.preventDefault(); if (sugerencias[0] && normalizar(sugerencias[0].n) === normalizar(q)) anadir(sugerencias[0]); else anadirNueva(); }} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <label className="sr-only" htmlFor="who">Nombre</label>
                  <input id="who" type="search" className="input" style={{ flex: "2 1 240px", background: "var(--sala)" }} placeholder="Nombre de la persona…" value={q} onChange={(e) => setQ(e.target.value)} maxLength={120} autoComplete="off" />
                  {dep === "Interpretación" ? <><label className="sr-only" htmlFor="pj">Personaje</label><input id="pj" className="input" style={{ flex: "1 1 160px", background: "var(--sala)" }} placeholder="Personaje" value={personaje} onChange={(e) => setPersonaje(e.target.value)} maxLength={150} /></> : null}
                  <button type="submit" hidden aria-hidden="true" tabIndex={-1} />{/* Enter añade a la persona */}
                </form>
                {!nueva ? (
                  <div role="group" aria-label="Desde cuándo" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 10 }}>
                    <button type="button" className="chip" aria-pressed={!incorpora} onClick={() => setIncorpora("")}>Desde el estreno</button>
                    <button type="button" className="chip" aria-pressed={Boolean(incorpora)} onClick={() => setIncorpora(incorpora || mesActual())}>Se incorpora más tarde</button>
                    {incorpora ? <><label className="sr-only" htmlFor="inc">Mes en que se incorpora</label><input id="inc" type="month" className="input" style={{ width: "auto", minHeight: 36, background: "var(--sala)" }} value={incorpora} max={mesActual()} onChange={(e) => setIncorpora(e.target.value)} /></> : null}
                  </div>
                ) : null}
                {dudosas ? (
                  <div className="panel panel-foco" role="alert" style={{ marginTop: 10 }}>
                    <strong style={{ display: "block", marginBottom: 6 }}>¿Es alguna de estas personas?</strong>
                    <p className="hint" style={{ margin: "0 0 10px" }}>Ya hay fichas con un nombre parecido a «{q.trim()}». Enlazar la existente evita duplicados y su trayectoria queda completa.</p>
                    <div className="stack" style={{ gap: 6 }}>
                      {dudosas.map((p) => (
                        <button key={p.id} type="button" className="suggest-item" style={{ borderRadius: 10 }} onClick={() => anadir(p)}>
                          {p.img ? <img src={p.img} alt="" className="thumb thumb-round" /> : <span className="thumb thumb-round" />}
                          <span style={{ flex: 1 }}><strong style={{ display: "block" }}>{p.n}</strong><span className="hint">{p.s || "Ficha en Ziater"}</span></span>
                          <span style={{ color: "var(--foco)", fontWeight: 600, fontSize: 14 }}>Sí, es esta</span>
                        </button>
                      ))}
                    </div>
                    <div className="actions" style={{ marginTop: 10 }}>
                      <button type="button" className="btn btn-ghost" onClick={() => setDudosas(null)}>Cancelar</button>
                      <button type="button" className="btn" onClick={() => anadir()}>No, es otra persona: crear ficha nueva</button>
                    </div>
                  </div>
                ) : null}
                {q.trim() && !dudosas ? (
                  <div className="suggest">
                    {sugerencias.map((p) => (
                      <button key={p.id} type="button" className="suggest-item" onClick={() => anadir(p)}>
                        {p.img ? <img src={p.img} alt="" className="thumb thumb-round" /> : <span className="thumb thumb-round" />}
                        <span style={{ flex: 1 }}><strong style={{ display: "block" }}>{p.n}</strong><span className="hint">{p.s || "Ficha en Ziater"}</span></span>
                        <span style={{ color: "var(--foco)", fontWeight: 600, fontSize: 14 }}>Enlazar</span>
                      </button>
                    ))}
                    <button type="button" className="suggest-item" onClick={anadirNueva}>
                      <span className="thumb thumb-round" style={{ border: "1px dashed var(--linea-3)", background: "transparent" }} />
                      <span><strong style={{ display: "block" }}>Añadir «{q.trim()}» sin ficha</strong><span className="hint">Le crearemos una ficha que podrá reclamar</span></span>
                    </button>
                  </div>
                ) : null}
              </div>

              {grupos.map((g) => (
                <div key={g.d}>
                  <h2 className="eyebrow" style={{ color: "var(--texto-3)", marginBottom: 6 }}>{g.d} · {g.items.length}</h2>
                  {g.items.map((m) => {
                    const t = tramo(m, hayRelevos);
                    const sub = [m.titulo && m.titulo !== m.dep ? m.titulo : "", t].filter(Boolean).join(" · ");
                    return (
                    <div key={m.key}>
                    <div className="member" style={m.hasta ? { opacity: 0.72 } : undefined}>
                      <span style={{ width: 44, height: 66, borderRadius: 4, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", background: m.img ? `center/cover url(${JSON.stringify(m.img)})` : colorCartel(m.key), border: m.estado === "nuevo" ? "1px dashed var(--texto-4)" : 0 }} aria-hidden="true">{m.img ? "" : iniciales(m.nombre)}</span>
                      <span className="who"><strong style={{ display: "block" }}>{m.nombre}</strong>{sub ? <span className="hint">{sub}</span> : null}</span>
                      <span className={`chip ${m.estado === "tu" ? "chip-foco" : m.estado === "enlazado" ? "chip-ok" : ""}`}>{m.estado === "tu" ? "Eres tú" : m.estado === "enlazado" ? (m.creditoId ? "✓ Enlazado" : "✓ Enlazado · recibirá aviso") : "Ficha nueva · podrá reclamarla"}</span>
                      <span style={{ display: "inline-flex", gap: 4 }}>
                        {!m.hasta ? <button type="button" className="btn" aria-expanded={relevo?.key === m.key} onClick={() => { setSalida(null); setRelevo(relevo?.key === m.key ? null : { key: m.key, q: "", desde: mesActual() }); }}>⇄ Sustituir</button> : null}
                        <details className="menu-mini">
                          <summary className="btn btn-ghost" aria-label={`Más opciones para ${m.nombre}`}>⋯</summary>
                          <div className="menu-mini-caja">
                            {m.hasta
                              ? <button type="button" onClick={(e) => { fechas(m.key, { hasta: "" }); (e.currentTarget.closest("details") as HTMLDetailsElement).open = false; }}>Sigue en la obra</button>
                              : <button type="button" onClick={(e) => { setRelevo(null); setSalida({ key: m.key, hasta: mesActual() }); (e.currentTarget.closest("details") as HTMLDetailsElement).open = false; }}>Ha dejado la obra</button>}
                            <button type="button" onClick={(e) => { (e.currentTarget.closest("details") as HTMLDetailsElement).open = false; quitar(m); }}>Quitar de la ficha</button>
                          </div>
                        </details>
                      </span>
                    </div>
                    {relevo?.key === m.key ? (
                      <div className="panel panel-foco" style={{ margin: "0 0 12px" }}>
                        <strong style={{ display: "block", marginBottom: 10 }}>¿Quién entra {m.dep === "Interpretación" && m.titulo ? `como ${m.titulo}` : `en ${m.dep.toLowerCase()}`} en lugar de {m.nombre}?</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                          <label className="sr-only" htmlFor={`rq-${m.key}`}>Persona que entra</label>
                          <input id={`rq-${m.key}`} type="search" className="input" autoFocus style={{ flex: "2 1 220px", background: "var(--sala)" }} placeholder="Nombre de la persona…" value={relevo.q} maxLength={120} autoComplete="off" onChange={(e) => setRelevo({ ...relevo, q: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const exacta = sugRelevo.find((p) => normalizar(p.n) === normalizar(relevo.q)); hacerRelevo(m, exacta); } }} />
                          <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span className="hint">Desde</span><input type="month" className="input" style={{ width: "auto", background: "var(--sala)" }} value={relevo.desde} max={mesActual()} onChange={(e) => setRelevo({ ...relevo, desde: e.target.value })} /></label>
                        </div>
                        {relevo.q.trim() ? (
                          <div className="suggest" style={{ position: "static", marginTop: 8 }}>
                            {sugRelevo.slice(0, 5).map((p) => (
                              <button key={p.id} type="button" className="suggest-item" onClick={() => hacerRelevo(m, p)}>
                                {p.img ? <img src={p.img} alt="" className="thumb thumb-round" /> : <span className="thumb thumb-round" />}
                                <span style={{ flex: 1 }}><strong style={{ display: "block" }}>{p.n}</strong><span className="hint">{p.s || "Ficha en Ziater"}</span></span>
                                <span style={{ color: "var(--foco)", fontWeight: 600, fontSize: 14 }}>Hacer el relevo</span>
                              </button>
                            ))}
                            <button type="button" className="suggest-item" onClick={() => hacerRelevo(m)}>
                              <span className="thumb thumb-round" style={{ border: "1px dashed var(--linea-3)", background: "transparent" }} />
                              <span><strong style={{ display: "block" }}>«{relevo.q.trim()}» sin ficha</strong><span className="hint">Le crearemos una ficha que podrá reclamar</span></span>
                            </button>
                          </div>
                        ) : <p className="hint" style={{ margin: "8px 0 0" }}>{m.nombre} seguirá en la ficha como parte del elenco anterior.</p>}
                        <div className="actions" style={{ marginTop: 10 }}><button type="button" className="btn btn-ghost" onClick={() => setRelevo(null)}>Cancelar</button></div>
                      </div>
                    ) : null}
                    {salida?.key === m.key ? (
                      <div className="panel panel-foco" style={{ margin: "0 0 12px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
                        <span style={{ flex: "1 1 200px" }}><strong>¿Cuándo dejó la obra {m.nombre}?</strong><span className="hint" style={{ display: "block" }}>Seguirá en la ficha, dentro del elenco anterior.</span></span>
                        <input type="month" className="input" aria-label="Mes en que dejó la obra" style={{ width: "auto", background: "var(--sala)" }} value={salida.hasta} max={mesActual()} onChange={(e) => setSalida({ ...salida, hasta: e.target.value })} />
                        <button type="button" className="btn btn-ghost" onClick={() => setSalida(null)}>Cancelar</button>
                        <button type="button" className="btn btn-primary" disabled={!salida.hasta} onClick={() => { fechas(m.key, { hasta: salida.hasta }); setSalida(null); }}>Guardar</button>
                      </div>
                    ) : null}
                    </div>
                    );
                  })}
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

/** Quita filas vacías, ordena por fecha y calcula «ultima» (para encontrar las obras en cartel). */
function limpiarFunciones(fs: Funcion[]) {
  const ok = fs
    .filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.fecha) && x.sala.trim())
    .map((x) => ({ fecha: x.fecha, hora: (x.hora ?? "").slice(0, 5), sala: x.sala.trim().slice(0, 120), ...(x.sala_id && /^[A-Za-z0-9_-]{1,128}$/.test(x.sala_id) ? { sala_id: x.sala_id } : {}), ciudad: (x.ciudad ?? "").trim().slice(0, 80), entradas: /^https?:\/\//.test(x.entradas ?? "") ? x.entradas!.trim().slice(0, 500) : "" }))
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
    .slice(0, 40);
  // salas_ids: para que cada sala encuentre las obras que han pasado por ella
  return { funciones: ok, ultima: ok.length ? ok[ok.length - 1].fecha : "", salas_ids: [...new Set(ok.map((x) => x.sala_id).filter((x): x is string => Boolean(x)))].slice(0, 40) };
}

/** Funciones de la obra: fecha, hora, sala, ciudad y enlace a entradas. */
function FuncionesEditor({ value, onChange }: { value: Funcion[]; onChange: (v: Funcion[]) => void }) {
  const cambiar = (i: number, k: keyof Funcion, v: string) => onChange(value.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const ultima = value[value.length - 1];
  return (
    <div className="stack" style={{ gap: 10 }}>
      {value.map((x, i) => (
        <div key={i} className="funcion-fila">
          <input className="input" type="date" aria-label="Fecha" value={x.fecha} onChange={(e) => cambiar(i, "fecha", e.target.value)} />
          <input className="input" type="time" aria-label="Hora" value={x.hora ?? ""} onChange={(e) => cambiar(i, "hora", e.target.value)} />
          <SalaInput f={x} onChange={(c) => onChange(value.map((y, j) => (j === i ? { ...y, ...c } : y)))} />
          <input className="input" aria-label="Ciudad" placeholder="Ciudad" maxLength={80} value={x.ciudad ?? ""} onChange={(e) => cambiar(i, "ciudad", e.target.value)} />
          <input className="input" type="url" aria-label="Enlace a entradas" placeholder="Enlace a entradas (opcional)" maxLength={500} value={x.entradas ?? ""} onChange={(e) => cambiar(i, "entradas", e.target.value)} />
          <button type="button" className="btn btn-ghost" aria-label={`Quitar función ${i + 1}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      {value.length < 40 ? (
        <div className="actions">
          <button type="button" className="btn" onClick={() => onChange([...value, { fecha: "", hora: ultima?.hora ?? "20:00", sala: ultima?.sala ?? "", ...(ultima?.sala_id ? { sala_id: ultima.sala_id } : {}), ciudad: ultima?.ciudad ?? "", entradas: ultima?.entradas ?? "" }])}>+ Añadir función</button>
        </div>
      ) : null}
      <span className="hint">Fecha, sala y ciudad de cada pase. Al añadir otra, se copian la sala y el enlace de la anterior. Las funciones pasadas se guardan como historial de la obra.</span>
    </div>
  );
}

/** Campo «Sala o teatro» que sugiere las salas dadas de alta en Ziater y las enlaza. */
function SalaInput({ f, onChange }: { f: Funcion; onChange: (c: Partial<Funcion>) => void }) {
  const [abierto, setAbierto] = useState(false);
  const { items } = useBusqueda(abierto && !f.sala_id ? f.sala : "", ["sala"]);
  return (
    <span style={{ position: "relative", display: "block", minWidth: 0 }}>
      <input
        className="input"
        aria-label="Sala o teatro"
        placeholder="Sala o teatro"
        maxLength={120}
        value={f.sala}
        style={f.sala_id ? { borderColor: "var(--foco-borde)", paddingRight: 34 } : undefined}
        onFocus={() => setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 200)}
        onChange={(e) => onChange({ sala: e.target.value, sala_id: undefined })}
      />
      {f.sala_id ? <span title="Enlazada a la ficha de la sala" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--foco)" }}>✓</span> : null}
      {abierto && !f.sala_id && f.sala.trim().length >= 2 ? (
        <span className="suggest" style={{ position: "absolute", left: 0, right: 0, top: "100%", zIndex: 30, display: "block", minWidth: 240 }}>
          {items.map((it) => (
            <button key={it.id} type="button" className="suggest-item" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange({ sala: it.n, sala_id: it.id, ciudad: it.s || f.ciudad }); setAbierto(false); }}>
              <span style={{ flex: 1 }}><strong style={{ display: "block" }}>{it.n}</strong><span className="hint">{it.s}</span></span>
              <span style={{ color: "var(--foco)", fontWeight: 600, fontSize: 13 }}>Enlazar</span>
            </button>
          ))}
          <a href="/panel/sala/nueva" target="_blank" rel="noopener" className="suggest-item" style={{ textDecoration: "none" }}>
            <span><strong style={{ display: "block" }}>{items.length ? "¿No está?" : "Esta sala aún no está en Ziater"}</strong><span className="hint">Puedes escribirla tal cual o darla de alta (se abre aparte)</span></span>
          </a>
        </span>
      ) : null}
    </span>
  );
}

/** ¿Dos nombres podrían ser la misma persona? (sin tildes ni mayúsculas; mismo nombre y apellido parecido, o casi iguales) */
function nombresParecidos(a: string, b: string) {
  const x = normalizar(a), y = normalizar(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const [xa, ...xr] = x.split(" "), [ya, ...yr] = y.split(" ");
  if (xa === ya && xr.length && yr.length && (xr[0].startsWith(yr[0].slice(0, 3)) || yr[0].startsWith(xr[0].slice(0, 3)))) return true;
  return distancia(x, y) <= Math.max(1, Math.floor(Math.min(x.length, y.length) / 6));
}
function distancia(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
