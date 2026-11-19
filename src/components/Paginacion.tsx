import { tServidor } from "@/lib/idioma-servidor";
import Link from "@/components/Idioma";

/** «Ver más» con cursor: la URL lleva el id del último elemento, así cada página lee solo sus 24 fichas. */
export function Paginacion({ base, params, siguiente, primera }: { base: string; params: Record<string, string | undefined>; siguiente?: string; primera: boolean }) {
  const t = tServidor();
  const href = (despues?: string) => {
    const sp = new URLSearchParams(Object.entries({ ...params, despues }).filter(([, v]) => v) as [string, string][]);
    return `${base}${sp.size ? "?" + sp : ""}`;
  };
  if (!siguiente && primera) return null;
  return (
    <nav aria-label={t("Paginación")} className="actions" style={{ justifyContent: "center", marginTop: 40 }}>
      {!primera ? <Link href={href()} className="btn">{t("← Volver al principio")}</Link> : null}
      {siguiente ? <Link href={href(siguiente)} className="btn btn-primary" rel="next">{t("Ver más")}</Link> : null}
    </nav>
  );
}
