import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminLogin() {
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });

    setError(loginError?.message ?? "");
  }

  return (
    <form onSubmit={handleLogin}>
      <input name="email" type="email" placeholder="Correo" required />
      <input
        name="password"
        type="password"
        placeholder="Contraseña"
        required
      />
      <button type="submit">Entrar</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
