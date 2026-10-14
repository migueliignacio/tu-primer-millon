import { useEffect, useState } from "react";
import FarmTable from "./components/farm-table";
import CreateFarmForm from "./components/createfarm-form";
import { supabase } from "./lib/supabase";
import TokenCard from "./components/token-card";
import NavBar from "./components/nav-bar";

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
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setCheckingSession(false);
      },
    );
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-fondo text-dorado">
      <NavBar session={session} checkingSession={checkingSession} />
      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:self-start">
          <TokenCard />
        </aside>
        <div className="min-w-0 space-y-6 pb-10">
          <h2 className="text-3xl font-bold">Farmeos</h2>
          {session && <CreateFarmForm />}
          <FarmTable canEdit={Boolean(session)} />
        </div>
      </main>
    </div>
  );
}

export default App;
