"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { arrayRemove, arrayUnion, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { useAuth } from "./AuthProvider";
import { useToast } from "./Toast";

// "Quiero verla" usa el campo existente users.favoritos_obra; "La he visto", users.vistas.
export function ObraActions({ obraId }: { obraId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const avisar = useToast();
  const [fav, setFav] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((s) => {
      const d = s.data() ?? {};
      setFav((d.favoritos_obra ?? []).includes(obraId));
      setSeen((d.vistas ?? []).includes(obraId));
    });
  }, [user, obraId]);

  async function toggle(field: "favoritos_obra" | "vistas", on: boolean, set: (v: boolean) => void, deshaciendo = false) {
    if (!user) return router.push(`/login?next=/obra/${obraId}`);
    set(!on);
    try {
      await setDoc(doc(db, "users", user.uid), { [field]: on ? arrayRemove(obraId) : arrayUnion(obraId) }, { merge: true });
      if (deshaciendo) return;
      const lista = field === "vistas" ? "«La he visto»" : "«Quiero verla»";
      avisar(on ? `Quitada de ${lista}.` : `Añadida a ${lista}. La tienes en Mi espacio.`, { deshacer: () => toggle(field, !on, set, true) });
    } catch {
      set(on);
      avisar("No se pudo guardar. Inténtalo de nuevo.", { error: true });
    }
  }

  return (
    <div className="actions">
      <button type="button" className={`btn ${fav ? "btn-on" : ""}`} aria-pressed={fav} onClick={() => toggle("favoritos_obra", fav, setFav)}>
        {fav ? "✓ En «Quiero verla»" : "+ Quiero verla"}
      </button>
      <button type="button" className={`btn ${seen ? "btn-on" : ""}`} aria-pressed={seen} onClick={() => toggle("vistas", seen, setSeen)}>
        {seen ? "✓ La he visto" : "La he visto"}
      </button>
      <ShareButton />
    </div>
  );
}

export function ShareButton() {
  const [copied, setCopied] = useState(false);
  async function share() {
    const data = { title: document.title, url: location.href };
    if (navigator.share) {
      try { await navigator.share(data); } catch { /* cancelado */ }
    } else {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }
  return <button type="button" className="btn" onClick={share}>{copied ? "✓ Enlace copiado" : "Compartir"}</button>;
}
