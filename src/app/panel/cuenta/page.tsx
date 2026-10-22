"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteUser, sendEmailVerification, sendPasswordResetEmail, signOut, updateProfile, type User } from "firebase/auth";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-client";
import { RequireAuth } from "@/components/RequireAuth";
import { PanelNav } from "@/components/PanelNav";
import { miPersona, miUsuario } from "@/lib/client-data";

export default function CuentaPage() {
  return <RequireAuth>{(user) => <Cuenta user={user} />}</RequireAuth>;
}

function Cuenta({ user }: { user: User }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [personaId, setPersonaId] = useState<string>();
  const [msg, setMsg] = useState<{ t: "ok" | "error"; m: string } | null>(null);
  const [borrar, setBorrar] = useState("");
  const conPassword = user.providerData.some((p) => p.providerId === "password");
  const conGoogle = user.providerData.some((p) => p.providerId === "google.com");

  useEffect(() => {
    miUsuario(user.uid).then((u) => { setNombre(u.Nombre ?? ""); setApellidos(u.Apellidos ?? ""); });
    miPersona(user.uid).then((p) => setPersonaId(p?.id));
  }, [user.uid]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    try {
      await setDoc(doc(db, "users", user.uid), { Nombre: nombre.trim().slice(0, 100), Apellidos: apellidos.trim().slice(0, 150) }, { merge: true });
      await updateProfile(user, { displayName: `${nombre} ${apellidos}`.trim() });
      setMsg({ t: "ok", m: "Datos guardados." });
    } catch {
      setMsg({ t: "error", m: "No se pudieron guardar los datos. Inténtalo de nuevo." });
    }
  }

  async function eliminar() {
    try {
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      router.replace("/");
    } catch (e) {
      setMsg({ t: "error", m: (e as { code?: string }).code === "auth/requires-recent-login"
        ? "Por seguridad, cierra sesión, vuelve a entrar y repite este paso en los próximos minutos."
        : "No se pudo eliminar la cuenta. Escríbenos desde Contacto y lo hacemos por ti." });
    }
  }

  return (
    <>
      <PanelNav personaId={personaId} />
      <main className="wrap section" style={{ maxWidth: 760 }}>
        <h1 className="h1" style={{ fontSize: 44, marginBottom: 28 }}>Cuenta</h1>
        {msg ? <p className={msg.t} role={msg.t === "ok" ? "status" : "alert"}>{msg.m}</p> : null}

        <section className="panel" style={{ background: "transparent", marginBottom: 20 }}>
          <h2 className="h3" style={{ marginBottom: 16 }}>Tus datos</h2>
          <form onSubmit={guardar} className="stack">
            <div className="form-grid">
              <div className="field"><label className="label" htmlFor="c-nombre">Nombre</label><input id="c-nombre" className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={100} autoComplete="given-name" /></div>
              <div className="field"><label className="label" htmlFor="c-apellidos">Apellidos</label><input id="c-apellidos" className="input" value={apellidos} onChange={(e) => setApellidos(e.target.value)} maxLength={150} autoComplete="family-name" /></div>
            </div>
            <dl className="dl">
              <dt>Email</dt><dd>{user.email} {user.emailVerified ? <span className="chip chip-ok">✓ Verificado</span> : <span className="chip">Sin verificar</span>}</dd>
              <dt>Acceso</dt><dd>{[conPassword && "Email y contraseña", conGoogle && "Google"].filter(Boolean).join(" · ")}</dd>
            </dl>
            <p className="hint" style={{ margin: 0 }}>Estos datos son privados. Tu ficha pública de artista se edita en «Ficha de artista».</p>
            <div className="actions"><button type="submit" className="btn btn-primary">Guardar</button></div>
          </form>
        </section>

        <section className="panel" style={{ background: "transparent", marginBottom: 20 }}>
          <h2 className="h3" style={{ marginBottom: 16 }}>Seguridad</h2>
          <div className="actions">
            {conPassword ? <button type="button" className="btn" onClick={async () => { await sendPasswordResetEmail(auth, user.email!).catch(() => {}); setMsg({ t: "ok", m: `Te hemos enviado un enlace a ${user.email} para cambiar la contraseña.` }); }}>Cambiar contraseña</button> : null}
            {!user.emailVerified && conPassword ? <button type="button" className="btn" onClick={async () => { await sendEmailVerification(user).catch(() => {}); setMsg({ t: "ok", m: "Te hemos enviado un email para verificar tu dirección." }); }}>Verificar mi email</button> : null}
            <button type="button" className="btn" onClick={async () => { await signOut(auth); router.replace("/"); }}>Cerrar sesión</button>
          </div>
        </section>

        <section className="panel" style={{ background: "transparent", borderColor: "#5a2a2e" }}>
          <h2 className="h3" style={{ marginBottom: 8 }}>Eliminar mi cuenta</h2>
          <p className="soft" style={{ marginTop: 0 }}>Se borran tu cuenta, tus listas y tus datos privados. Las obras y fichas públicas que hayas creado se quedan en Ziater, porque forman parte del archivo común. Tus notas siguen contando en las medias, sin tu nombre.</p>
          <div className="field" style={{ maxWidth: 360 }}>
            <label className="label" htmlFor="c-borrar">Escribe ELIMINAR para confirmar</label>
            <input id="c-borrar" className="input" value={borrar} onChange={(e) => setBorrar(e.target.value)} autoComplete="off" />
          </div>
          <button type="button" className="btn" style={{ marginTop: 12, borderColor: "#8e1e24" }} disabled={borrar.trim() !== "ELIMINAR"} onClick={eliminar}>Eliminar mi cuenta para siempre</button>
        </section>
      </main>
    </>
  );
}
