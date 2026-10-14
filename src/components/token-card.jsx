import useWowTokenPrice from "../hooks/useWowTokenPrice";

export default function TokenCard() {
  const { data, isPending, isError } = useWowTokenPrice();
  const lastUpdated = new Date(data?.lastUpdated);
  const price = data?.price;
  const gold =
    typeof price === "number" && Number.isFinite(price)
      ? new Intl.NumberFormat("es-CL").format(Math.floor(price / 10_000))
      : null;

  return (
    <section className="rounded-2xl border border-orange/50 bg-slate p-5 shadow-xl">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-dorado/75">
        Ficha WoW · US
      </h2>
      {isPending ? (
        <p role="status" className="mt-3 text-sm text-dorado/70">
          Consultando ficha...
        </p>
      ) : isError ? (
        <p role="alert" className="mt-3 text-sm text-red-300">
          No se pudo consultar la API.
        </p>
      ) : (
        <div className="mt-3">
          <p className="text-3xl font-bold text-dorado">
            {gold ?? "—"}
            <span className="ml-1 text-base text-dorado-fuerte">g</span>
          </p>
          <p className="mt-1 text-xs text-dorado/65 uppercase">
            Última mod. {""}
            {new Intl.DateTimeFormat("es-CL", {
              timeStyle: "short",
            }).format(lastUpdated)}
          </p>
        </div>
      )}
    </section>
  );
}
