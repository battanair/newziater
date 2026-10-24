"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { collection, getCountFromServer, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { miPersona } from "@/lib/client-data";
import { useAuth } from "./AuthProvider";

type Estado = { total: number; recargar: () => void };
const Ctx = createContext<Estado>({ total: 0, recargar: () => {} });

/**
 * Cuántas cosas esperan respuesta del usuario: créditos en los que le han
 * añadido, gente que se ha añadido a sus obras y sugerencias en sus fichas.
 * Se muestra como un número en «Mi espacio» (cabecera, barra del móvil y panel).
 */
export function PendientesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [total, setTotal] = useState(0);

  const recargar = useCallback(async () => {
    if (!user) return setTotal(0);
    try {
      const uid = user.uid;
      const [yo, obras, sugs] = await Promise.all([
        miPersona(uid),
        getDocs(query(collection(db, "obra"), where("creacion", "==", uid))),
        getCountFromServer(query(collection(db, "sugerencias"), where("dueno", "==", uid), where("estado", "==", "pendiente"))).then((s) => s.data().count).catch(() => 0),
      ]);
      const mios = yo ? (await getDocs(query(collection(db, "persona_obra"), where("id_persona", "==", yo.id), where("estado", "==", "pendiente")))).docs.filter((d) => d.data().creado_por !== uid).length : 0;
      const ids = obras.docs.map((d) => d.id);
      let enObras = 0;
      for (let i = 0; i < ids.length; i += 30) {
        const s = await getDocs(query(collection(db, "persona_obra"), where("id_obra", "in", ids.slice(i, i + 30)), where("estado", "==", "pendiente")));
        enObras += s.docs.filter((d) => d.data().creado_por !== uid).length;
      }
      setTotal(mios + enObras + sugs);
    } catch {
      setTotal(0);
    }
  }, [user]);

  useEffect(() => { recargar(); }, [recargar]);
  useEffect(() => {
    const alVolver = () => { if (document.visibilityState === "visible") recargar(); };
    document.addEventListener("visibilitychange", alVolver);
    return () => document.removeEventListener("visibilitychange", alVolver);
  }, [recargar]);

  return <Ctx.Provider value={{ total, recargar }}>{children}</Ctx.Provider>;
}

export const usePendientes = () => useContext(Ctx);

/** Numerito de aviso. */
export function Insignia({ n, etiqueta = "pendientes" }: { n: number; etiqueta?: string }) {
  if (!n) return null;
  return <span className="insignia" aria-label={`${n} ${etiqueta}`}>{n > 9 ? "9+" : n}</span>;
}

