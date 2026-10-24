"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

/** «Editar» visible solo para quien gestiona la ficha (lo demás lo protegen las reglas). */
export function EditarFicha({ dueno, href, texto = "Editar" }: { dueno?: string; href: string; texto?: string }) {
  const { user } = useAuth();
  if (!user || !dueno || user.uid !== dueno) return null;
  return (
    <Link href={href} className="btn btn-primary">
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></svg>
      {texto}
    </Link>
  );
}
