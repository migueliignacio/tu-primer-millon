import FarmTable from "./components/farm-table";
import CreateFarmForm from "./components/createfarm-form";
import AdminLogin from "./components/admin-login";

function App() {
  return (
    <>
      <header>
        <AdminLogin />
      </header>
      <main>
        <CreateFarmForm />
      </main>
      <section className="flex min-h-screen bg-neutral-800 text-white">
        <FarmTable />
      </section>
    </>
  );
}

export default App;
