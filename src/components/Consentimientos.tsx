"use client";

import Link, { useT } from "@/components/Idioma";
import { EDAD_MINIMA } from "@/lib/consentimiento";

/** Casillas obligatorias para crear una cuenta: edad mínima y aceptación de términos y privacidad. Nunca vienen marcadas. */
export function CasillasCuenta({ edad, acepto, onEdad, onAcepto, idPrefijo = "c" }: { edad: boolean; acepto: boolean; onEdad: (v: boolean) => void; onAcepto: (v: boolean) => void; idPrefijo?: string }) {
  const t = useT();
  return (
    <div className="stack" style={{ gap: 10 }}>
      <label className="casilla" htmlFor={`${idPrefijo}-edad`}>
        <input id={`${idPrefijo}-edad`} type="checkbox" checked={edad} onChange={(e) => onEdad(e.target.checked)} />
        <span>{t("Tengo")}{" "}{EDAD_MINIMA}{" "}{t("años o más.")}</span>
      </label>
      <label className="casilla" htmlFor={`${idPrefijo}-acepto`}>
        <input id={`${idPrefijo}-acepto`} type="checkbox" checked={acepto} onChange={(e) => onAcepto(e.target.checked)} />
        <span>{t("He leído y acepto los")}{" "}<Link href="/terminos-de-uso" target="_blank">{t("términos de uso")}</Link>{" "}{t("y la")}{" "}
          <Link href="/politica-de-privacidad" target="_blank">{t("política de privacidad")}</Link>.
        </span>
      </label>
    </div>
  );
}
