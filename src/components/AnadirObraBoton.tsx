"use client";

import { useEffect, useState } from "react";
import Link, { useT } from "@/components/Idioma";
import { useAuth } from "./AuthProvider";
import { miPersona } from "@/lib/client-data";

/** «+ Añadir obra»: solo para quien ha entrado y tiene ficha de artista. */
export function AnadirObraBoton() {
  const t = useT();
  const { user } = useAuth();
  const [artista, setArtista] = useState(false);
  useEffect(() => {
    if (!user) { setArtista(false); return; }
    miPersona(user.uid).then((p) => setArtista(Boolean(p))).catch(() => setArtista(false));
  }, [user]);
  if (!artista) return null;
  return <Link href="/panel/obra/nueva" className="btn btn-primary">{t("+ Añadir obra")}</Link>;
}
