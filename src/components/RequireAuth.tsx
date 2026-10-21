"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { useAuth } from "./AuthProvider";

/** Protege las páginas del panel: si no hay sesión, manda al login y vuelve después. */
export function RequireAuth({ children }: { children: (user: User) => React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [loading, user, router, path]);
  if (loading || !user) return <main className="wrap section"><p className="muted">Cargando…</p></main>;
  return <>{children(user)}</>;
}
