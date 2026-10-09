import FarmTable from "./components/farm-table";
import CreateFarmForm from "./components/createfarm-form";
import AdminLogin from "./components/admin-login";

function App() {
  return (
    <>
      <header>
        <AdminLogin />
      </header>
      <section className="flex min-h-screen bg-neutral-800 text-white">
        <CreateFarmForm />
        <FarmTable />
      </section>
    </>
  );
}

export default App;
