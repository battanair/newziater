"use client";

import { useEffect } from "react";
import { useRouter, useT, usePathname } from "@/components/Idioma";
import type { User } from "firebase/auth";
import { useAuth } from "./AuthProvider";

/** Protege las páginas del panel: si no hay sesión, manda al login y vuelve después. */
export function RequireAuth({ children }: { children: (user: User) => React.ReactNode }) {
  const t = useT();
  const { user, loading } = useAuth();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [loading, user, router, path]);
  if (loading || !user) return <main className="wrap section"><p className="muted">{t("Cargando…")}</p></main>;
  return <>{children(user)}</>;
}
