"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EmailAuthProvider, GoogleAuthProvider, deleteUser, reauthenticateWithCredential, reauthenticateWithPopup, sendEmailVerification, sendPasswordResetEmail, signOut, updateProfile, type User } from "firebase/auth";
import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
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
  const [borrarFicha, setBorrarFicha] = useState(false);
  const [pass, setPass] = useState("");
  const [pidePass, setPidePass] = useState(false);
  const [borrando, setBorrando] = useState(false);
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

  /**
   * Borrado de la cuenta y los datos personales:
   *  1. Se registra la solicitud (bajas/{uid}) para terminar lo que no se puede borrar desde el navegador
   *     (desvincular o borrar la ficha de artista, anonimizar sugerencias…). Lo procesa una tarea automática semanal.
   *  2. Se borran ya el perfil privado y el perfil de colaborador.
   *  3. Se borra la cuenta de acceso (puede pedir confirmar la identidad).
   */
  async function eliminar() {
    setBorrando(true);
    setMsg(null);
    try {
      // Firebase exige un inicio de sesión reciente para borrar la cuenta: se confirma antes de tocar nada
      if (pidePass) await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email!, pass));
      else if (conGoogle && !conPassword) await reauthenticateWithPopup(user, new GoogleAuthProvider());
      else if (conPassword) { setPidePass(true); setBorrando(false); return; }
      await setDoc(doc(db, "bajas", user.uid), { email: (user.email ?? "").slice(0, 200), fecha: serverTimestamp(), borrar_ficha: borrarFicha && Boolean(personaId), persona_id: personaId ?? "" });
      await deleteDoc(doc(db, "colaboradores", user.uid)).catch(() => {});
      await deleteDoc(doc(db, "users", user.uid)).catch(() => {});
      try { localStorage.removeItem("ziater-sesion"); } catch {}
      await deleteUser(user);
      router.replace("/");
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      setMsg({ t: "error", m: code === "auth/wrong-password" || code === "auth/invalid-credential" ? "La contraseña no es correcta."
        : code === "auth/popup-closed-by-user" ? "Has cerrado la ventana de Google. Vuelve a pulsar el botón para confirmar."
        : "No se pudo completar el borrado. Escríbenos desde Contacto (motivo «Borrar mis datos») y lo hacemos por ti." });
    } finally {
      setBorrando(false);
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

        <section className="panel panel-peligro" id="borrar">
          <h2 className="h3" style={{ marginBottom: 8 }}>Borrar mi cuenta y mis datos</h2>
          <p className="soft" style={{ marginTop: 0 }}>Al instante se borran tu cuenta de acceso, tu email, tu nombre, tus listas y tu perfil de colaborador. En un máximo de 7 días se completa el resto: tus sugerencias quedan sin tu nombre y tu ficha de artista deja de estar vinculada a ti (o se borra, si lo marcas abajo).</p>
          <p className="soft">Las obras y salas que hayas creado se quedan en Ziater porque forman parte del archivo común, ya sin estar a tu nombre. Tus puntuaciones siguen contando en las medias de forma anónima.</p>
          {personaId ? (
            <label className="casilla" htmlFor="c-ficha" style={{ marginBottom: 12 }}>
              <input id="c-ficha" type="checkbox" checked={borrarFicha} onChange={(e) => setBorrarFicha(e.target.checked)} />
              <span>Borrar también mi ficha pública de artista y mis créditos en las obras.</span>
            </label>
          ) : null}
          <div className="field" style={{ maxWidth: 360 }}>
            <label className="label" htmlFor="c-borrar">Escribe BORRAR para confirmar</label>
            <input id="c-borrar" className="input" value={borrar} onChange={(e) => setBorrar(e.target.value)} autoComplete="off" />
          </div>
          {pidePass ? (
            <div className="field" style={{ maxWidth: 360, marginTop: 12 }}>
              <label className="label" htmlFor="c-pass">Por seguridad, escribe tu contraseña</label>
              <input id="c-pass" type="password" className="input" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" autoFocus />
            </div>
          ) : null}
          <button type="button" className="btn btn-peligro" style={{ marginTop: 12 }} disabled={borrar.trim().toUpperCase() !== "BORRAR" || borrando || (pidePass && !pass)} onClick={eliminar}>{borrando ? "Borrando…" : "Borrar mi cuenta y mis datos"}</button>
        </section>
      </main>
    </>
  );
}
