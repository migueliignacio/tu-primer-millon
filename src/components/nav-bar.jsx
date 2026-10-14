import { useState } from "react";
import { Link } from "react-router";
import { supabase } from "../lib/supabase";

export default function NavBar({ session, checkingSession }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <header className="border-b border-green/30">
      <nav aria-label="Navegación principal" className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="flex items-center gap-3 text-2xl font-black">
          <img src="/wowicon.png" alt="" className="h-8 w-8" />
          <span>WOW FARM</span>
        </Link>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {checkingSession ? (
            <span>Comprobando sesión...</span>
          ) : session ? (
            <>
              <span className="break-all">{session.user.email}</span>
              <button type="button" onClick={handleLogout} disabled={busy} className="rounded bg-green/50 px-4 py-2 disabled:opacity-50">
                {busy ? "Saliendo..." : "Cerrar sesión"}
              </button>
            </>
          ) : (
            <Link to="/login" className="rounded bg-dorado px-4 py-2 font-bold text-fondo">
              Iniciar sesión
            </Link>
          )}
        </div>
        {error && <p role="alert" className="w-full text-right text-red-300">{error}</p>}
      </nav>
    </header>
  );
}
