import { useNavigate } from "react-router";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setBusy(true);
    setError("");

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });

    setBusy(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    navigate("/");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-fondo p-4 text-dorado">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg bg-slate p-6"
      >
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>
        <input
          name="email"
          type="email"
          placeholder="Correo"
          required
          className="w-full rounded bg-fondo p-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Contraseña"
          required
          className="w-full rounded bg-fondo p-2"
        />
        <button
          disabled={busy}
          className="rounded bg-dorado px-4 py-2 text-fondo"
        >
          {busy ? "Entrando..." : "Entrar"}
        </button>
        {error && (
          <p role="alert" className="text-red-300">
            {error}
          </p>
        )}
      </form>
    </main>
  );
}
