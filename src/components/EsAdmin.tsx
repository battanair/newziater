"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { useAuth } from "./AuthProvider";

/** Cuenta del administrador de Ziater. */
export const EMAIL_ADMIN = "battanedd@gmail.com";

/**
 * ¿Es la sesión del administrador? Hace falta las dos cosas: haber entrado con
 * su cuenta (email verificado) y tener el permiso admin=true en el token.
 * Esto solo decide qué botones se ven: lo que protege los datos son las reglas
 * de Firestore, que exigen ese permiso en el servidor.
 */
export function useEsAdmin() {
  const { user } = useAuth();
  const [es, setEs] = useState(false);
  useEffect(() => {
    if (!user || user.email !== EMAIL_ADMIN || !user.emailVerified) return setEs(false);
    user.getIdTokenResult().then((t) => setEs(t.claims.admin === true)).catch(() => setEs(false));
  }, [user]);
  return es;
}

/** Mensajes de contacto sin atender (solo se consulta si es la sesión del administrador). */
export function useMensajesPendientes(esAdmin: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!esAdmin) return setN(0);
    getDocs(collection(db, "fallos")).then((s) => setN(s.docs.filter((d) => !d.data().atendido).length)).catch(() => setN(0));
  }, [esAdmin]);
  return n;
}
