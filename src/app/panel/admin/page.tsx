"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, query, updateDoc, where, writeBatch } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase-client";
import { RequireAuth } from "@/components/RequireAuth";
import { authFetch } from "@/components/AuthProvider";
import { leer } from "@/lib/client-data";
import { nombreCompleto } from "@/lib/format";
import type { Persona } from "@/lib/types";

type Reclamacion = { id: string; id_persona: string; uid: string; metodo: string; contacto: string; persona?: Persona | null };

export default function AdminPage() {
  return <RequireAuth>{(user) => <Admin user={user} />}</RequireAuth>;
}

// Solo para administradores (custom claim admin=true, ver scripts/set-admin.mjs).
// Las reglas de Firestore impiden que cualquier otra persona lea o apruebe nada aquí.
function Admin({ user }: { user: User }) {
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null);
  const [lista, setLista] = useState<Reclamacion[]>([]);

  const cargar = useCallback(async () => {
    const t = await user.getIdTokenResult(true);
    if (t.claims.admin !== true) return setEsAdmin(false);
    setEsAdmin(true);
    const q = await getDocs(query(collection(db, "reclamaciones"), where("estado", "==", "pendiente")));
    const rs = q.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Reclamacion, "id">) }));
    setLista(await Promise.all(rs.map(async (r) => ({ ...r, persona: await leer<Persona>("persona", r.id_persona) }))));
  }, [user]);

  useEffect(() => { cargar(); }, [cargar]);

  async function aprobar(r: Reclamacion) {
    const b = writeBatch(db);
    b.update(doc(db, "persona", r.id_persona), { coincide: r.uid, verificado: true });
    b.update(doc(db, "reclamaciones", r.id), { estado: "aprobada" });
    await b.commit();
    await authFetch("/api/revalidar", { personas: [r.id_persona] }).catch(() => {});
    cargar();
  }
  async function rechazar(r: Reclamacion) {
    await updateDoc(doc(db, "reclamaciones", r.id), { estado: "rechazada" });
    cargar();
  }

  if (esAdmin === null) return <main className="wrap section"><p className="muted">Comprobando permisos…</p></main>;
  if (!esAdmin) return <main className="wrap section"><p>Esta sección es solo para el equipo de Ziater.</p></main>;

  return (
    <main className="wrap section" style={{ maxWidth: 1000 }}>
      <h1 className="h1" style={{ fontSize: 44, marginBottom: 24 }}>Reclamaciones de fichas</h1>
      {!lista.length ? <p className="soft">No hay solicitudes pendientes.</p> : null}
      <div className="stack">
        {lista.map((r) => (
          <div key={r.id} className="panel" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
            <div style={{ flex: "1 1 320px" }}>
              <Link href={`/persona/${r.id_persona}`} target="_blank" style={{ fontWeight: 600, fontSize: 18 }}>{r.persona ? nombreCompleto(r.persona) : r.id_persona}</Link>
              <div className="hint">Verificación por {r.metodo}: {r.contacto}</div>
              <div className="hint">Usuario: {r.uid}</div>
            </div>
            <div className="actions">
              <button type="button" className="btn btn-ghost" onClick={() => rechazar(r)}>Rechazar</button>
              <button type="button" className="btn btn-primary" onClick={() => aprobar(r)}>Aprobar</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
