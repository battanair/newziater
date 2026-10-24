"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { anadirALista, miUsuario, quitarDeLista } from "@/lib/client-data";
import { useAuth } from "./AuthProvider";
import { useToast } from "./Toast";

// Usa el campo existente users.favoritos_persona (de la web anterior).
export function SeguirArtista({ personaId }: { personaId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [sigo, setSigo] = useState(false);
  const avisar = useToast();

  useEffect(() => {
    if (user) miUsuario(user.uid).then((u) => setSigo((u.favoritos_persona ?? []).includes(personaId))).catch(() => {});
  }, [user, personaId]);

  async function toggle() {
    if (!user) return router.push(`/login?next=/persona/${personaId}`);
    const antes = sigo;
    setSigo(!antes);
    try {
      await (antes ? quitarDeLista : anadirALista)(user.uid, "favoritos_persona", personaId);
      if (!antes) avisar("Le sigues. Verás sus obras en tu portada.");
    } catch {
      setSigo(antes);
      avisar("No se pudo guardar. Inténtalo de nuevo.", { error: true });
    }
  }

  return (
    <button type="button" className={`btn ${sigo ? "btn-on" : "btn-primary"}`} aria-pressed={sigo} onClick={toggle}>
      {sigo ? "✓ Siguiendo" : "Seguir"}
    </button>
  );
}
