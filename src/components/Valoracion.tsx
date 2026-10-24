"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { anadirALista } from "@/lib/client-data";
import { media, puntuacion } from "@/lib/claves";
import { authFetch, useAuth } from "./AuthProvider";
import { useToast } from "./Toast";

// Nota de 1 a 10. Se guarda en valoraciones/{obra}_{uid} y, en la misma
// transacción, se actualizan los contadores de la obra (votos, suma, media y
// puntuación). Las reglas de Firestore comprueban que los números cuadran,
// así que nadie puede inflar la nota de una obra.
export function Valoracion({ obraId, votos: v0 = 0, nota: n0 = 0 }: { obraId: string; votos?: number; nota?: number }) {
  const { user } = useAuth();
  const router = useRouter();
  const [mia, setMia] = useState(0);
  const [hover, setHover] = useState(0);
  const [stats, setStats] = useState({ votos: v0, nota: n0 });
  const [estado, setEstado] = useState<"idle" | "saving" | "error">("idle");
  const avisar = useToast();

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "valoraciones", `${obraId}_${user.uid}`)).then((s) => setMia(s.exists() ? Number(s.data().nota) : 0)).catch(() => {});
  }, [user, obraId]);

  async function votar(nota: number) {
    if (!user) return router.push(`/login?next=/obra/${obraId}`);
    setEstado("saving");
    try {
      const res = await runTransaction(db, async (tx) => {
        const obraRef = doc(db, "obra", obraId);
        const valRef = doc(db, "valoraciones", `${obraId}_${user.uid}`);
        const [o, v] = await Promise.all([tx.get(obraRef), tx.get(valRef)]);
        const d = o.data() ?? {};
        const antes = v.exists() ? Number(v.data().nota) : 0;
        const votos = Number(d.votos ?? 0) + (v.exists() ? 0 : 1);
        const suma = Number(d.suma_notas ?? 0) - antes + nota;
        if (v.exists()) tx.update(valRef, { nota, fecha: serverTimestamp() });
        else tx.set(valRef, { obra: obraId, uid: user.uid, nota, fecha: serverTimestamp() });
        tx.update(obraRef, { votos, suma_notas: suma, nota: media(suma, votos), puntuacion: puntuacion(suma, votos) });
        return { votos, nota: media(suma, votos) };
      });
      setMia(nota);
      setStats(res);
      avisar(`Nota guardada: ${nota}. También la hemos añadido a «La he visto».`);
      anadirALista(user.uid, "vistas", obraId).catch(() => {}); // puntuarla implica haberla visto
      setEstado("idle");
      authFetch("/api/revalidar", { obras: [obraId] }).catch(() => {});
    } catch {
      setEstado("error");
    }
  }

  const activa = hover || mia;
  return (
    <dl className="stats" style={{ alignItems: "flex-end" }}>
      <div>
        <dt>Valoración Ziater</dt>
        <dd style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          {stats.votos ? (
            <>
              <span style={{ color: "var(--foco)" }} aria-hidden="true">★</span>
              <span style={{ fontSize: 32 }}>{stats.nota.toLocaleString("es-ES", { maximumFractionDigits: 1 })}</span>
              <span className="muted" style={{ fontSize: 15, fontWeight: 400 }}>/10 · {stats.votos} {stats.votos === 1 ? "voto" : "votos"}</span>
            </>
          ) : (
            <span className="muted" style={{ fontSize: 16, fontWeight: 400 }}>Aún sin votos. ¡Sé la primera persona!</span>
          )}
        </dd>
      </div>
      <div className="votar">
        <dt>{mia ? `Tu nota: ${mia}` : "¿La has visto? Puntúala"}</dt>
        <dd role="group" aria-label="Tu nota de 1 a 10" className="notas" onMouseLeave={() => setHover(0)}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`Puntuar con ${n}`}
              aria-pressed={mia === n}
              disabled={estado === "saving"}
              onMouseEnter={() => setHover(n)}
              onClick={() => votar(n)}
              className={n <= activa ? "on" : undefined}
            >
              {n}
            </button>
          ))}
        </dd>
        {estado === "error" ? <p className="error" role="alert" style={{ margin: "6px 0 0" }}>No se pudo guardar tu nota. Inténtalo de nuevo.</p> : null}
      </div>
    </dl>
  );
}
