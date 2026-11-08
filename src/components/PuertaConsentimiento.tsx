"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-client";
import { useAuth } from "./AuthProvider";
import { CasillasCuenta } from "./Consentimientos";
import { EDAD_MINIMA, VERSION_TERMINOS } from "@/lib/consentimiento";

const LIBRES = ["/terminos-de-uso", "/politica-de-privacidad", "/politica-de-cookies", "/aviso-legal"];

/**
 * Si alguien tiene sesión pero no ha aceptado la versión vigente de los términos
 * (por ejemplo, entró con Google desde «Entrar» sin pasar por el registro, o los
 * términos han cambiado), se le pide antes de seguir. Puede negarse y cerrar sesión.
 */
export function PuertaConsentimiento() {
  const { user } = useAuth();
  const path = usePathname();
  const [falta, setFalta] = useState(false);
  const [edad, setEdad] = useState(false);
  const [acepto, setAcepto] = useState(false);
  const [error, setError] = useState("");
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return setFalta(false);
    getDoc(doc(db, "users", user.uid))
      .then((s) => setFalta(s.data()?.consentimiento !== VERSION_TERMINOS))
      .catch(() => setFalta(false));
  }, [user]);

  useEffect(() => { if (falta) caja.current?.querySelector("input")?.focus(); }, [falta]);

  if (!user || !falta || LIBRES.includes(path)) return null;

  async function aceptar() {
    if (!edad) return setError(`Para tener cuenta en Ziater necesitas tener al menos ${EDAD_MINIMA} años.`);
    if (!acepto) return setError("Para seguir, acepta los términos de uso y la política de privacidad.");
    await setDoc(doc(db, "users", user!.uid), { consentimiento: VERSION_TERMINOS, consentimiento_fecha: serverTimestamp() }, { merge: true });
    setFalta(false);
  }

  return (
    <div className="velo" role="dialog" aria-modal="true" aria-labelledby="pc-titulo">
      <div className="panel velo-caja" ref={caja}>
        <h2 id="pc-titulo" className="h3" style={{ marginBottom: 8 }}>Antes de seguir</h2>
        <p className="soft" style={{ marginTop: 0 }}>Para usar tu cuenta en Ziater necesitamos que confirmes esto. Solo te lo pediremos una vez, o si cambian las condiciones.</p>
        <CasillasCuenta edad={edad} acepto={acepto} onEdad={setEdad} onAcepto={setAcepto} idPrefijo="pc" />
        {error ? <p className="error" role="alert" style={{ margin: "12px 0 0" }}>{error}</p> : null}
        <div className="actions" style={{ marginTop: 16 }}>
          <button type="button" className="btn" onClick={() => signOut(auth)}>No acepto, cerrar sesión</button>
          <button type="button" className="btn btn-primary" onClick={aceptar}>Aceptar y continuar</button>
        </div>
      </div>
    </div>
  );
}
