import { useState } from "react";
import FarmTable from "./components/farm-table";

function App() {
  return (
    <>
      <section className="flex min-h-screen bg-neutral-800 text-white">
        <FarmTable />
      </section>
    </>
  );
}

export default App;
