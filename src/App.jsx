import { useEffect, useState } from "react";
import FarmTable from "./components/farm-table";
import CreateFarmForm from "./components/createfarm-form";
import AdminLogin from "./components/admin-login";
import { supabase } from "./lib/supabase";

function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error(error);
      setSession(data.session);
      setCheckingSession(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setCheckingSession(false);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-800 text-white">
      <header className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="text-3xl font-bold">Farmeos</h1>
        {checkingSession ? <p>Comprobando sesión...</p> : <AdminLogin session={session} />}
      </header>
      {session && <main className="mx-auto max-w-7xl px-4 pb-6"><CreateFarmForm /></main>}
      <section className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16">
        <FarmTable canEdit={Boolean(session)} />
      </section>
    </div>
  );
}

export default App;
