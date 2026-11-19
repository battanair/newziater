"use client";


import { useT } from "@/components/Idioma";
import Link, { useT } from "@/components/Idioma";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase-client";
import { RequireAuth } from "./RequireAuth";
import { useAuth } from "./AuthProvider";
import { COL_ENTIDAD, pedirGestionarEntidad, type TipoEntidad } from "@/lib/colaboracion";

const TXT: Record<TipoEntidad, { la: string; ruta: string; cargo: string }> = {
  sala: { la: "la sala", ruta: "sala", cargo: "Dirección, programación, comunicación…" },
  compania: { la: "la compañía", ruta: "compania", cargo: "Dirección, producción, distribución…" },
};

export function ReclamarEntidad({ tipo, id }: { tipo: TipoEntidad; id: string }) {
  return <RequireAuth>{(user) => <Formulario tipo={tipo} id={id} user={user} />}</RequireAuth>;
}

function Formulario({ tipo, id, user }: { tipo: TipoEntidad; id: string; user: User }) {
  const t = useT();
  const tx = TXT[tipo];
  const la = t(tx.la);
  const [ficha, setFicha] = useState<{ nombre: string; creacion: string } | null | undefined>(undefined);
  const [previa, setPrevia] = useState<string | null>(null);
  const [f, setF] = useState({ nombre: user.displayName ?? "", cargo: "", contacto: user.email ?? "", motivo: "" });
  const [estado, setEstado] = useState<"idle" | "busy" | "ok" | "error">("idle");

  useEffect(() => {
    getDoc(doc(db, COL_ENTIDAD[tipo], id))
      .then((s) => setFicha(s.exists() ? { nombre: String(s.data().nombre ?? s.data().nombre_prod ?? ""), creacion: String(s.data().creacion ?? "") } : null))
      .catch(() => setFicha(null));
    getDoc(doc(db, "reclamaciones_entidad", `${tipo}_${id}_${user.uid}`)).then((s) => setPrevia(s.exists() ? String(s.data().estado ?? "pendiente") : null)).catch(() => {});
  }, [tipo, id, user.uid]);

  if (ficha === undefined) return <main className="wrap section"><p className="muted">{t("Cargando…")}</p></main>;
  if (!ficha) return <main className="wrap section"><p>{t("Esta ficha no existe.")}</p></main>;
  if (ficha.creacion === user.uid) return <main className="wrap section"><p>{t("Ya gestionas {la} {nombre}.", { la: la, nombre: ficha.nombre })}{" "}<Link href={`/${tx.ruta}/${id}`} style={{ color: "var(--foco)" }}>{t("Ver la ficha")}</Link></p></main>;
  if ((previa && estado !== "ok") || estado === "ok") {
    const ok = estado === "ok" || previa === "pendiente";
    return (
      <main className="wrap section" style={{ maxWidth: 720 }}>
        <h1 className="h1" style={{ fontSize: 44 }}>{ok ? t("Solicitud enviada") : previa === "aprobada" ? t("Solicitud aprobada") : t("Solicitud no aprobada")}</h1>
        <p className="lead soft">{ok ? <>{t("Revisaremos tu solicitud para gestionar {nombre} en uno o dos días. Verás el estado en Mi espacio.", { nombre: ficha.nombre })}</>
          : previa === "aprobada" ? <>{t("Ya puedes gestionar {nombre}.", { nombre: ficha.nombre })}</>
          : <>{t("No pudimos confirmar que gestionas {nombre}. Si crees que es un error,", { nombre: ficha.nombre })}{" "}<Link href="/contacto" style={{ color: "var(--foco)" }}>{t("escríbenos")}</Link>.</>}</p>
        <Link href="/panel" className="btn btn-primary">{t("Ir a Mi espacio")}</Link>
      </main>
    );
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("busy");
    try { await pedirGestionarEntidad(tipo, id, f); setEstado("ok"); } catch { setEstado("error"); }
  }
  const campo = (k: keyof typeof f) => ({ value: f[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value }) });

  return (
    <main className="wrap section" style={{ maxWidth: 720 }}>
      <p className="eyebrow" style={{ marginBottom: 14 }}>{t("Gestionar {la}", { la: la })}</p>
      <h1 className="h1" style={{ fontSize: 44 }}>{t("¿Gestionas {nombre}?", { nombre: ficha.nombre })}</h1>
      <p className="lead soft">{t("Pide hacerte cargo de la ficha para editarla y mantenerla al día. Comprobaremos que formas parte del equipo, normalmente escribiendo al email o al Instagram oficial.")}</p>
      <form onSubmit={enviar} className="stack" style={{ marginTop: 24 }}>
        <div className="form-grid">
          <div className="field"><label className="label" htmlFor="nombre">{t("Tu nombre")}</label><input id="nombre" className="input" required maxLength={100} {...campo("nombre")} /></div>
          <div className="field"><label className="label" htmlFor="cargo">{t("Tu cargo")}</label><input id="cargo" className="input" required maxLength={100} placeholder={t(tx.cargo)} {...campo("cargo")} /></div>
        </div>
        <div className="field">
          <label className="label" htmlFor="contacto">{t("Email o Instagram oficial donde confirmarlo")}</label>
          <input id="contacto" className="input" required maxLength={200} {...campo("contacto")} />
          <span className="hint">{t("Mejor si es el de {la} (por ejemplo, el email de su web).", { la: la })}</span>
        </div>
        <div className="field">
          <label className="label" htmlFor="motivo">{t("Algo más que debamos saber (opcional)")}</label>
          <textarea id="motivo" className="input" rows={3} maxLength={1000} {...campo("motivo")} />
        </div>
        {estado === "error" ? <p className="error" role="alert">{t("No se pudo enviar la solicitud. Inténtalo de nuevo.")}</p> : null}
        <button type="submit" className="btn btn-primary btn-lg" disabled={estado === "busy"} style={{ alignSelf: "flex-start" }}>{t("Enviar solicitud")}</button>
      </form>
    </main>
  );
}

/** Enlace «¿Gestionas esta sala?» en la ficha pública; no sale para quien ya la gestiona. */
export function PedirGestion({ tipo, id, dueno }: { tipo: TipoEntidad; id: string; dueno?: string }) {
  const t = useT();
  const { user, loading } = useAuth();
  if (loading || (user && user.uid === dueno)) return null;
  return <Link href={`/reclamar/${tipo}/${id}`} className="btn btn-ghost">{tipo === "sala" ? t("¿Gestionas esta sala?") : t("¿Es tu compañía?")}</Link>;
}
