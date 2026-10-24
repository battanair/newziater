"use client";

import { useEffect, useState } from "react";
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
