"use client";

import Link, { useT } from "@/components/Idioma";
import { CasillasCuenta } from "./Consentimientos";
import { EDAD_MINIMA, VERSION_TERMINOS } from "@/lib/consentimiento";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, useT } from "@/components/Idioma";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, authDisponible, db } from "@/lib/firebase-client";

const ERRORES: Record<string, string> = {
  "auth/invalid-credential": "Email o contraseña incorrectos.",
  "auth/user-not-found": "Email o contraseña incorrectos.",
  "auth/wrong-password": "Email o contraseña incorrectos.",
  "auth/email-already-in-use": "Ya hay una cuenta con ese email. Prueba a entrar.",
  "auth/weak-password": "La contraseña debe tener al menos 8 caracteres.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos.",
  "auth/popup-closed-by-user": "Se cerró la ventana de Google antes de terminar.",
  "auth/invalid-email": "Ese email no es válido.",
};

/** Solo se permiten redirecciones internas, para evitar ataques de redirección abierta. */
function safeNext(v: string | null, fallback: string) {
  return v && /^\/(?!\/)[\w\-/?=&#.%]*$/.test(v) ? v : fallback;
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const t = useT();
  const router = useRouter();
  const sp = useSearchParams();
  const profesional = sp.get("profesional") === "1";
  const next = safeNext(sp.get("next"), mode === "signup" ? (profesional ? "/panel/bienvenida" : "/") : "/panel");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [edad, setEdad] = useState(false);
  const [acepto, setAcepto] = useState(false);
  /** En el registro, edad y términos son obligatorios (también para entrar con Google). */
  function faltaConsentimiento() {
    if (mode !== "signup") return false;
    if (!edad) { setError(t("Para tener cuenta en Ziater necesitas tener al menos {EDAD_MINIMA} años.", { EDAD_MINIMA: EDAD_MINIMA })); return true; }
    if (!acepto) { setError(t("Para crear tu cuenta, acepta los términos de uso y la política de privacidad.")); return true; }
    return false;
  }

  async function guardarUsuario(uid: string, nombre: string, apellidos = "") {
    await setDoc(doc(db, "users", uid), {
      Nombre: nombre.slice(0, 100), Apellidos: apellidos.slice(0, 150),
      // Constancia del consentimiento dado en el registro (versión y fecha)
      ...(mode === "signup" ? { consentimiento: VERSION_TERMINOS, consentimiento_fecha: serverTimestamp() } : {}),
    }, { merge: true });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (faltaConsentimiento()) return;
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const password = String(f.get("password"));
    setBusy(true);
    setError("");
    try {
      if (mode === "signup") {
        if (password.length < 8) throw { code: "auth/weak-password" };
        const nombre = String(f.get("nombre")).trim();
        const apellidos = String(f.get("apellidos") ?? "").trim();
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: `${nombre} ${apellidos}`.trim() });
        await guardarUsuario(cred.user.uid, nombre, apellidos);
        await sendEmailVerification(cred.user).catch(() => {});
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.replace(next);
    } catch (err) {
      setError(t(ERRORES[(err as { code?: string }).code ?? ""] ?? "No se ha podido completar. Inténtalo de nuevo."));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (faltaConsentimiento()) return;
    setBusy(true);
    setError("");
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      const [nombre, ...rest] = (cred.user.displayName ?? "").split(" ");
      await guardarUsuario(cred.user.uid, nombre ?? "", rest.join(" "));
      router.replace(next);
    } catch (err) {
      setError(t(ERRORES[(err as { code?: string }).code ?? ""] ?? "No se ha podido entrar con Google."));
    } finally {
      setBusy(false);
    }
  }

  async function reset(form: HTMLFormElement | null) {
    const email = form ? String(new FormData(form).get("email") ?? "").trim() : "";
    if (!email) return setError(t("Escribe tu email y vuelve a pulsar «He olvidado mi contraseña»."));
    await sendPasswordResetEmail(auth, email).catch(() => {});
    // Mismo mensaje exista o no la cuenta: no revela qué emails están registrados
    setInfo(t("Si hay una cuenta con ese email, te hemos enviado un enlace para cambiar la contraseña."));
  }

  return (
    <main className="wrap section" style={{ maxWidth: 480 }}>
      {profesional ? <p className="eyebrow" style={{ marginBottom: 12 }}>{t("Soy profesional")}</p> : null}
      <h1 className="h1" style={{ fontSize: 44, marginBottom: 8 }}>{mode === "signup" ? t("Crea tu cuenta") : t("Entrar")}</h1>
      {!authDisponible ? (
        <p className="panel panel-foco" role="alert" style={{ margin: "16px 0 24px" }}>{t("El acceso con cuenta todavía no está activado en esta versión de Ziater. Vuelve en un rato.")}</p>
      ) : null}
      <p className="soft" style={{ marginBottom: 28 }}>
        {mode === "signup"
          ? profesional ? t("Después buscaremos si ya tienes ficha para que la reclames.") : t("Guarda obras, sigue artistas y crea tu ficha si eres profesional.")
          : t("Bienvenido de nuevo a Ziater.")}
      </p>
      {mode === "signup" ? <div className="panel" style={{ marginBottom: 16 }}><CasillasCuenta edad={edad} acepto={acepto} onEdad={(v) => { setEdad(v); setError(""); }} onAcepto={(v) => { setAcepto(v); setError(""); }} idPrefijo="reg" /></div> : null}
      <button type="button" className="btn btn-light btn-lg" style={{ width: "100%" }} onClick={google} disabled={busy}>{t("Continuar con Google")}</button>
      <p className="muted" style={{ textAlign: "center", margin: "18px 0" }}>{t("o con tu email")}</p>
      <form onSubmit={onSubmit} className="stack" id="auth-form">
        {mode === "signup" ? (
          <div className="form-grid">
            <div className="field"><label className="label" htmlFor="nombre">{t("Nombre")}</label><input id="nombre" name="nombre" className="input" required maxLength={100} autoComplete="given-name" /></div>
            <div className="field"><label className="label" htmlFor="apellidos">{t("Apellidos")}</label><input id="apellidos" name="apellidos" className="input" maxLength={150} autoComplete="family-name" /></div>
          </div>
        ) : null}
        <div className="field"><label className="label" htmlFor="email">{t("Email")}</label><input id="email" name="email" type="email" className="input" required autoComplete="email" maxLength={200} /></div>
        <div className="field">
          <label className="label" htmlFor="password">{t("Contraseña")}</label>
          <input id="password" name="password" type="password" className="input" required minLength={mode === "signup" ? 8 : 1} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
          {mode === "signup" ? <span className="hint">{t("Mínimo 8 caracteres.")}</span> : null}
        </div>
        {error ? <p className="error" role="alert">{error}</p> : null}
        {info ? <p className="ok" role="status">{info}</p> : null}
        <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>{busy ? t("Un momento…") : mode === "signup" ? t("Crear cuenta") : t("Entrar")}</button>
        {mode === "login" ? (
          <button type="button" className="btn btn-ghost" onClick={() => reset(document.getElementById("auth-form") as HTMLFormElement)}>{t("He olvidado mi contraseña")}</button>
        ) : null}
      </form>
      <p className="soft" style={{ marginTop: 24 }}>
        {mode === "signup" ? <>{t("¿Ya tienes cuenta?")}{" "}<Link href={`/login?next=${encodeURIComponent(next)}`} style={{ color: "var(--foco)" }}>{t("Entra")}</Link></> : <>{t("¿No tienes cuenta?")}{" "}<Link href="/signup" style={{ color: "var(--foco)" }}>{t("Regístrate")}</Link></>}
      </p>
    </main>
  );
}
