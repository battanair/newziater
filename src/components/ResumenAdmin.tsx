"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Timestamp, collection, documentId, getCountFromServer, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { porIds } from "@/lib/client-data";
import type { Obra } from "@/lib/types";

// Panel privado de administración: cifras, visitas y actividad reciente.
// Todo se lee con el permiso de administrador (las reglas no dejan a nadie más).

type Dia = { dia: string; total: number; visitantes: number; [seccion: string]: number | string };
type Evento = { cuando: number; texto: string; href?: string; tipo: string };

const SECCIONES: [string, string][] = [["inicio", "Portada"], ["obra", "Fichas de obra"], ["persona", "Fichas de artista"], ["compania", "Compañías"], ["listados", "Listados"], ["busqueda", "Búsqueda"], ["otras", "Otras"]];

const n = (x: number) => x.toLocaleString("es-ES");
const ts = (v: unknown): number => {
  const x = v as { toMillis?: () => number; seconds?: number } | null | undefined;
  return x?.toMillis ? x.toMillis() : x?.seconds ? x.seconds * 1000 : 0;
};
const hace = (ms: number) => {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 60) return `hace ${Math.max(1, m)} min`;
  if (m < 1440) return `hace ${Math.round(m / 60)} h`;
  return `hace ${Math.round(m / 1440)} d`;
};
function diaISO(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function ResumenAdmin({ pendientes }: { pendientes: { fichas: number; obras: number; sugerencias: number }; }) {
  const [datos, setDatos] = useState<{ totales: Record<string, number>; semana: Record<string, number>; dias: Dia[]; eventos: Evento[] } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try { localStorage.setItem("ziater-no-contar", "1"); } catch { /* sin almacenamiento */ }
    (async () => {
      const contar = async (col: string, ...c: Parameters<typeof where>[]) => {
        try { return (await getCountFromServer(query(collection(db, col), ...c.map((x) => where(...x))))).data().count; } catch { return -1; }
      };
      const hace7 = Timestamp.fromMillis(Date.now() - 7 * 864e5);
      const desde = diaISO(new Date(Date.now() - 29 * 864e5));
      const [obras, personas, companias, creditos, usuarios, notas, colaboradores, obras7, notas7, cambios7, sugs7] = await Promise.all([
        contar("obra"), contar("persona"), contar("productoras"), contar("persona_obra"), contar("users"), contar("valoraciones"), contar("colaboradores", ["publico", "==", true]),
        contar("obra", ["creado", ">=", hace7]), contar("valoraciones", ["fecha", ">=", hace7]), contar("historial", ["fecha", ">=", hace7]), contar("sugerencias", ["fecha", ">=", hace7]),
      ]);

      const visitas = await getDocs(query(collection(db, "estadisticas"), where(documentId(), ">=", desde))).catch(() => null);
      const porDia = new Map<string, Dia>((visitas?.docs ?? []).map((d): [string, Dia] => [d.id, { ...(d.data() as Omit<Dia, "dia">), dia: d.id } as Dia]));
      const dias: Dia[] = [];
      for (let i = 29; i >= 0; i--) {
        const id = diaISO(new Date(Date.now() - i * 864e5));
        dias.push(porDia.get(id) ?? { dia: id, total: 0, visitantes: 0 });
      }

      // Actividad reciente
      const ultimo = async (col: string, campo: string, k = 8) => (await getDocs(query(collection(db, col), orderBy(campo, "desc"), limit(k))).catch(() => null))?.docs ?? [];
      const [dObras, dNotas, dCambios, dSugs] = await Promise.all([ultimo("obra", "creado"), ultimo("valoraciones", "fecha"), ultimo("historial", "fecha"), ultimo("sugerencias", "fecha", 5)]);
      const titulos = new Map((await porIds<Obra>("obra", [...dNotas.map((d) => d.data().obra), ...dCambios.filter((d) => d.data().tipo === "obra").map((d) => d.data().ref)])).map((o) => [o.id, o.titulo]));
      const eventos: Evento[] = [
        ...dObras.map((d) => ({ cuando: ts(d.data().creado), tipo: "Obra nueva", texto: d.data().titulo, href: `/obra/${d.id}` })),
        ...dNotas.map((d) => ({ cuando: ts(d.data().fecha), tipo: "Nota", texto: `${d.data().nota}/10 a «${titulos.get(d.data().obra) ?? "una obra"}»`, href: `/obra/${d.data().obra}` })),
        ...dCambios.map((d) => ({ cuando: ts(d.data().fecha), tipo: "Edición", texto: `${d.data().tipo === "obra" ? `«${titulos.get(d.data().ref) ?? "Obra"}»` : "Ficha de artista"}: ${(d.data().cambios ?? []).join(", ")}`, href: `/${d.data().tipo}/${d.data().ref}` })),
        ...dSugs.map((d) => ({ cuando: ts(d.data().fecha), tipo: "Sugerencia", texto: `«${d.data().titulo_ficha}»: ${String(d.data().texto ?? "").slice(0, 80)}`, href: `/${d.data().tipo === "productora" ? "compania" : d.data().tipo}/${d.data().ref}` })),
      ].filter((e) => e.cuando).sort((a, b) => b.cuando - a.cuando).slice(0, 14);

      setDatos({ totales: { obras, personas, companias, creditos, usuarios, notas, colaboradores }, semana: { obras: obras7, notas: notas7, cambios: cambios7, sugerencias: sugs7 }, dias, eventos });
      if (!visitas) setError("Las visitas empezarán a verse cuando publiques las reglas nuevas de Firestore.");
    })();
  }, []);

  const v = useMemo(() => {
    if (!datos) return null;
    const ult7 = datos.dias.slice(-7), prev7 = datos.dias.slice(-14, -7);
    const suma = (ds: Dia[], k: string) => ds.reduce((s, d) => s + (Number(d[k]) || 0), 0);
    const secciones = SECCIONES.map(([k, l]) => ({ k, l, v: suma(datos.dias.slice(-7), k) })).filter((s) => s.v > 0).sort((a, b) => b.v - a.v);
    return { hoy: datos.dias[datos.dias.length - 1], v7: suma(ult7, "total"), p7: suma(prev7, "total"), u7: suma(ult7, "visitantes"), t30: suma(datos.dias, "total"), secciones };
  }, [datos]);

  if (!datos || !v) return <p className="muted">Cargando estadísticas…</p>;
  const delta = v.p7 ? Math.round(((v.v7 - v.p7) / v.p7) * 100) : null;

  return (
    <div className="stack" style={{ gap: 32 }}>
      {error ? <p className="hint" role="status">{error}</p> : null}

      <section>
        <h2 className="eyebrow" style={{ marginBottom: 12 }}>Visitas</h2>
        <div className="tiles">
          <Tile valor={n(Number(v.hoy.total) || 0)} etiqueta="Visitas hoy" nota={`${n(Number(v.hoy.visitantes) || 0)} visitantes`} />
          <Tile valor={n(v.v7)} etiqueta="Últimos 7 días" nota={delta === null ? "sin datos de la semana anterior" : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)} % frente a la semana anterior`} />
          <Tile valor={n(v.u7)} etiqueta="Visitantes (7 días)" nota="navegadores distintos por día" />
          <Tile valor={n(v.t30)} etiqueta="Últimos 30 días" />
        </div>
      </section>

      <section className="panel">
        <h2 className="h3" style={{ marginBottom: 4 }}>Visitas por día</h2>
        <p className="hint" style={{ margin: "0 0 16px" }}>Últimos 30 días · páginas vistas</p>
        <Columnas dias={datos.dias} />
      </section>

      <div className="row" style={{ gap: 24 }}>
        <section className="panel" style={{ flex: "1 1 320px" }}>
          <h2 className="h3" style={{ marginBottom: 4 }}>Qué se visita</h2>
          <p className="hint" style={{ margin: "0 0 16px" }}>Últimos 7 días, por sección</p>
          {v.secciones.length ? <Barras filas={v.secciones} /> : <p className="muted" style={{ margin: 0 }}>Aún no hay visitas registradas.</p>}
        </section>
        <section className="panel" style={{ flex: "1 1 320px" }}>
          <h2 className="h3" style={{ marginBottom: 12 }}>Te esperan</h2>
          <ul className="list">
            <Pend n={pendientes.fichas} l="Reclamaciones de fichas" />
            <Pend n={pendientes.obras} l="Solicitudes para gestionar obras" />
            <Pend n={pendientes.sugerencias} l="Sugerencias pendientes" />
          </ul>
          <p className="hint" style={{ margin: "12px 0 0" }}>Están en las pestañas de arriba.</p>
        </section>
      </div>

      <section>
        <h2 className="eyebrow" style={{ marginBottom: 12 }}>Contenido</h2>
        <div className="tiles">
          <Tile valor={n(datos.totales.obras)} etiqueta="Obras" nota={`+${n(datos.semana.obras)} esta semana`} />
          <Tile valor={n(datos.totales.personas)} etiqueta="Fichas de artista" />
          <Tile valor={n(datos.totales.companias)} etiqueta="Compañías" />
          <Tile valor={n(datos.totales.creditos)} etiqueta="Créditos" />
          <Tile valor={n(datos.totales.usuarios)} etiqueta="Cuentas" nota="usuarios registrados" />
          <Tile valor={n(datos.totales.notas)} etiqueta="Notas" nota={`+${n(datos.semana.notas)} esta semana`} />
          <Tile valor={n(datos.semana.cambios)} etiqueta="Ediciones (7 días)" />
          <Tile valor={n(datos.totales.colaboradores)} etiqueta="Colaboradores públicos" />
        </div>
      </section>

      <section className="panel">
        <h2 className="h3" style={{ marginBottom: 12 }}>Actividad reciente</h2>
        {datos.eventos.length ? (
          <ul className="list">
            {datos.eventos.map((e, i) => (
              <li key={i} style={{ display: "grid", gridTemplateColumns: "110px minmax(0, 1fr) auto", gap: 12, alignItems: "baseline", padding: "10px 0" }}>
                <span className="chip" style={{ justifySelf: "start" }}>{e.tipo}</span>
                {e.href ? <Link href={e.href} style={{ minWidth: 0, overflowWrap: "anywhere" }}>{e.texto}</Link> : <span>{e.texto}</span>}
                <span className="hint" style={{ whiteSpace: "nowrap" }}>{hace(e.cuando)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="muted" style={{ margin: 0 }}>Todavía no hay actividad.</p>}
      </section>

      <p className="hint">
        Para el detalle de visitas (de dónde llega la gente, países, dispositivos, páginas concretas) abre{" "}
        <a href="https://vercel.com/ziater/ziater/analytics" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>Analytics en Vercel</a>.
        Este panel no cuenta tus propias visitas.
      </p>
    </div>
  );
}

function Tile({ valor, etiqueta, nota }: { valor: string; etiqueta: string; nota?: string }) {
  return (
    <div className="tile">
      <span className="tile-et">{etiqueta}</span>
      <span className="tile-valor">{valor}</span>
      {nota ? <span className="tile-nota">{nota}</span> : null}
    </div>
  );
}

function Pend({ n: num, l }: { n: number; l: string }) {
  return (
    <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
      <span>{l}</span>
      <span className={`chip ${num ? "chip-foco" : ""}`}>{num}</span>
    </li>
  );
}

/** Columnas de visitas por día (una serie), con tooltip al pasar el ratón y tabla de datos. */
function Columnas({ dias }: { dias: Dia[] }) {
  const [activo, setActivo] = useState<number | null>(null);
  const max = Math.max(1, ...dias.map((d) => Number(d.total) || 0));
  const paso = Math.pow(10, Math.floor(Math.log10(max)));
  const tope = Math.ceil(max / paso) * paso;
  const W = 720, H = 200, izq = 36, abajo = 22, banda = (W - izq) / dias.length, ancho = Math.min(24, banda - 2);
  const y = (val: number) => (H - abajo) - (val / tope) * (H - abajo - 10);
  const fecha = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  const iMax = dias.reduce((m, d, i) => ((Number(d.total) || 0) > (Number(dias[m].total) || 0) ? i : m), 0);
  return (
    <div className="grafico">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Visitas por día en los últimos 30 días" style={{ width: "100%", height: "auto", display: "block" }} onMouseLeave={() => setActivo(null)}>
        {[0, tope / 2, tope].map((t) => (
          <g key={t}>
            <line x1={izq} x2={W} y1={y(t)} y2={y(t)} stroke="var(--linea)" strokeWidth={1} />
            <text x={izq - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--texto-3)">{t >= 1000 ? `${t / 1000}K` : t}</text>
          </g>
        ))}
        {dias.map((d, i) => {
          const val = Number(d.total) || 0, x = izq + i * banda + (banda - ancho) / 2, top = y(val), alto = (H - abajo) - top;
          return (
            <g key={d.dia} onMouseEnter={() => setActivo(i)}>
              <rect x={izq + i * banda} y={0} width={banda} height={H - abajo} fill="transparent" />
              {val > 0 ? <path d={`M${x},${H - abajo} V${top + Math.min(4, alto)} q0,-4 4,-4 h${ancho - 8} q4,0 4,4 V${H - abajo} Z`} fill="var(--dato)" opacity={activo === null || activo === i ? 1 : 0.45} /> : null}
              {i === iMax && val > 0 ? <text x={x + ancho / 2} y={top - 6} textAnchor="middle" fontSize="11" fill="var(--texto-2)">{n(val)}</text> : null}
              {i % 7 === 0 || i === dias.length - 1 ? <text x={x + ancho / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--texto-3)">{fecha(d.dia)}</text> : null}
            </g>
          );
        })}
      </svg>
      {activo !== null ? (
        <div className="grafico-tip" style={{ left: `${((izq + activo * banda + banda / 2) / W) * 100}%` }}>
          <strong>{fecha(dias[activo].dia)}</strong>
          <span>{n(Number(dias[activo].total) || 0)} visitas · {n(Number(dias[activo].visitantes) || 0)} visitantes</span>
        </div>
      ) : null}
      <details style={{ marginTop: 10 }}>
        <summary className="hint" style={{ cursor: "pointer" }}>Ver los datos en tabla</summary>
        <table className="tabla-datos">
          <thead><tr><th>Día</th><th>Visitas</th><th>Visitantes</th></tr></thead>
          <tbody>{[...dias].reverse().map((d) => <tr key={d.dia}><td>{fecha(d.dia)}</td><td>{n(Number(d.total) || 0)}</td><td>{n(Number(d.visitantes) || 0)}</td></tr>)}</tbody>
        </table>
      </details>
    </div>
  );
}

/** Barras horizontales (una serie) con el valor en la punta. */
function Barras({ filas }: { filas: { k: string; l: string; v: number }[] }) {
  const max = Math.max(...filas.map((f) => f.v));
  return (
    <ul className="barras">
      {filas.map((f) => (
        <li key={f.k} title={`${f.l}: ${n(f.v)} visitas`}>
          <span className="barras-et">{f.l}</span>
          <span className="barras-pista"><span className="barras-barra" style={{ width: `${Math.max(2, (f.v / max) * 100)}%` }} /></span>
          <span className="barras-val">{n(f.v)}</span>
        </li>
      ))}
    </ul>
  );
}
