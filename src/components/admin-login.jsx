import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminLogin({ session }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setBusy(true);
    setError("");
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
    } catch (loginError) {
      setError(loginError.message || "No se pudo iniciar sesión.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    setError("");
    try {
      const { error: logoutError } = await supabase.auth.signOut();
      if (logoutError) throw logoutError;
    } catch (logoutError) {
      setError(logoutError.message || "No se pudo cerrar sesión.");
    } finally {
      setBusy(false);
    }
  }

  if (session) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span>Sesión iniciada: {session.user.email}</span>
        <button type="button" onClick={handleLogout} disabled={busy} className="rounded bg-neutral-600 px-4 py-2 disabled:opacity-50">{busy ? "Saliendo..." : "Cerrar sesión"}</button>
        {error && <p role="alert" className="text-red-300">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-neutral-700 p-4">
      <label className="flex flex-col gap-1">Correo
        <input name="email" type="email" autoComplete="username" required className="rounded border border-neutral-500 bg-neutral-900 px-3 py-2 text-white" />
      </label>
      <label className="flex flex-col gap-1">Contraseña
        <input name="password" type="password" autoComplete="current-password" required className="rounded border border-neutral-500 bg-neutral-900 px-3 py-2 text-white" />
      </label>
      <button type="submit" disabled={busy} className="rounded bg-amber-500 px-4 py-2 font-bold text-neutral-950 disabled:opacity-50">{busy ? "Entrando..." : "Entrar"}</button>
      {error && <p role="alert" className="w-full text-red-300">{error}</p>}
    </form>
  );
}
