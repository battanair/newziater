"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, authDisponible } from "@/lib/firebase-client";

interface AuthState {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });
  useEffect(() => {
    if (!authDisponible) { setState({ user: null, loading: false }); return; }
    return onAuthStateChanged(auth, (user) => {
      setState({ user, loading: false });
      // Marca para ocultar, antes de pintar la página, lo que solo es para quien no ha entrado (ver SCRIPT_SESION)
      try { if (user) localStorage.setItem("ziater-sesion", "1"); else localStorage.removeItem("ziater-sesion"); } catch {}
      if (user) document.documentElement.dataset.sesion = "1"; else delete document.documentElement.dataset.sesion;
    });
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Llama a una ruta /api con el token de sesión del usuario. */
export async function authFetch(path: string, body: unknown) {
  const user = authDisponible ? auth.currentUser : null;
  if (!user) throw new Error("Necesitas iniciar sesión");
  const token = await user.getIdToken();
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Error de servidor");
  return res.json();
}

