"use client";


import { useT } from "@/components/Idioma";
import { useState } from "react";
import { useBusqueda } from "./SearchBox";
import { ACCESIBILIDAD, AVISOS, EDADES, contactoDistribucion, type FichaTecnica } from "@/lib/ficha-tecnica";

export interface PremioEditable { id?: string; galardon: string; anio: string; borrar?: boolean }

/** Campos opcionales de la ficha técnica de una obra (formulario de obra, paso 1). */
export function FichaTecnicaEditor({ ft, onChange, premios, onPremios }: { ft: FichaTecnica; onChange: (f: FichaTecnica) => void; premios: PremioEditable[]; onPremios: (p: PremioEditable[]) => void }) {
  const t = useT();
  const set = <K extends keyof FichaTecnica>(k: K, v: FichaTecnica[K]) => onChange({ ...ft, [k]: v });
  const alternar = (k: "accesibilidad" | "avisos", v: string) => set(k, ft[k].includes(v) ? ft[k].filter((x) => x !== v) : [...ft[k], v]);
  const [qCompania, setQCompania] = useState("");
  const { items: companias } = useBusqueda(qCompania.trim().length >= 2 ? qCompania : "", ["productora"]);
  const [premio, setPremio] = useState({ galardon: "", anio: "" });
  const contactoMal = ft.gira && ft.distribucion.trim() && !contactoDistribucion(ft.distribucion);

  return (
    <fieldset className="panel stack" style={{ gap: 20, border: "1px solid var(--linea)", margin: 0 }}>
      <legend className="h3" style={{ padding: "0 8px" }}>{t("Ficha técnica")}{" "}<span className="hint" style={{ fontWeight: 400 }}>{t("(todo opcional)")}</span></legend>

      <div className="form-grid">
        <div className="field">
          <label className="label" htmlFor="ft-edad">{t("Edad recomendada")}</label>
          <select id="ft-edad" className="select" value={ft.edad} onChange={(e) => set("edad", e.target.value)}>
            <option value="">{t("Sin indicar")}</option>
            {(EDADES.includes(ft.edad) || !ft.edad ? EDADES : [ft.edad, ...EDADES]).map((e) => <option key={e} value={e}>{t(e)}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="ft-estreno">{t("Fecha de estreno")}</label>
          <input id="ft-estreno" type="date" className="input" value={ft.estreno_fecha} onChange={(e) => set("estreno_fecha", e.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor="ft-lugar">{t("Lugar de estreno")}</label>
          <input id="ft-lugar" className="input" maxLength={150} value={ft.estreno_lugar} onChange={(e) => set("estreno_lugar", e.target.value)} placeholder={t("Sala, ciudad o festival")} />
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label className="label" htmlFor="ft-basada">{t("Basada en")}{" "}<span className="hint">{t("(obra original)")}</span></label>
          <input id="ft-basada" className="input" maxLength={200} value={ft.basada_en} onChange={(e) => set("basada_en", e.target.value)} placeholder={t("La casa de Bernarda Alba")} />
        </div>
        <div className="field">
          <label className="label" htmlFor="ft-autor">{t("Autor/a de la obra original")}</label>
          <input id="ft-autor" className="input" maxLength={150} value={ft.basada_autor} onChange={(e) => set("basada_autor", e.target.value)} placeholder={t("Federico García Lorca")} />
        </div>
      </div>

      <div className="field">
        <span className="label" id="ft-comp-l">{t("Compañía o productora")}</span>
        {ft.id_productora ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="chip chip-ok">✓ {ft.productora_nombre || t("Compañía enlazada")}</span>
            <button type="button" className="btn btn-ghost" onClick={() => onChange({ ...ft, id_productora: "", productora_nombre: "" })}>{t("Quitar")}</button>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <input aria-labelledby="ft-comp-l" className="input" maxLength={150} value={ft.compania} placeholder={t("Escribe el nombre de la compañía")}
              onChange={(e) => { set("compania", e.target.value); setQCompania(e.target.value); }} />
            {qCompania.trim().length >= 2 && companias.length ? (
              <div className="suggest" style={{ position: "static", marginTop: 6 }}>
                {companias.slice(0, 5).map((c) => (
                  <button key={c.id} type="button" className="suggest-item" onClick={() => { onChange({ ...ft, id_productora: c.id, productora_nombre: c.n, compania: "" }); setQCompania(""); }}>
                    <span style={{ flex: 1 }}><strong style={{ display: "block" }}>{c.n}</strong><span className="hint">{t("Compañía en Ziater")}</span></span>
                    <span style={{ color: "var(--foco)", fontWeight: 600, fontSize: 13 }}>{t("Enlazar")}</span>
                  </button>
                ))}
              </div>
            ) : null}
            <span className="hint">{t("Si ya está en Ziater, elígela para enlazar su ficha. Si no, se mostrará el nombre tal cual.")}</span>
          </div>
        )}
      </div>
      <div className="field">
        <label className="label" htmlFor="ft-apoyos">{t("Coproducción y apoyos")}</label>
        <input id="ft-apoyos" className="input" maxLength={300} value={ft.apoyos} onChange={(e) => set("apoyos", e.target.value)} placeholder={t("Con el apoyo de… · En coproducción con…")} />
      </div>

      <div className="field">
        <span className="label">{t("Accesibilidad")}{" "}<span className="hint">{t("(lo que ofrecen todas o algunas funciones)")}</span></span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ACCESIBILIDAD.map((a) => <button key={a} type="button" className="chip" aria-pressed={ft.accesibilidad.includes(a)} onClick={() => alternar("accesibilidad", a)}>{t(a)}</button>)}
        </div>
      </div>
      <div className="field">
        <span className="label">{t("Avisos para el público")}</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {AVISOS.map((a) => <button key={a} type="button" className="chip" aria-pressed={ft.avisos.includes(a)} onClick={() => alternar("avisos", a)}>{t(a)}</button>)}
        </div>
      </div>

      <div className="field">
        <span className="label">{t("Premios y nominaciones")}</span>
        {premios.filter((p) => !p.borrar).length ? (
          <ul className="list" style={{ marginBottom: 8 }}>
            {premios.map((p, i) => p.borrar ? null : (
              <li key={p.id ?? `n${i}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                <span style={{ flex: 1 }}>{p.galardon}{p.anio ? <span className="muted"> · {p.anio}</span> : null}</span>
                <button type="button" className="btn btn-ghost" aria-label={t("Quitar {galardon}", { galardon: p.galardon })} onClick={() => onPremios(p.id ? premios.map((x, j) => (j === i ? { ...x, borrar: true } : x)) : premios.filter((_, j) => j !== i))}>✕</button>
              </li>
            ))}
          </ul>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <input className="input" style={{ flex: "3 1 240px" }} aria-label={t("Premio o nominación")} maxLength={200} placeholder={t("Premio Max al mejor espectáculo (nominada)")} value={premio.galardon} onChange={(e) => setPremio({ ...premio, galardon: e.target.value })} />
          <input className="input" style={{ flex: "0 1 100px" }} aria-label={t("Año")} inputMode="numeric" maxLength={4} placeholder={t("Año")} value={premio.anio} onChange={(e) => setPremio({ ...premio, anio: e.target.value.replace(/\D/g, "") })} />
          <button type="button" className="btn" disabled={!premio.galardon.trim()} onClick={() => { onPremios([...premios, { galardon: premio.galardon.trim(), anio: premio.anio }]); setPremio({ galardon: "", anio: "" }); }}>{t("Añadir")}</button>
        </div>
      </div>

      <div className="field">
        <label className="casilla" htmlFor="ft-gira">
          <input id="ft-gira" type="checkbox" checked={ft.gira} onChange={(e) => set("gira", e.target.checked)} />
          <span><strong style={{ color: "var(--papel)" }}>{t("Disponible para gira")}</strong>{" "}{t("· Se mostrará un sello en la ficha y aparecerá en el listado de obras disponibles para programadores.")}</span>
        </label>
        {ft.gira ? (
          <>
            <label className="label" htmlFor="ft-dist" style={{ marginTop: 10 }}>{t("Contacto de distribución")}{" "}<span className="hint">{t("(email o web)")}</span></label>
            <input id="ft-dist" className="input" maxLength={200} value={ft.distribucion} onChange={(e) => set("distribucion", e.target.value)} placeholder={t("distribucion@tucompania.com")} />
            {contactoMal ? <span className="error" role="alert">{t("Escribe un email o una web válidos.")}</span> : <span className="hint">{t("Será público en la ficha, para que te escriban salas y festivales.")}</span>}
          </>
        ) : null}
      </div>
    </fieldset>
  );
}
